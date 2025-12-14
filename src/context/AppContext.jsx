import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { PdfService, AiService } from '../services/apiClient';
import { FINNY_SYSTEM_PROMPT } from '../utils/prompts';

// Initial state
const initialState = {
    // PDF State
    pdfUrl: null,
    pdfFileName: null,
    uploadMode: null, // 'standard' | 'full-ki'

    // Fields State
    fields: [],
    filledFields: {}, // { "FieldName": "Value" }
    currentFieldIndex: 0,

    // Chat State
    messages: [],
    isTyping: false,

    // App Status
    status: 'idle', // idle, uploading, chatting, done, demo
    error: null,

    // Result
    filledPdfUrl: null,

    // Demo mode
    isDemo: false,
    sessionId: null,
};

// Action types
const ACTIONS = {
    SET_STATUS: 'SET_STATUS',
    SET_ERROR: 'SET_ERROR',
    START_SESSION: 'START_SESSION', // New action to init everything
    UPDATE_FIELD: 'UPDATE_FIELD',
    ADD_MESSAGE: 'ADD_MESSAGE',
    SET_TYPING: 'SET_TYPING',
    SET_FILLED_PDF: 'SET_FILLED_PDF',
    RESET: 'RESET',
    START_DEMO: 'START_DEMO',
};

// Reducer
function appReducer(state, action) {
    switch (action.type) {
        case ACTIONS.SET_STATUS:
            return { ...state, status: action.payload, error: null };

        case ACTIONS.SET_ERROR:
            return { ...state, error: action.payload };

        case ACTIONS.START_SESSION:
            return {
                ...state,
                pdfUrl: action.payload.pdfUrl,
                pdfFileName: action.payload.fileName || 'Dokument',
                fields: action.payload.fields,
                uploadMode: action.payload.mode,
                filledFields: {},
                messages: [], // Reset messages
                currentFieldIndex: 0,
                status: 'chatting',
                error: null
            };

        case ACTIONS.UPDATE_FIELD:
            return {
                ...state,
                filledFields: {
                    ...state.filledFields,
                    [action.payload.name]: action.payload.value,
                },
            };

        case ACTIONS.ADD_MESSAGE:
            return {
                ...state,
                messages: [...state.messages, action.payload],
            };

        case ACTIONS.SET_TYPING:
            return { ...state, isTyping: action.payload };

        case ACTIONS.SET_FILLED_PDF:
            return {
                ...state,
                filledPdfUrl: action.payload,
                status: 'done',
            };

        case ACTIONS.START_DEMO:
            return {
                ...state,
                isDemo: true,
                status: 'demo',
                fields: action.payload.fields,
                pdfFileName: 'Demo-Formular.pdf',
                messages: [],
            };

        case ACTIONS.RESET:
            return initialState;

        default:
            return state;
    }
}

// Context
const AppContext = createContext(null);

