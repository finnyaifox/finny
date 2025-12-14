import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { PdfService, AiService } from '../../services/apiClient';

export default function FullKiUpload({ onUploadComplete }) {
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState('');

    const onDrop = useCallback(async (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setIsUploading(true);
        setStatusText('Starte Upload...');

        try {
            // 1. Get Presigned URL
            const presigned = await PdfService.getPresignedUrl(file.name);

            // 2. Upload to S3
            setStatusText('Lade Datei hoch...');
            await PdfService.uploadFileToUrl(presigned.presignedUrl, file);

            const tempUrl = presigned.url;

            // 3. Extract Text (Backend Simulation)
            setStatusText('Extrahiere Text...');
            const rawText = await PdfService.getPdfText(tempUrl);

            // 4. Semantic Analysis via CometAPI (Simulating "Du analysierst das Dokument SEMANTISCH")
            setStatusText('KI analysiert Formular (Semantisch)...');

            const analysisPrompt = [
                {
                    role: "user",
                    content: `ANALYSE DIESES DOKUMENTS:\n${rawText.substring(0, 15000)}\n\nAUFGABE:\nIdentifiziere alle relevanten Formular-Felder (Name, Datum, Unterschrift, Checkboxen etc.).\nGib NUR ein JSON-Array zurück. Format:\n[{"name": "Vorname", "type": "text"}, {"name": "Geburtsdatum", "type": "date"}]\nWICHTIG: Nutze den Key "name" für den Feldbezeichner!\nKein Markdown, nur JSON.`
                }
            ];

            const aiResponse = await AiService.chatCompletion(analysisPrompt);

            // 5. Parse AI Response
            let fields = [];
            try {
                const jsonMatch = aiResponse.match(/\[.*\]/s);
                if (jsonMatch) {
                    fields = JSON.parse(jsonMatch[0]);
                }
            } catch (e) {
                console.warn('JSON Parse failed', e);
            }

            // 6. Complete
            setStatusText('Fertig!');
            onUploadComplete({
                mode: 'full-ki',
                pdfUrl: tempUrl, // Temporary URL valid for 1h
                file: file,
                fields: fields
            });

        } catch (err) {
            console.error(err);
            setStatusText('Fehler beim Upload!');
        } finally {
            setIsUploading(false);
        }
    }, [onUploadComplete]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        multiple: false
    });

    return (
        <div className="upload-box full-ki-upload">
            <h3>Full KI Variante</h3>
            <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
                <input {...getInputProps()} />
                {isUploading ? (
                    <div className="upload-status">
                        <div className="spinner"></div>
                        <p>{statusText}</p>
                    </div>
                ) : (
                    <div className="dropzone-content">
                        <p>Ziehe deine PDF hier rein oder klicke zum Durchsuchen</p>
                        <small>(Akzeptiert: PDF-Dateien)</small>
                        <button className="btn-secondary">Durchsuchen</button>
                    </div>
                )}
            </div>
            <div className="info-text">
                <small>Deine Datei wird sicher verarbeitet und nach 1 Stunde automatisch gelöscht.</small>
            </div>
        </div>
    );
}
