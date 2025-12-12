import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import * as pdfcoService from '../services/pdfcoService';
import * as aiService from '../services/aiService';

// Initial state
const initialState = {
    // PDF State
    pdfUrl: null,
    pdfFileName: null,

    // Fields State
    fields: [],
    filledFields: {},
    currentFieldIndex: 0,

    // Chat State
    messages: [],
    isTyping: false,

    // App Status
    status: 'idle', // idle, uploading, extracting, chatting, generating, filling, done, demo
    error: null,

    // Result
    filledPdfUrl: null,

    // Demo mode
    isDemo: false,

    // Session ID for saving
    sessionId: null,
};

// Action types
const ACTIONS = {
    SET_STATUS: 'SET_STATUS',
    SET_ERROR: 'SET_ERROR',
    SET_PDF: 'SET_PDF',
    SET_FIELDS: 'SET_FIELDS',
    UPDATE_FIELD: 'UPDATE_FIELD',
    ADD_MESSAGE: 'ADD_MESSAGE',
    SET_TYPING: 'SET_TYPING',
    SET_FILLED_PDF: 'SET_FILLED_PDF',
    RESET: 'RESET',
    START_DEMO: 'START_DEMO',
    LOAD_SESSION: 'LOAD_SESSION',
    SET_SESSION_ID: 'SET_SESSION_ID',
};

