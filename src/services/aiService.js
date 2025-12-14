/**
 * AI Service - Frontend Client
 * Communicates with our Node.js backend (/api/chat)
 */

const API_BASE = 'http://localhost:3000/api';

/**
 * Sends messages to the backend for processing.
 * Accepts context and returns response compatible with AppContext.
 */
export async function sendMessage(messages, context) {
    try {
        console.log('📤 Sending message to Backend AI...');

        const response = await fetch(`${API_BASE}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: messages,
                context: {
                    fields: context.fields,
                    filledFields: context.filledFields,
                    fileName: context.fileName
                },
                // In Variant A (Standard), we rely on client state passing
                // sessionId could be passed if we tracked it
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Server Error');
        }

        const data = await response.json();
        console.log('✅ Received Backend Response:', data);

        // Map backend response format to what AppContext expects
        return {
            content: data.content,
            fieldUpdates: data.fieldUpdates || {}
        };

    } catch (error) {
        console.error('❌ AI Service Error:', error);
        throw error;
    }
}

/**
 * Start Conversation - Calls backend to init
 */
export async function startConversation(context) {
    // Send empty messages array to trigger the backend's "Intro Logic" (userMsgCount === 0)
    console.log('🚀 Triggering Conversation Init...');
    return sendMessage([], context);
}

/**
 * Generate Filled JSON - Now handled by /api/fill-pdf logic implicit or explicit?
 * NOTE: AppContext calls `generateFilledJson`. We should adapt it to just return the fields object
 * as the backend 'fill-pdf' endpoint expects an array.
 * Actually, AppContext.jsx:generatePdf() calls this, then calls pdfcoService.fillPdf().
 * To minimize refactor risk, we keep this signature but maybe use backend helper? 
 * OR we just let the frontend collect the 'filledFields' state it already has 
 * and pass it to pdfcoService (which we will also point to backend proxy eventually, or keep direct if API key is safe-ish).
 * 
 * Update: User plan said "Variant A calls PDF.co edit/add with known pdfUrl".
 * We should support generating the JSON for the frontend to confirm.
 */
export async function generateFilledJson(messages, context) {
    // Since state is tracked in AppContext, we simply return what we have
    // or ask AI to hallucinate any missing ones?
    // For robustness, we just return the entries from context.filledFields properly formatted.
    console.log('📋 Generating JSON from Context State');

    // Map current filled fields to array
    const fields = Object.entries(context.filledFields).map(([name, value]) => ({
        name,
        value
    }));

    return { fields };
}

export default {
    sendMessage,
    startConversation,
    generateFilledJson
};
