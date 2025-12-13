/**
 * AI Service using CometAPI with Gemini model - OPTIMIERT
 * Handles chat completions for the form assistant
 */

const API_KEY = import.meta.env.VITE_COMET_API_KEY || 'sk-eQswrHDAMib6n6uxBXHWyZEd1ABdsAAY0JbuoXQ7Rxl1GkrZ';
const API_URL = 'https://api.cometapi.com/v1/chat/completions';
const MODEL = import.meta.env.VITE_COMET_MODEL || 'gemini-2.5-pro';

/**
 * Create the system prompt for Finny - OPTIMIERT für kompakte Antworten
 */
function createSystemPrompt(fileName, fields) {
    const fieldNames = fields.map(f => `${f.name} (${f.type})`).join(', ');

    return `Rolle: Professioneller Assistent der dem User Hilf PDF-Antragsdaten auszufüllen.
    
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
 * Extract field values from user message - AUTO-FILL
 */
function extractFieldValues(userMessage, fields, filledFields = {}) {
    const updates = {};
    const message = userMessage.toLowerCase();

    // Try to match field names in the message
    fields.forEach(field => {
        const fieldNameLower = field.name.toLowerCase();

        // Skip if already filled
        if (filledFields[field.name]) return;

        // Simple extraction for common patterns
        if (message.includes(fieldNameLower)) {
            // Get text after field name
            const regex = new RegExp(fieldNameLower + '\\s*:?\\s*([^,\\.]+)', 'i');
            const match = message.match(regex);
            if (match && match[1]) {
                updates[field.name] = match[1].trim();
            }
        }
    });

    return updates;
}

/**
 * Send a message to the AI and get a response - OPTIMIERT
 */
export async function sendMessage(messages, context) {
    try {
        console.log('🤖 Sending message to CometAPI...');

        const systemMessage = {
            role: 'system',
            content: createSystemPrompt(context.fileName, context.fields),
        };

        const requestBody = {
            model: MODEL,
            messages: [systemMessage, ...messages],
            temperature: 0.5, // Reduziert für schnellere, fokussiertere Antworten
            max_tokens: 800, // ERHÖHT von 500 - verhindert Satz-Abbrüche
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        console.log('CometAPI request:', {
            model: MODEL,
            messageCount: requestBody.messages.length,
            temperature: requestBody.temperature,
            max_tokens: requestBody.max_tokens
        });

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

            console.log('CometAPI response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('❌ CometAPI error:', {
                    status: response.status,
                    error: errorData
                });
                throw new Error(errorData.error?.message || `CometAPI error: ${response.status}`);
            }

            const data = await response.json();

            // Validate response structure
            if (!data.choices || !data.choices.length || !data.choices[0].message) {
                console.error('Invalid CometAPI response format:', data);
                throw new Error('Ungültige Antwort von der KI (falsches Format).');
            }

            const content = data.choices[0].message.content;

            // Extract any field values from the last user message
            const lastUserMessage = messages[messages.length - 1];
            let fieldUpdates = {};

            if (lastUserMessage && lastUserMessage.role === 'user') {
                fieldUpdates = extractFieldValues(lastUserMessage.content, context.fields, context.filledFields);
                console.log('🔍 Auto-extracted field values:', fieldUpdates);
            }

            console.log('✅ Got AI response:', content.substring(0, 150) + '...');

            return {
                content,
                fieldUpdates // Return extracted field values
            };
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Zeitüberschreitung bei der Anfrage. Bitte versuche es erneut.');
            }
            throw error;
        }
    } catch (error) {
        console.error('❌ AI service error:', error);
        throw error;
    }
}

/**
 * Generate the filled fields JSON from the conversation
 */
export async function generateFilledJson(messages, context) {
    try {
        console.log('📋 Generating filled JSON from conversation...');

        const fieldNames = context.fields.map(f => f.name);

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
                    ...messages,
                    { role: 'user', content: prompt }
                ],
                temperature: 0.1,
                max_tokens: 3000, // Erhöht für große Formulare
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to generate filled JSON');
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        console.log('Raw AI JSON response:', content);

        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            console.error('Could not find JSON in response:', content);
            throw new Error('Could not parse JSON from response');
        }

        const fields = JSON.parse(jsonMatch[0]);
        console.log('✅ Generated filled JSON:', fields);

        return { fields };
    } catch (error) {
        console.error('❌ Generate JSON error:', error);
        throw error;
    }
}

/**
 * Start the conversation with an initial greeting - OPTIMIERT
 */
export async function startConversation(context) {
    console.log('👋 Starting conversation...');

    const initialMessage = {
        role: 'user',
        content: `Ich habe "${context.fileName}" mit ${context.fields.length} Feldern hochgeladen. Hilf mir beim Ausfüllen!`,
    };

    return sendMessage([initialMessage], context);
}

export default {
    sendMessage,
    generateFilledJson,
    startConversation,
};
