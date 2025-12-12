import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Download, RefreshCw } from 'lucide-react';
import './Modal.css';

export default function DownloadModal({ isOpen, onClose, onNewSession, pdfUrl }) {
    if (!isOpen) return null;

    const handleDownload = () => {
        if (pdfUrl) {
            window.open(pdfUrl, '_blank');
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                className="modal-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="modal"
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="modal-header">
                        <div className="modal-header-info">
                            <div className="modal-header-icon success">
                                <CheckCircle />
                            </div>
                            <div className="modal-header-text">
                                <h2>PDF fertig!</h2>
                                <p>Dein Formular wurde erfolgreich ausgefüllt</p>
                            </div>
                        </div>
                        <button className="modal-close-btn" onClick={onClose}>
                            <X />
                        </button>
                    </div>

                    <div className="modal-body">
                        <div className="download-success">
                            <motion.div
                                className="download-success-icon"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 300,
                                    delay: 0.2
                                }}
                            >
                                <CheckCircle />
                            </motion.div>

                            <motion.div
                                className="download-mascot"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <motion.img
                                    src="/assets/finny-mascot.png"
                                    alt="Finny"
                                    animate={{ rotate: [0, 5, -5, 0] }}
                                    transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                                />
                            </motion.div>

                            <motion.div
                                className="download-success-text"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                            >
                                <h3>Geschafft! 🎉</h3>
                                <p>
                                    Dein PDF ist bereit zum Download. Klicke auf den Button
                                    unten, um es herunterzuladen.
                                </p>
                            </motion.div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button
                            className="btn-secondary"
                            onClick={onNewSession}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            <RefreshCw style={{ width: 16, height: 16 }} />
                            Neues PDF
                        </button>
                        <button
                            className="btn-glow"
                            onClick={handleDownload}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Download style={{ width: 18, height: 18 }} />
                                PDF herunterladen
                            </span>
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
