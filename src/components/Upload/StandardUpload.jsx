import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PdfService } from '../../services/apiClient';

export default function StandardUpload({ onUploadComplete }) {
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAnalyze = async () => {
        if (!url) return;
        setIsLoading(true);
        setError('');

        try {
            // 1. Get PDF Info
            const info = await PdfService.getPdfInfo(url);

            // 2. Get Fields
            const fieldsData = await PdfService.getPdfFields(url);

            // 3. Complete
            onUploadComplete({
                mode: 'standard',
                pdfUrl: url,
                info: info,
                fields: fieldsData.fields || []
            });

        } catch (err) {
            console.error(err);
            setError('Konnte PDF nicht analysieren. Bitte Link prüfen.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="upload-box standard-upload">
            <h3>Standard Upload</h3>
            <p>Gib den Link zu deinem PDF-Antrag ein.</p>

            <div className="input-group">
                <input
                    type="text"
                    placeholder="https://example.com/formular.pdf"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={isLoading}
                />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button
                className="btn-glow"
                onClick={handleAnalyze}
                disabled={isLoading || !url}
            >
                {isLoading ? 'Analysiere...' : 'Analysieren & Starten'}
            </button>

            <div className="info-text">
                <small>Wir extrahieren automatisch alle Formularfelder.</small>
            </div>
        </div>
    );
}
