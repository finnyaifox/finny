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
// API Keys
// API Keys
const COMET_API_KEY = process.env.COMETAPI_KEY || process.env.VITE_COMET_API_KEY || 'sk-eQswrHDAMib6n6uxBXHWyZEd1ABdsAAY0JbuoXQ7Rxl1GkrZ';
const MODEL_NAME = process.env.MODEL_NAME || "gemini-2.5-pro-all";
const PDFCO_API_KEY = process.env.PDF_CO_API_KEY || process.env.VITE_PDFCO_API_KEY || 'leeonzo86@gmail.com_cYjsXcXA3N2FU2jD50NTtjbc4uhMQBtBHl5Wv8hN7GndcfgnQEu0W42g8oLyccos';

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
            comet: !!process.env.VITE_COMET_API_KEY,
            pdfco: !!process.env.VITE_PDFCO_API_KEY,
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

app.post('/api/chat', async (req, res) => {
    try {
        // Validation
        const { error, value } = chatSchema.validate(req.body);
        if (error) {
            Logger.warn('CHAT', 'Validation Error', error.details);
            return res.status(400).json({ success: false, error: 'Invalid Input' });
        }

        const { sessionId, messages, isExtraction, tempId, isSupport } = value;
        let { currentFieldIndex, collectedData } = value;

        // --- VARIANT C: SUPPORT CHAT ---
        if (isSupport) {
            const lastUserMsg = messages.filter(m => m.role === 'user').pop()?.content || '';
            Logger.info('SUPPORT', `Request received: ${lastUserMsg}`);

            try {
                // Strict implementation of User's requested JSON structure
                const requestBody = {
                    "model": MODEL_NAME, // "gemini-2.5-pro-all"
                    "messages": [
                        {
                            "role": "system",
                            "content": "Du bist Finny, der freundliche KI-Support für diese Webseite. Antworte IMMER auf Deutsch. Sei locker, hilfreich und nutze gerne Emojis 😊. Deine Antworten sollen kurz und prägnant sein. Hilf dem Nutzer bei Fragen zur Seite oder chatte einfach nett mit ihm."
                        },
                        {
                            "role": "user",
                            "content": lastUserMsg
                        }
                    ]
                };

                const aiRes = await axios.post('https://api.cometapi.com/v1/chat/completions', requestBody, {
                    headers: {
                        'Authorization': `Bearer ${COMET_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                });

                const rawContent = aiRes.data.choices?.[0]?.message?.content || 'Ich bin da, aber sprachlos.';
                const cleanContent = cleanAIResponse(rawContent);

                return res.json({
                    success: true,
                    content: cleanContent
                });

            } catch (err) {
                Logger.error('SUPPORT', 'Chat failed', err);
                return res.json({
                    success: true,
                    content: "⚠️ Fehler bei der Verbindung zur KI. Bitte versuche es später."
                });
            }
        }

        // --- VARIANT B: EXTRACTION STAGE ---
        if (isExtraction && tempId) {
            Logger.info('CHAT', `Starting EXTRACTION (Text-Parsing) for tempId: ${tempId}`);

            const filePath = path.join(UPLOAD_DIR, tempId);
            if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, error: 'Temp file not found' });

            // 1. EXTRACT TEXT LOCALLY (pdf-parse)
            // Equivalent to Python's PyPDF2 extraction
            const fileBuffer = fs.readFileSync(filePath);
            let pdfText = '';

            try {
                // Dynamically import or require pdf-parse since it's CJS
                // We use defaults for now, simple text extraction
                const pdf = (await import('pdf-parse/lib/pdf-parse.js')).default;
                const data = await pdf(fileBuffer);
                pdfText = data.text;

                if (!pdfText || !pdfText.strip()) {
                    // Fallback check
                    throw new Error('No text extracted');
                }
            } catch (pErr) {
                Logger.warn('PARSE', 'Local parse failed/empty, falling back or error', pErr);
                // If parse fails (scanned PDF?), we return error as per user example logic
                return res.status(400).json({ success: false, error: 'Error: No text extracted from PDF. The file might be a scanned document or empty.' });
            }

            // 2. BUILD PROMPT WITH TEXT
            // User Logic: Limit to 10000 chars
            const truncatedText = pdfText.substring(0, 10000);

            const extractPrompt = `Du bist ein PDF-Experte. Deine Aufgabe ist es, alle Formularfelder aus dem folgenden Dokumenteninhalt zu extrahieren.
Analysiere den Text und gib eine JSON-Liste aller Felder zurück.
Format:
[
  {"fieldName": "Name", "type": "text"},
  {"fieldName": "Vorname", "type": "text"},
  ...
]
Gib NUR das JSON zurück. Nichts anderes.

Document Content:
${truncatedText}`;

            // 3. CALL API (CometAPI)
            const requestBody = {
                model: MODEL_NAME, // "gemini-2.5-pro-all"
                messages: [
                    { role: 'user', content: extractPrompt }
                ],
                stream: false
            };

            Logger.info('CHAT', 'Sending extraction request to AI...');

            const aiRes = await axios.post('https://api.cometapi.com/v1/chat/completions', requestBody, {
                headers: {
                    'Authorization': `Bearer ${COMET_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000 // 30s timeout
            });

            const content = aiRes.data.choices?.[0]?.message?.content || '';

            // 4. PARSE AI RESPONSE
            // Try to find JSON array in markdown
            let fields = [];
            try {
                const jsonMatch = content.match(/\[.*\]/s);
                if (jsonMatch) {
                    fields = JSON.parse(jsonMatch[0]);
                } else {
                    // Fallback if no array found
                    Logger.warn('EXTRACT', 'AI did not return JSON array', content);
                    fields = [];
                }
            } catch (e) {
                Logger.error('EXTRACT', 'JSON Parse Error', e);
            }

            // Save session
            const newSessionId = `sess_${Date.now()}`;
            sessions.set(newSessionId, {
                id: newSessionId,
                fields,
                collectedData: {},
                currentFieldIndex: 0,
                tempId,
                pdfUrl: null // No URL yet, we have raw file
            });

            return res.json({
                success: true,
                fields,
                sessionId: newSessionId,
                message: `✅ Analyse abgeschlossen: ${fields.length} Felder im Text erkannt.`
            });
        }

        // --- CHAT LOGIC (Variant A & B) ---
        // Ensure session exists if we are mid-way
        let session = sessionId ? sessions.get(sessionId) : null;

        // If Request sends explicit state (Variant A client-side state), use it
        if (!session && collectedData && messages) {
            // Stateless / Client-Managed State (Variant A)
            session = {
                fields: req.body.fields || [], // Variant A often sends context logic in prompt, or we rely on client index
                collectedData: collectedData || {},
                currentFieldIndex: currentFieldIndex || 0
            };
            // Note: Variant A in current frontend logic manages state on Client. 
            // We need to support that.
        }

        // Identify current field for Context
        // For Client-Side State: Field is passed in context or we deduce it?
        // User's Prompt: "Du hast eine vorbereitete Liste... Dein Job ist User zu führen"
        // Frontend `aiService.js` currently sends context with `fields`.

        // Let's reconstruct the "Context" based on the request body provided by frontend
        // Frontend sends: messages, context: { fields, filledFields, fileName }
        // We map this to our internal logic

        const clientContext = req.body.context || {}; // { fields, filledFields, fileName }
        const fields = session?.fields || clientContext.fields || [];
        const filledData = collectedData || clientContext.filledFields || {};
        // Find first unfilled field or use explicit index
        // We prefer explicit index if given, else derive
        let activeFieldIndex = currentFieldIndex !== undefined ? currentFieldIndex : 0;

        // Heuristic: Find first missing field if index not valid
        if (!fields[activeFieldIndex] || filledData[fields[activeFieldIndex].name]) {
            activeFieldIndex = fields.findIndex(f => !filledData[f.name]);
            if (activeFieldIndex === -1) activeFieldIndex = fields.length; // All done
        }

        const currentField = fields[activeFieldIndex];
        const lastUserMsg = messages.filter(m => m.role === 'user').pop()?.content || '';

        // --- CASE: ALL DONE ---
        if (!currentField) {
            return res.json({
                success: true,
                content: '🎉 Alle Felder sind ausgefüllt! Klicke bitte auf "Vorschau" oder "PDF erstellen" um abzuschließen.',
                action: 'completed'
            });
        }

        // --- CASE: INTRO ---
        // Managed by Frontend usually, but if backend sees 0 messages:
        // if (messages.length <= 1 && activeFieldIndex === 0) ... 

        // --- COMMANDS ---
        const lowerMsg = lastUserMsg.toLowerCase().trim();
        if (['weiter', 'skip', 'überspringen'].includes(lowerMsg)) {
            return res.json({
                success: true,
                content: `Okay, ich habe das Feld "${currentField.name}" übersprungen.`,
                fieldUpdates: { [currentField.name]: '' }, // Mark as empty
                action: 'skip'
            });
        }

        // --- AI GENERATION (Main Chat / Form Filling) ---
        // Using the same simple structure as Support to ensure stability

        const systemPrompt = `Du bist Finny, ein professioneller und freundlicher PDF-Assistent. 🦊
Aktuelles Feld: "${currentField.name}" (${currentField.type || 'Text'})
Fortschritt: ${activeFieldIndex + 1} von ${fields.length}.

DEINE AUFGABE:
1. Validiere die User-Eingabe "${lastUserMsg}" für das Feld "${currentField.name}".
2. Wenn gültig: Bestätige kurz ("✅ Gespeichert" o.ä.) und fordere zur Eingabe des NÄCHSTEN Feldes auf: "${fields[activeFieldIndex + 1]?.name || 'Das Formular ist nun vollständig!'}".
3. Wenn ungültig: Erkläre freundlich den Fehler.
4. Sei locker, nutze Emojis, aber bleib effizient.

ANTWORT-FORMAT:
Antworte direkt im Chat-Stil. Keine technischen Tags.`;

        const requestBody = {
            model: MODEL_NAME,
            messages: [
                { role: 'system', content: systemPrompt },
                ...messages.filter(m => m.role !== 'system') // User history
            ]
        };

        const aiRes = await axios.post('https://api.cometapi.com/v1/chat/completions', requestBody, {
            headers: {
                'Authorization': `Bearer ${COMET_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        const rawContent = aiRes.data.choices?.[0]?.message?.content || 'Entschuldigung, ich konnte das nicht verarbeiten.';
        const cleanContent = cleanAIResponse(rawContent);

        // Auto-Extract value mechanism (Simple heuristic override if AI confirms)
        // Check if AI says "Stored" or confirms valid
        // We trust the AI Response mostly, but we also want to return the 'fieldUpdates' key so the frontend updates state.
        // Simple Logic: If it wasn't a "Help" command, we assume input is the value.
        // Ideally we ask AI to produce JSON, but user wanted "Chat".
        // Use the existing 'extractFieldValues' logic approach or just assume current input = current field value.

        return res.json({
            success: true,
            content: cleanContent,
            fieldUpdates: { [currentField.name]: lastUserMsg } // Assume valid for now, usually AI prompts for retry if invalid
        });

    } catch (err) {
        Logger.error('CHAT', 'Failed', err);
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

            const formData = new FormData();
            formData.append('file', fs.createReadStream(filePath));

            const uploadRes = await axios.post('https://api.pdf.co/v1/file/upload', formData, {
                headers: { 'x-api-key': PDFCO_API_KEY, ...formData.getHeaders() }
            });
            if (uploadRes.data.error) throw new Error(uploadRes.data.message);
            targetUrl = uploadRes.data.url;
        }

        if (!targetUrl) return res.status(400).json({ success: false, error: 'No PDF source found' });

        // CALL PDF.CO FILL
        // Format fields for PDF.co values
        const pdfCoFields = fields.map(f => ({
            fieldName: f.name,
            value: f.value?.toString() || ''
        }));

        const fillRes = await axios.post('https://api.pdf.co/v1/pdf/edit/fill', {
            url: targetUrl,
            fields: pdfCoFields,
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
