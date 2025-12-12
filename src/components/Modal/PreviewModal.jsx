import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import './Modal.css';

export default function PreviewModal({ isOpen, onClose, onConfirm, isLoading }) {
    const { fields, filledFields, pdfFileName, getProgress } = useApp();

    const progress = getProgress();
    const filledCount = Object.keys(filledFields).filter(k => filledFields[k]).length;

    const filledFieldsList = fields.map(field => ({
        name: field.name,
        value: filledFields[field.name] || '',
        filled: !!filledFields[field.name],
    }));

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
                    className="modal"
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="modal-header">
                        <div className="modal-header-info">
                            <div className="modal-header-icon preview">
                                <FileText />
                            </div>
                            <div className="modal-header-text">
                                <h2>Vorschau</h2>
                                <p>{pdfFileName} • {filledCount}/{fields.length} Felder ({progress}%)</p>
                            </div>
                        </div>
                        <button className="modal-close-btn" onClick={onClose}>
                            <X />
                        </button>
                    </div>

                    <div className="modal-body">
                        {isLoading ? (
                            <div className="modal-loading">
                                <div className="modal-loading-spinner" />
                                <span className="modal-loading-text">
                                    Erstelle ausgefülltes PDF...
                                </span>
                            </div>
                        ) : (
                            <>
                                {/* Progress Summary */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-sm)',
                                    marginBottom: 'var(--spacing-lg)',
                                    padding: 'var(--spacing-md)',
                                    background: progress >= 80 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                    border: `1px solid ${progress >= 80 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                                    borderRadius: 'var(--radius-md)'
                                }}>
                                    {progress >= 80 ? (
                                        <CheckCircle style={{ color: 'var(--color-success)', width: 20, height: 20 }} />
                                    ) : (
                                        <AlertCircle style={{ color: 'var(--color-warning)', width: 20, height: 20 }} />
                                    )}
                                    <span style={{
                                        fontSize: 'var(--font-size-sm)',
                                        color: progress >= 80 ? 'var(--color-success)' : 'var(--color-warning)'
                                    }}>
                                        {progress >= 80
                                            ? 'Alle wichtigen Felder sind ausgefüllt!'
                                            : 'Einige Felder sind noch leer. Du kannst trotzdem fortfahren.'}
                                    </span>
                                </div>

                                {/* Field List */}
                                <div className="preview-field-list">
                                    {filledFieldsList.map((field, index) => (
                                        <motion.div
                                            key={field.name}
                                            className={`preview-field-item ${field.filled ? 'filled' : 'empty'}`}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                        >
                                            <span className="preview-field-name">{field.name}</span>
                                            <span className={`preview-field-value ${!field.value ? 'empty' : ''}`}>
                                                {field.value || '(nicht ausgefüllt)'}
                                            </span>
                                        </motion.div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button
                            className="btn-secondary"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Abbrechen
                        </button>
                        <button
                            className="btn-glow"
                            onClick={onConfirm}
                            disabled={isLoading}
                        >
                            <span>
                                {isLoading ? (
                                    <>
                                        <Loader2 style={{ width: 16, height: 16, marginRight: 8, animation: 'spin 1s linear infinite', display: 'inline-block' }} />
                                        Erstelle PDF...
                                    </>
                                ) : (
                                    '✓ Bestätigen & PDF erstellen'
                                )}
                            </span>
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
