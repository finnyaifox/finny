/**
 * AI Service using CometAPI with the specific Gemini model requested.
 * Handles chat completions for the AI Form Assistant.
 */

const API_KEY = import.meta.env.VITE_COMET_API_KEY || 'sk-eQswrHDAMib6n6uxBXHWyZEd1ABdsAAY0JbuoXQ7Rxl1GkrZ';
const API_URL = 'https://api.cometapi.com/v1/chat/completions';
const MODEL = 'gemini-2.5-pro-all'; // Explicitly set as requested

/**
 * Creates the system prompt for the AI.
 * Includes precise instructions for role, context, and behavior.
 */
function createSystemPrompt(fileName, fields) {
    const fieldNames = fields.map(f => `${f.name} (${f.type})`).join(', ');

    return `Rolle: Professioneller Assistent der dem User hilft PDF-Antragsdaten auszufüllen.
    
Anweisung: Begrüße den Benutzer sofort mit 'Hallo! Ich bin Finny Ihr digitaler Assistent für Ihre Antragsdaten.' und erkläre das Vorgehen: 'Ich habe ${fields.length} Felder extrahiert. Welche möchten Sie prüfen?'

Kontext: Verwende das PDF Formular "${fileName}" und die extrahierten Felder als Kontext für die Konversation.
Felder Liste: ${fieldNames}

Fehlerresilienz: Stelle sicher, dass du nicht abstürzt, wenn Felder wie 'Ort und Nummer des Registereintrages' fehlen, sondern diese einfach überspringst oder nachfragst.

DEINE AUFGABEN:
1. Stelle PRÄZISE, KOMPAKTE Fragen
2. NIEMALS Sätze abbrechen - stelle IMMER vollständige Fragen
3. Fasse MEHRERE verwandte Felder in EINER Frage zusammen wenn möglich
4. Antworte KURZ aber VOLLSTÄNDIG
5. Nutze klare, direkte Sprache`;
}

/**
 * Extracts field values from the user's message using regex and heuristics.
 */
function extractFieldValues(userMessage, fields, filledFields = {}) {
    const updates = {};
    const message = userMessage.toLowerCase();

    // Try to match field names in the message
    fields.forEach(field => {
        const fieldNameLower = field.name.toLowerCase();

        // Skip if already filled
        if (filledFields[field.name]) return;

        // Simple extraction for common patterns: "Field: Value" or "Field Value"
        if (message.includes(fieldNameLower)) {
            // Get text after field name (handles : and whitespace)
            const regex = new RegExp(fieldNameLower + '\\s*:?\\s*([^,\\.\\n]+)', 'i');
            const match = message.match(regex);
            if (match && match[1]) {
                updates[field.name] = match[1].trim();
            }
        }
    });

    return updates;
}

/**
 * Sends a message to the AI and gets a response.
 * Uses the CometAPI with the configured Gemini model.
 */
export async function sendMessage(messages, context) {
    try {
        console.log('🤖 Sending message to CometAPI...', MODEL);

        // Ensure the System Message is always first
        const systemMessage = {
            role: 'system',
            content: createSystemPrompt(context.fileName, context.fields),
        };

        // Combine system message with conversation history
        // Filter out any potential previous system messages to avoid duplication if passed in 'messages'
        const conversationMessages = messages.filter(m => m.role !== 'system');

        const requestBody = {
            model: MODEL,
            messages: [systemMessage, ...conversationMessages],
            temperature: 0.5,
            max_tokens: 1000, // Increased for safety
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout

        console.log('CometAPI Request Body:', JSON.stringify(requestBody, null, 2));

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            console.log('CometAPI Response Status:', response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('❌ CometAPI error:', errorData);
                throw new Error(errorData.error?.message || `CometAPI error: ${response.status}`);
            }

            const data = await response.json();

            // Log full response for debugging
            // console.log('CometAPI Raw Data:', data);

            // Validate response structure
            if (!data.choices || !data.choices.length || !data.choices[0].message) {
                console.error('Invalid CometAPI response format:', data);
                throw new Error('Ungültige Antwort von der KI (falsches Format).');
            }

            const content = data.choices[0].message.content;

            if (!content || content.trim() === '') {
                console.warn('AI response was empty.');
                throw new Error('Die KI hat eine leere Antwort gesendet. Bitte versuche es noch einmal.');
            }

            // Extract any field values from the LAST user message
            const lastUserMessage = conversationMessages[conversationMessages.length - 1];
            let fieldUpdates = {};

            if (lastUserMessage && lastUserMessage.role === 'user') {
                fieldUpdates = extractFieldValues(lastUserMessage.content, context.fields, context.filledFields);
                console.log('🔍 Auto-extracted field values:', fieldUpdates);
            }

            console.log('✅ AI Response Content:', content.substring(0, 100) + '...');

            return {
                content,
                fieldUpdates
            };

        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Zeitüberschreitung bei der Anfrage. Die KI braucht zu lange.');
            }
            throw error;
        }
    } catch (error) {
        console.error('❌ AI service final error:', error);
        throw error;
    }
}

/**
 * Helper to generate the JSON for filling the PDF.
 */
export async function generateFilledJson(messages, context) {
    const fieldNames = context.fields.map(f => f.name);
    // ... logic same as before but using the correct model ...
    try {
        console.log('📋 Generating filled JSON...');

        const prompt = `Erstelle ein JSON-Array mit ALLEN Formularfeldern.
FELDER: ${fieldNames.join(', ')}
BEREITS AUSGEFÜLLT: ${JSON.stringify(context.filledFields)}
FORMAT (NUR das JSON-Array, nichts anderes):
[
  {"name": "feldname1", "value": "wert1"},
  {"name": "feldname2", "value": "wert2"}
]`;

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: 'user', content: prompt }
                ],
                temperature: 0.1,
                max_tokens: 3000,
            }),
        });

        if (!response.ok) throw new Error('Failed to generate filled JSON');

        const data = await response.json();
        const content = data.choices[0].message.content;

        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error('Could not parse JSON from response');

        const fields = JSON.parse(jsonMatch[0]);
        return { fields };
    } catch (error) {
        console.error('generateFilledJson error:', error);
        throw error;
    }
}

/**
 * Starts the conversation.
 * Sends the initial context and prompts the AI to greet the user.
 */
export async function startConversation(context) {
    console.log('👋 Starting conversation with context:', context.fileName);

    // The instructions in the System Prompt tell the AI to greet immediately.
    // We send a hidden user prompt to kick it off.
    const initialMessage = {
        role: 'user',
        content: `Ich habe das Formular "${context.fileName}" hochgeladen. Bitte starte jetzt.`
    };

    return sendMessage([initialMessage], context);
}

export default {
    sendMessage,
    generateFilledJson,
    startConversation,
    createSystemPrompt // Exported for debugging if needed
};
