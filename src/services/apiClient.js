import axios from 'axios';

// API Keys from Environment (VITE_ prefix is required for frontend)
const PDFCO_API_KEY = import.meta.env.VITE_PDFCO_API_KEY;
const COMET_API_KEY = import.meta.env.VITE_COMET_API_KEY;
const COMET_MODEL = import.meta.env.VITE_COMET_MODEL || 'gemini-2.5-pro-all';

/**
 * PDF.co Client Wrapper
 */
export const PdfService = {
    /**
     * Get PDF Info (Page count, etc.)
     */
    getPdfInfo: async (url) => {
        try {
            const formData = new FormData();
            formData.append('url', url);
            formData.append('async', 'false');

            const response = await axios.post('https://api.pdf.co/v1/pdf/info', formData, {
                headers: {
                    'x-api-key': PDFCO_API_KEY,
                    // Axios automatically sets Content-Type for FormData
                }
            });
            return response.data;
        } catch (error) {
            console.error('PDF.co Info Error:', error);
            throw error;
        }
    },

    /**
     * Get PDF Fields
     */
    getPdfFields: async (url) => {
        try {
            const formData = new FormData();
            formData.append('url', url);
            formData.append('async', 'false');

            const response = await axios.post('https://api.pdf.co/v1/pdf/info/fields', formData, {
                headers: {
                    'x-api-key': PDFCO_API_KEY
                }
            });
            return response.data;
        } catch (error) {
            console.error('PDF.co Fields Error:', error);
            throw error;
        }
    },

    /**
     * Get Presigned URL for Upload
     */
    getPresignedUrl: async (fileName) => {
        try {
            const response = await axios.get('https://api.pdf.co/v1/file/upload/get-presigned-url', {
                headers: { 'x-api-key': PDFCO_API_KEY },
                params: {
                    name: fileName,
                    encrypt: true
                }
            });
            return response.data;
        } catch (error) {
            console.error('PDF.co Presigned URL Error:', error);
            throw error;
        }
    },

    /**
     * Fill PDF Form
     */
    fillPdfForm: async (url, fields) => {
        try {
            // PDF.co requires "fieldsString" in format "pageIndex;fieldName;value|..."
            // Or "fields" JSON array. The prompt says: "POST /pdf/forms/fill -> JSON (Not FormData!)"
            // But step 8 says: BODY: {"url": "...", "fields": [...]}

            const payload = {
                url: url,
                fields: fields, // Array of objects { param: "fieldName", value: "value" } or similar
                async: false
            };

            const response = await axios.post('https://api.pdf.co/v1/pdf/forms/fill', payload, {
                headers: {
                    'x-api-key': PDFCO_API_KEY,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        } catch (error) {
            console.error('PDF.co Fill Error:', error);
            throw error;
        }
    },

    /**
     * Upload binary data to signed URL
     */
    uploadFileToUrl: async (signedUrl, file) => {
        await axios.put(signedUrl, file, {
            headers: { 'Content-Type': 'application/pdf' }
        });
    },

    /**
     * Extract Text from PDF (for Full KI Mode)
     * Uses PDF.co /pdf/convert/to/text
     */
    getPdfText: async (url) => {
        try {
            const formData = new FormData();
            formData.append('url', url);
            formData.append('async', 'false');

            const response = await axios.post('https://api.pdf.co/v1/pdf/convert/to/text', formData, {
                headers: {
                    'x-api-key': PDFCO_API_KEY
                }
            });
            return response.data?.body || ''; // PDF.co returns text in 'body'
        } catch (error) {
            console.error('PDF.co Text Extract Error:', error);
            throw error;
        }
    }
};

/**
 * CometAPI (Gemini) Client Wrapper
 */
export const AiService = {
    chatCompletion: async (messages) => {
        try {
            const payload = {
                model: COMET_MODEL,
                messages: messages,
                temperature: 0.7,
                max_tokens: 1000
            };

            const response = await axios.post('https://api.cometapi.com/v1/chat/completions', payload, {
                headers: {
                    'Authorization': `Bearer ${COMET_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data?.choices?.[0]?.message?.content;
        } catch (error) {
            console.error('AI Chat Error:', error);
            throw error;
        }
    }
};