// Provider component
export function AppProvider({ children }) {
    const [state, dispatch] = useReducer(appReducer, initialState);

    // Start a new session (called from Upload Components)
    const startSession = useCallback(async (data) => {
        // data: { mode, pdfUrl, fields, info?, file? }
        const fileName = data.file ? data.file.name : (data.info?.Title || 'Formular.pdf');

        dispatch({
            type: ACTIONS.START_SESSION,
            payload: {
                mode: data.mode,
                pdfUrl: data.pdfUrl,
                fields: data.fields,
                fileName: fileName
            }
        });

        // Trigger initial AI greeting
        await initAiChat(data.fields, fileName);
    }, []);

    const initAiChat = async (fields, fileName) => {
        dispatch({ type: ACTIONS.SET_TYPING, payload: true });
        try {
            // Initial Prompt to AI asking it to start
            const contextMsg = `Dokument: "${fileName}".\nAnzahl Felder: ${fields.length}.\nFelder-Liste: ${fields.map(f => f.name).join(', ')}.\n\nBitte starte jetzt den Dialog gemäß Teil 3 der Anleitung (Begrüßung + Dokumenttyp-Erkennung).`;

            const messages = [
                { role: 'system', content: FINNY_SYSTEM_PROMPT },
                { role: 'user', content: contextMsg }
            ];

            // Direct Call
            const reply = await AiService.chatCompletion(messages);

            dispatch({ type: ACTIONS.ADD_MESSAGE, payload: { role: 'assistant', content: reply } });
        } catch (e) {
            console.error(e);
            dispatch({ type: ACTIONS.SET_ERROR, payload: "Fehler beim Starten des Chats." });
        } finally {
            dispatch({ type: ACTIONS.SET_TYPING, payload: false });
        }
    };

    // Send message to AI
    const sendMessage = useCallback(async (text) => {
        if (!text.trim()) return;

        try {
            // 1. Add User Message
            dispatch({ type: ACTIONS.ADD_MESSAGE, payload: { role: 'user', content: text } });
            dispatch({ type: ACTIONS.SET_TYPING, payload: true });

            // 2. Prepare Context for AI
            // We include the full history + system prompt
            // We also inject current progress status as a system hint if needed, but history should suffice.
            // Heuristic for "Current Field": The AI tracks it, but we can help it.

            const conversationHistory = [
                { role: 'system', content: FINNY_SYSTEM_PROMPT },
                { role: 'system', content: `AKTUELLER STATUS:\nBisher ausgefüllt: ${JSON.stringify(state.filledFields)}\nVerbleibende Felder: ${state.fields.length - Object.keys(state.filledFields).length}` },
                ...state.messages, // all previous messages
                { role: 'user', content: text }
            ];

            // 3. AI Call
            const reply = await AiService.chatCompletion(conversationHistory);

            // 4. Parse Response for Field Updates (This is tricky with pure text response)
            // Strategy: We can ask AI to output a specific marker OR we use a second "Analysis" call.
            // PROMPT says: "Du erstellst daraus eine JSON-Struktur...".
            // BUT: "ANTWORT-STIL: Nur Chat-Text."

            // HYBRID APPROACH: Use a "Thought" chain or side-channel.
            // Since we can't easily do side-channel in one request without exposing JSON to user in chat,
            // we will run a SECOND silent call to extract the field value from the user's message using the AI.
            // "Extract the value for field X from this message."
            // Simplified for prototype: Use heuristics or a specific extraction prompt.

            // Let's do the EXTRACT call in background
            extractDataFromMessage(text, state.fields, state.filledFields);

            dispatch({ type: ACTIONS.ADD_MESSAGE, payload: { role: 'assistant', content: reply } });

        } catch (error) {
            console.error('Send message error:', error);
            dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        } finally {
            dispatch({ type: ACTIONS.SET_TYPING, payload: false });
        }
    }, [state.messages, state.fields, state.filledFields]);

    const extractDataFromMessage = async (userText, fields, filledFields) => {
        // Find which field is currently active (heuristic: first empty field)
        // Note: This matches the "backend" logic found in server.js
        const unfilledFields = fields.filter(f => !filledFields[f.name]);
        if (unfilledFields.length === 0) return;

        const currentField = unfilledFields[0];

        // Ask AI to normalize the value
        // "Extract value for 'Geburtsdatum' from 'Ich bin am 1. Mai 90 geboren'. Format: TT.MM.JJJJ"
        // This is robust.

        try {
            // Quick extraction (skipping full LLM for simple echoes)
            // But for robustness, let's just save the user text for now as the value
            // and validat on "Final Generate".
            // OR: use a fast LLM call.

            dispatch({ type: ACTIONS.UPDATE_FIELD, payload: { name: currentField.name, value: userText } });
            console.log(`📝 Updated field ${currentField.name} with "${userText}"`);
        } catch (e) {
            console.error("Extraction failed", e);
        }
    };

    // Update a field value manually
    const updateField = useCallback((name, value) => {
        dispatch({ type: ACTIONS.UPDATE_FIELD, payload: { name, value } });
    }, []);

    // Generate filled PDF
    const generatePdf = useCallback(async () => {
        try {
            dispatch({ type: ACTIONS.SET_STATUS, payload: 'generating' });

            const fieldsPayload = Object.entries(state.filledFields).map(([k, v]) => ({
                fieldName: k,
                pages: "0", // Default to page 0 if unknown, PDF.co often handles name-matching
                text: v
            }));

            // Format for PDF.co forms/fill: Array of string "page;name;value" joined by |
            // My apiClient supports the object array too if implemented right, 
            // but let's stick to the string format from previous server.js logic to be safe,
            // OR checks apiClient implementation.
            // apiClient.js uses `fields: fields` JSON.
            // PDF.co /pdf/forms/fill accepts "fields" as array of objects.
            // { "url": "...", "fields": [ { "name": "field1", "value": "value1" } ] }

            const cleanFields = Object.entries(state.filledFields).map(([k, v]) => ({
                name: k,
                value: v
            }));

            const result = await PdfService.fillPdfForm(state.pdfUrl, cleanFields);

            dispatch({ type: ACTIONS.SET_FILLED_PDF, payload: result.url });

        } catch (error) {
            console.error('Generate PDF error:', error);
            dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        }
    }, [state.pdfUrl, state.filledFields]);

    const startDemo = useCallback(() => {
        // ... (Keep existing demo logic or simplify)
        dispatch({
            type: ACTIONS.START_DEMO, payload: {
                fields: [{ name: 'Name', type: 'text' }, { name: 'Email', type: 'text' }]
            }
        });
    }, []);

    // ... Reset, etc ...
    const resetSession = useCallback(() => { dispatch({ type: ACTIONS.RESET }); }, []);

    const value = {
        ...state,
        startSession, // EXPORTED
        sendMessage,
        updateField,
        generatePdf,
        resetSession,
        startDemo,
        // ... Keep other helpers if needed
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Hook to use the context
export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}

export default AppContext;

