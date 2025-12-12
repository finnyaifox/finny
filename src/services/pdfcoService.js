/**
 * pdf.co API Service - KORRIGIERT
 * Handles PDF upload, field extraction, and PDF filling
 */

const API_KEY = import.meta.env.VITE_PDFCO_API_KEY || 'leeonzo86@gmail.com_cYjsXcXA3N2FU2jD50NTtjbc4uhMQBtBHl5Wv8hN7GndcfgnQEu0W42g8oLyccos';
const BASE_URL = 'https://api.pdf.co/v1';

/**
 * Upload a PDF file and get a temporary URL
 * @param {File} file - The PDF file to upload
 * @returns {Promise<{url: string, fileName: string}>}
 */
export async function uploadPdf(file) {
    try {
        console.log('📤 Uploading PDF:', file.name);

        // Step 1: Get presigned URL for upload
        const presignedResponse = await fetch(`${BASE_URL}/file/upload/get-presigned-url?name=${encodeURIComponent(file.name)}&contenttype=application/pdf`, {
            method: 'GET',
            headers: {
                'x-api-key': API_KEY,
            },
        });

        if (!presignedResponse.ok) {
            const errorText = await presignedResponse.text();
            console.error('Presigned URL error:', errorText);
            throw new Error('Failed to get presigned URL');
        }

        const presignedData = await presignedResponse.json();
        console.log('Presigned data:', presignedData);

        if (presignedData.error) {
            throw new Error(presignedData.message || 'Failed to get presigned URL');
        }

        // Step 2: Upload file to presigned URL
        const uploadResponse = await fetch(presignedData.presignedUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': 'application/pdf',
            },
        });

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error('Upload error:', errorText);
            throw new Error('Failed to upload file');
        }

        console.log('✅ PDF uploaded successfully:', presignedData.url);

        return {
            url: presignedData.url,
            fileName: file.name,
        };
    } catch (error) {
        console.error('❌ PDF upload error:', error);
        throw error;
    }
}

/**
 * Extract form fields from a PDF - KORRIGIERT nach pdf.co Dokumentation
 * @param {string} pdfUrl - The URL of the PDF
 * @returns {Promise<{fields: Array<{name: string, type: string, value: string}>}>}
 */
export async function extractFields(pdfUrl) {
    try {
        console.log('🔍 Extracting fields from PDF:', pdfUrl);

        const response = await fetch(`${BASE_URL}/pdf/info/fields`, {
            method: 'POST',
            headers: {
                'x-api-key': API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: pdfUrl,
                async: false
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Field extraction HTTP error:', response.status, errorText);
            throw new Error(`Failed to extract fields: ${response.status}`);
        }

        const data = await response.json();
        console.log('Raw pdf.co response:', data);

        if (data.error) {
            console.error('pdf.co API error:', data.message);
            throw new Error(data.message || 'Failed to extract fields');
        }

        // KORRIGIERT: Laut pdf.co Dokumentation sind die Felder unter info.FieldsInfo.Fields
        const fieldsInfo = data.info?.FieldsInfo?.Fields || [];

        console.log(`✅ Extracted ${fieldsInfo.length} fields from PDF`);

        // Convert pdf.co format to our format
        const fields = fieldsInfo.map(field => ({
            name: field.FieldName,
            type: field.Type?.toLowerCase() || 'text', // EditBox, CheckBox, etc.
            value: field.Value || '',
            page: field.PageIndex || 1,
        }));

        console.log('Converted fields:', fields);

        return { fields };
    } catch (error) {
        console.error('❌ Field extraction error:', error);
        throw error;
    }
}

/**
 * Fill a PDF with the provided field values
 * @param {string} pdfUrl - The URL of the original PDF
 * @param {Array<{name: string, value: string}>} fields - The fields to fill
 * @returns {Promise<{url: string}>}
 */
export async function fillPdf(pdfUrl, fields) {
    try {
        console.log('📝 Filling PDF with', fields.length, 'fields...');
        console.log('Fields to fill:', fields);

        // Format fields for pdf.co API
        const fieldsList = fields.map(field => ({
            fieldName: field.name,
            value: String(field.value), // Ensure value is string
        }));

        const requestBody = {
            url: pdfUrl,
            fields: fieldsList,
            async: false,
        };

        console.log('Fill PDF request:', requestBody);

        const response = await fetch(`${BASE_URL}/pdf/edit/fill`, {
            method: 'POST',
            headers: {
                'x-api-key': API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Fill PDF HTTP error:', response.status, errorText);
            throw new Error(`Failed to fill PDF: ${response.status}`);
        }

        const data = await response.json();
        console.log('Fill PDF response:', data);

        if (data.error) {
            console.error('pdf.co fill error:', data.message);
            throw new Error(data.message || 'Failed to fill PDF');
        }

        console.log('✅ PDF filled successfully:', data.url);

        return {
            url: data.url,
        };
    } catch (error) {
        console.error('❌ PDF fill error:', error);
        throw error;
    }
}

export default {
    uploadPdf,
    extractFields,
    fillPdf,
};
