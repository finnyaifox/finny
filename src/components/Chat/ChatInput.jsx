import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function ChatInput() {
    const [message, setMessage] = useState('');
    const textareaRef = useRef(null);
    const { sendMessage, isTyping } = useApp();

    const handleSubmit = () => {
        if (message.trim() && !isTyping) {
            sendMessage(message.trim());
            setMessage('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
        }
    }, [message]);

    return (
        <div className="chat-input-container">
            <div className="chat-input-wrapper">
                <textarea
                    ref={textareaRef}
                    className="chat-input"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Schreibe eine Nachricht..."
                    rows={1}
                    disabled={isTyping}
                />

                <motion.button
                    className={`chat-send-btn ${isTyping ? 'loading' : ''}`}
                    onClick={handleSubmit}
                    disabled={!message.trim() || isTyping}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {isTyping ? <Loader2 /> : <Send />}
                </motion.button>
            </div>
        </div>
    );
}
