import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import Joi from 'joi';
import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000; // Render sets PORT automatically
// App läuft hinter Render-Proxy → IPs aus X-Forwarded-For vertrauen
app.set('trust proxy', 1);

// ============================================
// 🔒 SECURITY & CONFIG
// ============================================

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate Loading
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    startOnCreate: true, // Force start
    message: { success: false, error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Logger Helper
const Logger = {
    info: (context, msg) => console.log(`[${new Date().toISOString()}] [INFO] [${context}] ${msg}`),
    warn: (context, msg, data) => console.warn(`[${new Date().toISOString()}] [WARN] [${context}] ${msg}`, data || ''),
    error: (context, msg, err) => console.error(`[${new Date().toISOString()}] [ERROR] [${context}] ${msg}`, err)
};

// API Keys
const COMET_API_KEY = process.env.COMET_API_KEY || process.env.VITE_COMET_API_KEY;
const PDFCO_API_KEY = process.env.PDF_CO_API_KEY || process.env.VITE_PDF_CO_API_KEY;
const MODEL_NAME = process.env.MODEL_NAME || "gemini-2.5-pro-all";

// In-Memory Session Storage (For simplicity in this scale, use Redis in true prod)
// We store session state mostly for "Variant A" guidance context if needed, 
// though the client often sends state. For Variant B (Server Extraction), we MUST store the fields.
const sessions = new Map();

// Temp Storage Path
const UPLOAD_DIR = path.join(__dirname, 'temp', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// DEBUG: Log directory contents to find 'dist'
try {
    console.log('📂 Current Directory:', __dirname);
    console.log('📂 Root Files:', fs.readdirSync(__dirname));
    if (fs.existsSync(path.join(__dirname, 'dist'))) {
        console.log('📂 Dist Files:', fs.readdirSync(path.join(__dirname, 'dist')));
    } else {
        console.error('❌ DIST FOLDER NOT FOUND!');
    }
} catch (e) {
    console.error('Debug FS Error:', e);
}

// Multer Storage

// Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        // Safe filename: sessionId_timestamp.pdf
        const sanitizedOriginal = file.originalname.replace(/[^a-z0-9.]/gi, '_');
        cb(null, `upload_${Date.now()}_${sanitizedOriginal}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') cb(null, true);
        else cb(new Error('Only PDF files are allowed!'));
    }
});

// ============================================
// 📨 API ENDPOINTS
// ============================================

// --- 0. Health Check ---
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        env: {
  comet: !!(process.env.COMET_API_KEY || process.env.VITE_COMET_API_KEY),
  pdfco: !!(process.env.PDF_CO_API_KEY || process.env.VITE_PDF_CO_API_KEY),
  mode: process.env.NODE_ENV
}
    });
});

// --- 1. Upload Temp PDF (Variant B) ---
app.post('/api/upload-pdf-temp', upload.single('file'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

        const tempId = req.file.filename;
        const filePath = req.file.path;

        Logger.info('UPLOAD', `Temp file saved: ${tempId}`);

        // Auto-cleanup after 30 mins
        setTimeout(() => {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                Logger.info('CLEANUP', `Deleted temp file: ${tempId}`);
            }
        }, 30 * 60 * 1000);

        res.json({ success: true, tempId, originalName: req.file.originalname });

    } catch (err) {
        Logger.error('UPLOAD', 'Failed', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// --- 2. Chat & Logic (Variant A & B) ---
const chatSchema = Joi.object({
    sessionId: Joi.string().allow(null, ''), // Can be null initally
    messages: Joi.array().required(),
    currentFieldIndex: Joi.number().optional(),
    collectedData: Joi.object().optional(),
    // Variant B specifics
    isExtraction: Joi.boolean().optional(),
    tempId: Joi.string().optional(),
    isSupport: Joi.boolean().optional() // Allow Support Widget traffic
});

/**
 * Validates fields and provides hints
 */
function analyzeFieldType(fieldName) {
    const lower = fieldName.toLowerCase();
    if (lower.includes('datum') || lower.includes('date') || lower.includes('geburt')) {
        return { type: 'date', instruction: 'Bitte gib ein Datum ein.', example: '15.03.2024' };
    }
    if (lower.includes('mail')) {
        return { type: 'email', instruction: 'Bitte gib eine gültige E-Mail-Adresse ein.', example: 'name@beispiel.de' };
    }
    if (lower.includes('telefon') || lower.includes('fax') || lower.includes('nummer')) {
        return { type: 'phone', instruction: 'Bitte gib eine Telefonnummer ein.', example: '030 12345678' };
    }
    if (lower.includes('check') || lower.includes('wahl') || lower.includes('kreuz')) {
        return { type: 'checkbox', instruction: 'Möchtest du dieses Feld ankreuzen? (Ja/Nein)', example: 'Ja' };
    }
    return { type: 'text', instruction: 'Bitte fülle dieses Feld aus.', example: 'Mustertext' };
}

/**
 * Helper to remove internal chain-of-thought provided by some models
 */
function cleanAIResponse(text) {
    if (!text) return '';
    // Remove <think>...</think> blocks including newlines
    return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

// --- HELPER: Unified AI Call ---
async function callAI(messages, systemInstruction = null) {
    const payload = {
        model: MODEL_NAME, // "gemini-2.5-pro-all"
        messages: [
            // Combine System Prompt into messages if provided
            ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
            ...messages
        ],
        stream: false
    };

    console.log(`[AI-CALL] Sending ${payload.messages.length} msgs to ${MODEL_NAME}`);

    try {
        const aiRes = await axios.post('https://api.cometapi.com/v1/chat/completions', payload, {
            headers: {
                'Authorization': `Bearer ${COMET_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 60000 // 60s for extraction/long processing
        });

        const raw = aiRes.data.choices?.[0]?.message?.content || '';
        return cleanAIResponse(raw);

    } catch (err) {
        console.error('[AI-FAIL]', err.message, err.response?.data);
        return null; // Signal failure
    }
}

