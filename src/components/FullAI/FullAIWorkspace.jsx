import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Send, FileText, Check, Clock } from 'lucide-react';
import axios from 'axios';
import '../Sidebar/Sidebar.css'; // Reusing sidebar styles
import '../Chat/ChatPanel.css'; // Reusing chat styles
import './FullAIWorkspace.css'; // Specific styles

export default function FullAIWorkspace() {
    const [status, setStatus] = useState('upload'); // upload, analyzing, chatting, done
    const [messages, setMessages] = useState([]);
    const [fields, setFields] = useState([]);
    const [fieldValues, setFieldValues] = useState({});
    const [sessionId, setSessionId] = useState(null);
    const [tempId, setTempId] = useState(null);
    const [input, setInput] = useState('');
    const [timeStr, setTimeStr] = useState('');
    const [dateStr, setDateStr] = useState('');
    const [pdfUrl, setPdfUrl] = useState('');
    const [uploadError, setUploadError] = useState('');

    const messagesEndRef = useRef(null);

    // Live Clock
    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            setTimeStr(now.toLocaleTimeString('de-DE'));
            setDateStr(now.toLocaleDateString('de-DE'));
        };
        const interval = setInterval(updateClock, 1000);
        updateClock();
        return () => clearInterval(interval);
    }, []);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setStatus('analyzing');
        setUploadError('');

        const formData = new FormData();
        formData.append('file', file);

        try {
            // 1. Upload Temp
            const upRes = await axios.post('/api/upload-pdf-temp', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const { tempId: tId } = upRes.data;
            setTempId(tId);

            // 2. Extract Fields (Variant B extraction)
            // We mimic the chat request for extraction
            const chatRes = await axios.post('/api/chat', {
                isExtraction: true,
                tempId: tId,
                messages: []
            });

            if (chatRes.data.success) {
                setFields(chatRes.data.fields || []);
                setSessionId(chatRes.data.sessionId);
                setStatus('chatting');

                // Add Intro Message
                setMessages([{
                    role: 'assistant',
                    content: chatRes.data.message || 'Hallo! Ich habe dein PDF analysiert. Wollen wir anfangen?'
                }]);
            } else {
                throw new Error(chatRes.data.error || 'Analyse fehlgeschlagen');
            }

        } catch (err) {
            console.error(err);
            setUploadError('Fehler: ' + (err.response?.data?.error || err.message));
            setStatus('upload');
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;
        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');

        try {
            const res = await axios.post('/api/chat', {
                sessionId,
                tempId,
                messages: [...messages, userMsg],
                collectedData: fieldValues,
                currentFieldIndex: Object.keys(fieldValues).length // Simple progress heuristic
            });

            const aiMsg = { role: 'assistant', content: res.data.content };
            setMessages(prev => [...prev, aiMsg]);

            if (res.data.fieldUpdates) {
                setFieldValues(prev => ({ ...prev, ...res.data.fieldUpdates }));
            }

            if (res.data.action === 'completed') {
                handleFinish();
            }

        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { role: 'error', content: 'Verbindungsfehler.' }]);
        }
    };

    const handleFinish = async () => {
        setStatus('generating');
        try {
            const res = await axios.post('/api/fill-pdf', {
                sessionId,
                tempId,
                fields: fields.map(f => ({
                    name: f.fieldName || f.name, // Handle inconsistent naming
                    value: fieldValues[f.fieldName || f.name]
                }))
            });

            if (res.data.url) {
                setPdfUrl(res.data.url);
                setStatus('done');
            }
        } catch (err) {
            console.error(err);
            setStatus('chatting'); // Back to chat on error
        }
    };

    const progressPercent = fields.length > 0
        ? Math.round((Object.keys(fieldValues).length / fields.length) * 100)
        : 0;

    return (
        <div className="full-ai-container">
            {/* Live Clock Overlay */}
            <div className="live-clock">
                <Clock size={16} />
                <span>{timeStr}</span>
                <span className="clock-date">{dateStr}</span>
            </div>

            {/* Sidebar (Left) */}
            <div className="full-ai-sidebar">
                <h3>Erkannte Felder</h3>
                <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
                </div>
                <div className="progress-text">{progressPercent}% Ausgefüllt</div>

                <div className="full-ai-field-list">
                    {fields.length === 0 && <p className="no-fields">Noch keine Felder analysiert.</p>}
                    {fields.map((f, i) => {
                        const val = fieldValues[f.fieldName || f.name];
                        return (
                            <div key={i} className={`field-item-mini ${val ? 'filled' : ''}`}>
                                <span className="field-name">{f.fieldName || f.name}</span>
                                {val && <Check size={14} className="field-check" />}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Main Area */}
            <div className="full-ai-main">
                {status === 'upload' && (
                    <div className="full-ai-upload">
                        <motion.img
                            src="/assets/finny-mascot.png"
                            alt="Finny"
                            className="full-ai-mascot"
                            initial={{ y: 0 }}
                            animate={{ y: [-10, 0, -10] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            style={{ width: '120px', marginBottom: '1rem' }}
                        />
                        <h2>Full KI Assistent</h2>
                        <p>Lade dein PDF hoch. Ich analysiere alles vollautomatisch.</p>
                        <div className="upload-box" onClick={() => document.getElementById('full-ai-upload').click()}>
                            <Upload size={48} />
                            <span>PDF auswählen (Max 10MB)</span>
                            <input id="full-ai-upload" type="file" hidden accept=".pdf" onChange={handleUpload} />
                        </div>
                        {uploadError && <p className="error-msg">{uploadError}</p>}
                    </div>
                )}

                {(status === 'analyzing') && (
                    <div className="full-ai-loading">
                        <div className="spinner"></div>
                        <p>Analysiere PDF Struktur...</p>
                    </div>
                )}

                {(status === 'chatting' || status === 'generating') && (
                    <div className="full-ai-chat">
                        <div className="chat-messages">
                            {messages.map((m, i) => (
                                <div key={i} className={`msg ${m.role}`}>
                                    {m.content}
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="chat-input-area">
                            <input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyPress={e => e.key === 'Enter' && handleSend()}
                                placeholder="Antworte Finny..."
                            />
                            <button onClick={handleSend}><Send /></button>
                        </div>
                    </div>
                )}

                {status === 'done' && (
                    <div className="full-ai-done">
                        <h2>🎉 Fertig!</h2>
                        <p>Dein Dokument wurde erfolgreich erstellt.</p>
                        <a href={pdfUrl} target="_blank" rel="noreferrer" className="download-btn">
                            PDF Herunterladen
                        </a>
                        <button className="restart-btn" onClick={() => window.location.reload()}>Neu starten</button>
                    </div>
                )}
            </div>
        </div>
    );
}
