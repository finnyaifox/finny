import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import './UploadZone.css';

export default function UploadZone() {
    const { status, error, uploadPdf } = useApp();

    const isUploading = status === 'uploading' || status === 'extracting';

    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            if (file.type === 'application/pdf') {
                uploadPdf(file);
            }
        }
    }, [uploadPdf]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
        },
        maxFiles: 1,
        disabled: isUploading,
    });

    const getProgressText = () => {
        switch (status) {
            case 'uploading':
                return 'PDF wird hochgeladen...';
            case 'extracting':
                return 'Formularfelder werden analysiert...';
            default:
                return '';
        }
    };

    return (
        <div className="upload-zone-container">
            <AnimatePresence mode="wait">
                {!isUploading ? (
                    <motion.div
                        key="dropzone"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        {...getRootProps()}
                        className={`upload-zone ${isDragActive ? 'drag-active' : ''}`}
                    >
                        <input {...getInputProps()} />

                        <motion.img
                            src="/assets/upload-icon.png"
                            alt="Upload"
                            className="upload-zone-icon"
                            animate={isDragActive ? { y: [-5, -15, -5] } : { y: 0 }}
                            transition={{ duration: 0.5, repeat: isDragActive ? Infinity : 0 }}
                        />

                        <div className="upload-zone-text">
                            <h3 className="upload-zone-title">
                                {isDragActive ? 'Hier ablegen!' : 'PDF hochladen'}
                            </h3>
                            <p className="upload-zone-subtitle">
                                Ziehe dein PDF hierher oder klicke zum Auswählen
                            </p>
                        </div>

                        <div className="upload-zone-hint">
                            <FileText />
                            <span>Nur PDF-Dateien mit Formularfeldern</span>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="progress"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="upload-progress"
                    >
                        <div className="upload-progress-header">
                            <div className="upload-progress-info">
                                <Loader2 className="upload-progress-icon" />
                                <span className="upload-progress-text">{getProgressText()}</span>
                            </div>
                        </div>

                        <div className="upload-progress-bar">
                            <motion.div
                                className="upload-progress-fill"
                                initial={{ width: '0%' }}
                                animate={{
                                    width: status === 'uploading' ? '50%' : '100%'
                                }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {error && (
                    <motion.div
                        className="upload-error"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <AlertCircle />
                        <span>{error}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