// Reducer
function appReducer(state, action) {
    switch (action.type) {
        case ACTIONS.SET_STATUS:
            return { ...state, status: action.payload, error: null };

        case ACTIONS.SET_ERROR:
            return { ...state, error: action.payload };

        case ACTIONS.SET_PDF:
            return {
                ...state,
                pdfUrl: action.payload.url,
                pdfFileName: action.payload.fileName,
            };

        case ACTIONS.SET_FIELDS:
            return {
                ...state,
                fields: action.payload,
                filledFields: {},
                currentFieldIndex: 0,
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

        case ACTIONS.LOAD_SESSION:
            return {
                ...state,
                ...action.payload,
                sessionId: action.payload.sessionId,
            };

        case ACTIONS.SET_SESSION_ID:
            return {
                ...state,
                sessionId: action.payload,
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

    // Auto-save session when state changes
    useEffect(() => {
        if (state.sessionId && state.fields.length > 0 && !state.isDemo) {
            saveSession();
        }
    }, [state.filledFields, state.messages, state.fields]);

    // Save current session to localStorage
    const saveSession = useCallback(() => {
        try {
            const sessionData = {
                sessionId: state.sessionId || Date.now().toString(),
                pdfUrl: state.pdfUrl,
                pdfFileName: state.pdfFileName,
                fields: state.fields,
                filledFields: state.filledFields,
                messages: state.messages,
                status: state.status,
                savedAt: new Date().toISOString(),
            };

            const savedSessions = JSON.parse(localStorage.getItem('finny_sessions') || '[]');
            const index = savedSessions.findIndex(s => s.sessionId === sessionData.sessionId);

            if (index >= 0) {
                savedSessions[index] = sessionData;
            } else {
                savedSessions.push(sessionData);
            }

            localStorage.setItem('finny_sessions', JSON.stringify(savedSessions));
            console.log('💾 Session saved:', sessionData.sessionId);
        } catch (error) {
            console.error('Failed to save session:', error);
        }
    }, [state]);

    // Load a saved session
    const loadSession = useCallback((sessionId) => {
        try {
            const savedSessions = JSON.parse(localStorage.getItem('finny_sessions') || '[]');
            const session = savedSessions.find(s => s.sessionId === sessionId);

            if (session) {
                dispatch({ type: ACTIONS.LOAD_SESSION, payload: session });
                console.log('📂 Session loaded:', sessionId);
                return session;
            }
        } catch (error) {
            console.error('Failed to load session:', error);
        }
        return null;
    }, []);

    // Get all saved sessions
    const getSavedSessions = useCallback(() => {
        try {
            return JSON.parse(localStorage.getItem('finny_sessions') || '[]');
        } catch (error) {
            console.error('Failed to get sessions:', error);
            return [];
        }
    }, []);

    // Delete a saved session
    const deleteSession = useCallback((sessionId) => {
        try {
            const savedSessions = JSON.parse(localStorage.getItem('finny_sessions') || '[]');
            const filtered = savedSessions.filter(s => s.sessionId !== sessionId);
            localStorage.setItem('finny_sessions', JSON.stringify(filtered));
            console.log('🗑️ Session deleted:', sessionId);
        } catch (error) {
            console.error('Failed to delete session:', error);
        }
    }, []);

    // Start demo mode
    const startDemo = useCallback(() => {
        console.log('🎭 Starting demo mode...');

        const demoFields = [
            { name: 'Vorname', type: 'text', value: '' },
            { name: 'Nachname', type: 'text', value: '' },
            { name: 'Email', type: 'text', value: '' },
            { name: 'Telefon', type: 'text', value: '' },
            { name: 'Straße', type: 'text', value: '' },
            { name: 'Postleitzahl', type: 'text', value: '' },
        ];

        dispatch({ type: ACTIONS.START_DEMO, payload: { fields: demoFields } });

        // Simulate demo conversation
        setTimeout(() => {
            dispatch({
                type: ACTIONS.ADD_MESSAGE,
                payload: {
                    role: 'assistant',
                    content: 'Hallo! 👋 Ich bin Finny, dein persönlicher PDF-Assistent. Ich sehe, du möchtest das Demo-Formular ausfüllen. Lass uns gleich loslegen! Wie ist dein Vorname?'
                }
            });
        }, 500);
    }, []);

    // Upload PDF and extract fields
    const uploadPdf = useCallback(async (file) => {
        try {
            const newSessionId = Date.now().toString();
            dispatch({ type: ACTIONS.SET_SESSION_ID, payload: newSessionId });
            dispatch({ type: ACTIONS.SET_STATUS, payload: 'uploading' });

            // Upload PDF
            const { url, fileName } = await pdfcoService.uploadPdf(file);
            dispatch({ type: ACTIONS.SET_PDF, payload: { url, fileName } });

            // Extract fields
            dispatch({ type: ACTIONS.SET_STATUS, payload: 'extracting' });
            const { fields } = await pdfcoService.extractFields(url);

            console.log('Extracted fields:', fields);

            dispatch({ type: ACTIONS.SET_FIELDS, payload: fields });

            // Start AI conversation
            dispatch({ type: ACTIONS.SET_STATUS, payload: 'chatting' });
            dispatch({ type: ACTIONS.SET_TYPING, payload: true });

            const context = { fileName, fields };
            const response = await aiService.startConversation(context);

            dispatch({ type: ACTIONS.SET_TYPING, payload: false });
            dispatch({
                type: ACTIONS.ADD_MESSAGE,
                payload: { role: 'assistant', content: response.content },
            });

        } catch (error) {
            console.error('Upload/Extract error:', error);
            dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        }
    }, []);

    // Send message to AI
    const sendMessage = useCallback(async (text) => {
        if (!text.trim()) return;

        try {
            // Add user message
            dispatch({
                type: ACTIONS.ADD_MESSAGE,
                payload: { role: 'user', content: text },
            });

            dispatch({ type: ACTIONS.SET_TYPING, payload: true });

            const context = {
                fileName: state.pdfFileName,
                fields: state.fields,
                filledFields: state.filledFields,
            };

            const allMessages = [
                ...state.messages,
                { role: 'user', content: text },
            ];

            const response = await aiService.sendMessage(allMessages, context);

            // Auto-fill any detected field values
            if (response.fieldUpdates && Object.keys(response.fieldUpdates).length > 0) {
                console.log('🎯 Auto-filling detected fields:', response.fieldUpdates);
                Object.entries(response.fieldUpdates).forEach(([name, value]) => {
                    dispatch({ type: ACTIONS.UPDATE_FIELD, payload: { name, value } });
                });
            }

            dispatch({ type: ACTIONS.SET_TYPING, payload: false });
            dispatch({
                type: ACTIONS.ADD_MESSAGE,
                payload: { role: 'assistant', content: response.content },
            });

        } catch (error) {
            console.error('Send message error:', error);
            dispatch({ type: ACTIONS.SET_TYPING, payload: false });
            dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        }
    }, [state.messages, state.pdfFileName, state.fields, state.filledFields]);

    // Update a field value
    const updateField = useCallback((name, value) => {
        dispatch({ type: ACTIONS.UPDATE_FIELD, payload: { name, value } });
    }, []);

    // Generate filled PDF
    const generatePdf = useCallback(async () => {
        try {
            dispatch({ type: ACTIONS.SET_STATUS, payload: 'generating' });

            const context = {
                fileName: state.pdfFileName,
                fields: state.fields,
                filledFields: state.filledFields,
            };

            const { fields: filledFieldsArray } = await aiService.generateFilledJson(
                state.messages,
                context
            );

            dispatch({ type: ACTIONS.SET_STATUS, payload: 'filling' });
            const { url } = await pdfcoService.fillPdf(state.pdfUrl, filledFieldsArray);

            dispatch({ type: ACTIONS.SET_FILLED_PDF, payload: url });

        } catch (error) {
            console.error('Generate PDF error:', error);
            dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        }
    }, [state.pdfUrl, state.pdfFileName, state.fields, state.filledFields, state.messages]);

    // Get filled fields as array
    const getFilledFieldsArray = useCallback(() => {
        return Object.entries(state.filledFields).map(([name, value]) => ({
            name,
            value,
        }));
    }, [state.filledFields]);

    // Calculate progress
    const getProgress = useCallback(() => {
        if (state.fields.length === 0) return 0;
        const filledCount = Object.keys(state.filledFields).filter(k => state.filledFields[k]).length;
        return Math.round((filledCount / state.fields.length) * 100);
    }, [state.fields, state.filledFields]);

    // Reset the session
    const resetSession = useCallback(() => {
        dispatch({ type: ACTIONS.RESET });
    }, []);

    const value = {
        ...state,
        uploadPdf,
        sendMessage,
        updateField,
        generatePdf,
        getFilledFieldsArray,
        getProgress,
        resetSession,
        startDemo,
        saveSession,
        loadSession,
        getSavedSessions,
        deleteSession,
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