app.post('/api/chat', async (req, res) => {
    try {
        // Validation (simplified)
        const { error, value } = chatSchema.validate(req.body);
        if (error) return res.status(400).json({ success: false, error: 'Invalid Input' });

        const { sessionId, messages, isExtraction, tempId, isSupport } = value;
        let { currentFieldIndex, collectedData } = value;

        // ==========================================
        // 1. SUPPORT MODE
        // ==========================================
        if (isSupport) {
            const lastUserMsg = messages.filter(m => m.role === 'user').pop()?.content || '';
            Logger.info('SUPPORT', `Request: ${lastUserMsg}`);

            const supportSystemPrompt = `Du bist Finny, der professionelle KI-Support für 'Finny Web Solutions'.
KONTEXT: Du hilfst Usern bei ihren Web-Projekten (React, Node.js, Design).
TONALITY: Freundlich, locker, professionell. Nutze Emojis (😊, 🚀). Sprich IMMER Deutsch.
ANTWORTE: Kurz, präzise und lösungsorientiert.`;

            const reply = await callAI(
                messages.filter(m => m.role !== 'system'),
                supportSystemPrompt
            );

            return res.json({
                success: true,
                content: reply || "⚠️ Entschuldigung, ich habe gerade Verbindungsprobleme."
            });
        }

        // ==========================================
        // 2. EXTRACTION MODE (Full KI)
        // ==========================================
        if (isExtraction && tempId) {
            Logger.info('EXTRACT', `Processing TempID: ${tempId}`);
            const filePath = path.join(UPLOAD_DIR, tempId);

            if (!fs.existsSync(filePath)) return res.json({ success: false, error: 'Datei nicht gefunden.' });

            // A. Extract Text (pdf-parse)
            let pdfText = '';
            try {
                const fileBuffer = fs.readFileSync(filePath);
                const pdf = (await import('pdf-parse/lib/pdf-parse.js')).default;
                const data = await pdf(fileBuffer);
                pdfText = data.text || '';
            } catch (e) {
                Logger.error('EXTRACT', 'PDF Parse Error', e);
                return res.json({ success: false, error: 'Konnte Text nicht lesen (Scan?).' });
            }

            // B. AI Analysis
            const truncatedText = pdfText.substring(0, 15000); // 15k chars safety
            const extractPrompt = `ANALYSE DIESES DOKUMENTS:
${truncatedText}

AUFGABE:
Identifiziere alle relevanten Formular-Felder (Name, Datum, Unterschrift, Checkboxen etc.).
Gib NUR ein JSON-Array zurück. Format:
[{"name": "Vorname", "type": "text"}, {"name": "Geburtsdatum", "type": "date"}]
WICHTIG: Nutze den Key "name" für den Feldbezeichner!
Kein Markdown, nur JSON.`;

            const aiResponse = await callAI([{ role: 'user', content: extractPrompt }]);

            // C. Parse JSON
            let fields = [];
            try {
                // Find JSON array in text
                const jsonMatch = aiResponse.match(/\[.*\]/s);
                if (jsonMatch) {
                    fields = JSON.parse(jsonMatch[0]);
                    // Normalize fields (ensure 'name' property exists)
                    fields = fields.map(f => ({
                        name: f.name || f.fieldName || 'Unbenannt',
                        type: f.type || 'text'
                    }));
                }
            } catch (e) {
                Logger.warn('EXTRACT', 'JSON Fail', aiResponse);
            }

            // Save basic session
            const newSessionId = `sess_${Date.now()}`;
            sessions.set(newSessionId, {
                id: newSessionId,
                fields,
                collectedData: {},
                currentFieldIndex: 0,
                tempId
            });

            return res.json({
                success: true,
                fields,
                sessionId: newSessionId,
                message: fields.length > 0
                    ? `✅ Analyse fertig! Ich habe ${fields.length} Felder gefunden. Sollen wir sie ausfüllen?`
                    : "⚠️ Ich konnte keine Felder sicher erkennen. Aber wir können trotzdem chatten!"
            });
        }

        // ==========================================
        // 3. FORM FILLING MODE (Standard Chat)
        // ==========================================

        // Reconstruct Context
        let session = sessionId ? sessions.get(sessionId) : null;
        if (!session && collectedData) {
            // Client-side state fallback
            session = {
                fields: req.body.context?.fields || [],
                collectedData
            };
        }

        const fields = session?.fields || [];
        // Determine active field
        let activeFieldIndex = currentFieldIndex || 0;

        // Simple heuristic search: Find first field that has NO value in collectedData
        if (fields.length > 0) {
            const foundIndex = fields.findIndex(f => !collectedData[f.name]);
            if (foundIndex !== -1) {
                activeFieldIndex = foundIndex;
            } else {
                // If all fields have data -> Complete
                // BUT: Double check if we really have fields
                activeFieldIndex = fields.length;
            }
        }

        const currentField = fields[activeFieldIndex];
        const lastUserMsg = messages.filter(m => m.role === 'user').pop()?.content || '';

        // --- CASE: INTRO (Start of conversation) ---
        // If user says nothing yet or just started (heuristic)
        // Usually frontend sends a hidden "init" or we inspect history length
        const userMsgCount = messages.filter(m => m.role === 'user').length;
        if (userMsgCount === 0 && fields.length > 0) {
            return res.json({
                success: true,
                content: `Hallo! 👋 Ich bin Finny. Ich habe ${fields.length} Felder erkannt. Wollen wir mit "${fields[0].name}" beginnen?`,
                fieldUpdates: {}
            });
        }

        // --- CASE: ALL DONE ---
        if (!currentField && fields.length > 0) {
            return res.json({ success: true, content: "🎉 Das Formular ist komplett! Klicke auf 'Fertigstellen'.", action: 'completed' });
        }

        // System Prompt
        const formSystemPrompt = `Du bist Finny, der PDF-Assistent. 🦊
KONTEXT: Der User füllt ein Formular aus.
AKTUELLES FELD: "${currentField ? currentField.name : 'Allgemein'}" (${currentField ? (currentField.type || 'Text') : 'Info'}).
FORTSCHRITT: ${activeFieldIndex + 1} / ${fields.length}.

AUFGABE:
1. Prüfe die Eingabe "${lastUserMsg}".
2. Wenn sinnvoll: Bestätige kurz ("✅ Notiert") und frage nach dem NÄCHSTEN Feld.
3. Wenn Quatsch: Hilf dem User.
4. Sei kurz, locker und nutze Emojis.`;

        const reply = await callAI(
            messages.filter(m => m.role !== 'system'),
            formSystemPrompt
        );

        return res.json({
            success: true,
            content: reply || "...",
            fieldUpdates: currentField ? { [currentField.name]: lastUserMsg } : {}
        });

    } catch (err) {
        Logger.error('API', 'Global Error', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// --- 3. Fill PDF (Variant A & B) ---
app.post('/api/fill-pdf', async (req, res) => {
    try {
        const { sessionId, fields, tempId, pdfUrl } = req.body;

        Logger.info('FILL', `Filling PDF. TempId: ${tempId}, Url: ${pdfUrl}, Fields: ${fields?.length}`);

        let targetUrl = pdfUrl;

        // VARIANT B: Upload Temp File to PDF.co first if needed
if (!targetUrl && tempId) {
    const filePath = path.join(UPLOAD_DIR, tempId);
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, error: 'Original file lost' });

    // ✅ Base64 Upload (zuverlässiger)
    const fileBuffer = fs.readFileSync(filePath);
    const base64 = fileBuffer.toString('base64');

    const uploadRes = await axios.post('https://api.pdf.co/v1/file/upload/base64', {
        file: base64,
        name: tempId
    }, {
        headers: { 
            'x-api-key': PDFCO_API_KEY,
            'Content-Type': 'application/json'
        }
    });

    if (uploadRes.data.error) throw new Error(uploadRes.data.message);
    targetUrl = uploadRes.data.url;
}

        if (!targetUrl) return res.status(400).json({ success: false, error: 'No PDF source found' });

        // CALL PDF.CO FILL
        // Format fields for PDF.co values
        const fieldsArray = [];
let index = 1;

for (const field of fields) {
    if (field.value && field.value.toString().trim()) {
        fieldsArray.push(`${index};${field.name};${field.value}`);
        index++;
    }
}

const fieldsString = fieldsArray.join('|');

Logger.info('FILL', `FieldsString: ${fieldsString}`);

const fillRes = await axios.post('https://api.pdf.co/v1/pdf/edit/add', {
    url: targetUrl,
    fieldsString: fieldsString,  // ✅ Singular, nicht "fields"!
    async: false
}, { headers: { 'x-api-key': PDFCO_API_KEY } });
        if (fillRes.data.error) throw new Error(fillRes.data.message);

        // CLEANUP
        if (tempId) {
            const filePath = path.join(UPLOAD_DIR, tempId);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        res.json({ success: true, url: fillRes.data.url });

    } catch (err) {
        Logger.error('FILL', 'Failed', err);
        res.status(500).json({ success: false, error: err.message });
    }
});


// Serve Static Files
app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.static(path.join(__dirname, 'public'))); // For full-ki-mode.html and assets

// SPA Fallback: ALL unknown routes go to index.html (React App)
app.get(/.*/, (req, res) => {
    // Exception for specific standalone page if needed, but public static serves it first.
    // If the browser requests /full-ki-mode.html, express.static catches it.
    // If requests /foo implies React Router.

    // Check if it's the specific Full KI page explicitly requested via route if static failed?
    // generally static middleware handles real files.

    if (req.path === '/full-ki-mode.html') {
        res.sendFile(path.join(__dirname, 'public', 'full-ki-mode.html'));
        return;
    }

    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Init
app.listen(PORT, () => {
    Logger.info('SERVER', `Server running on port ${PORT}`);
});

// Error Safety
process.on('unhandledRejection', (reason, p) => {
    Logger.error('SYSTEM', 'Unhandled Rejection at Promise', reason);
});
