import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import './SupportWidget.css';

export default function SupportWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'system', content: 'Hallo! Ich bin der Finny Support. Wie kann ich dir helfen? (Ich teste auch deine Verbindung!)' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            // PROBE FÜR BACKEND ANBINDUNG
            const response = await axios.post('/api/chat', {
                messages: [...messages, userMsg],
                isSupport: true // Optional flag for backend to know it's support (or generic prompt)
            });

            const aiMsg = {
                role: 'assistant',
                content: response.data.content || 'Keine Antwort vom Server.'
            };
            setMessages(prev => [...prev, aiMsg]);

        } catch (error) {
            console.error('Support Chat Error:', error);
            setMessages(prev => [...prev, {
                role: 'error',
                content: `⚠️ Fehler: ${error.message}. Ist der Server online?`
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="support-widget-container">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="support-window"
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                    >
                        <div className="support-header">
                            <h3>Finny Support</h3>
                            <button onClick={() => setIsOpen(false)}><X size={18} /></button>
                        </div>
                        <div className="support-messages">
                            {messages.map((m, i) => (
                                <div key={i} className={`support-message ${m.role}`}>
                                    {m.content}
                                </div>
                            ))}
                            {isTyping && <div className="support-typing">Finny tippt...</div>}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="support-input">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Frage stellen..."
                            />
                            <button onClick={handleSend}><Send size={16} /></button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                className="support-toggle-btn"
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            >
                {isOpen ? <X /> : <MessageCircle />}
            </motion.button>
        </div>
    );
}
