import { motion, AnimatePresence } from 'framer-motion';
import { X, HelpCircle, FileText, MessageSquare, CheckCircle, Download } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import './Modal.css';

export default function HelpModal({ isOpen, onClose }) {
    const { pdfFileName, fields } = useApp();

    if (!isOpen) return null;

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
                    className="modal help-modal"
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="modal-header">
                        <div className="modal-header-info">
                            <div className="modal-header-icon help">
                                <HelpCircle />
                            </div>
                            <div className="modal-header-text">
                                <h2>Hilfe & Anleitung</h2>
                                <p>So funktioniert Finny</p>
                            </div>
                        </div>
                        <button className="modal-close-btn" onClick={onClose}>
                            <X />
                        </button>
                    </div>

                    <div className="modal-body">
                        {/* Current Document Info */}
                        {pdfFileName && (
                            <div className="help-document-info">
                                <div className="help-document-icon">
                                    <FileText />
                                </div>
                                <div className="help-document-text">
                                    <strong>Aktuelles Dokument:</strong>
                                    <span>{pdfFileName}</span>
                                    <span className="help-field-count">{fields.length} Formularfelder erkannt</span>
                                </div>
                            </div>
                        )}

                        {/* Instructions */}
                        <div className="help-instructions">
                            <h3>📋 Worum geht es?</h3>
                            <p>
                                Finny hilft dir, PDF-Formulare schnell und einfach auszufüllen.
                                Du beantwortest einfache Fragen im Chat und Finny trägt die Daten
                                automatisch in die richtigen Felder ein.
                            </p>

                            <h3>🦊 So geht's:</h3>
                            <ol className="help-steps">
                                <li>
                                    <div className="help-step-icon"><FileText /></div>
                                    <div>
                                        <strong>PDF hochladen</strong>
                                        <p>Lade dein PDF-Formular hoch. Finny erkennt automatisch alle Felder.</p>
                                    </div>
                                </li>
                                <li>
                                    <div className="help-step-icon"><MessageSquare /></div>
                                    <div>
                                        <strong>Fragen beantworten</strong>
                                        <p>Finny stellt dir Fragen zu jedem Feld. Antworte einfach im Chat.</p>
                                    </div>
                                </li>
                                <li>
                                    <div className="help-step-icon"><CheckCircle /></div>
                                    <div>
                                        <strong>Überprüfen</strong>
                                        <p>Schau dir die Vorschau an und korrigiere bei Bedarf.</p>
                                    </div>
                                </li>
                                <li>
                                    <div className="help-step-icon"><Download /></div>
                                    <div>
                                        <strong>Herunterladen</strong>
                                        <p>Lade dein fertig ausgefülltes PDF herunter.</p>
                                    </div>
                                </li>
                            </ol>

                            <h3>💡 Tipps:</h3>
                            <ul className="help-tips">
                                <li>Tippe <strong>"?"</strong> oder <strong>"Hilfe"</strong> wenn du eine Frage nicht verstehst</li>
                                <li>Tippe <strong>"Überspringen"</strong> um ein Feld später auszufüllen</li>
                                <li>Du kannst Felder in der linken Sidebar jederzeit bearbeiten</li>
                                <li>Grüne Felder sind ausgefüllt, orange Felder warten noch</li>
                            </ul>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button className="btn-glow" onClick={onClose}>
                            <span>Verstanden!</span>
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
