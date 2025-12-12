import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HelpCircle, Eye, FileDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import QuickActionBar from './QuickActionBar';
import ChatInput from './ChatInput';
import './ChatPanel.css';

// Demo conversation flow
const DEMO_CONVERSATION = [
    { role: 'user', content: 'Max', delay: 1500 },
    { role: 'assistant', content: 'Super! 😊 Und wie ist dein Nachname?', delay: 1000 },
    { role: 'user', content: 'Mustermann', delay: 1500 },
    { role: 'assistant', content: 'Perfekt, Max Mustermann! Wie kann ich dich per E-Mail erreichen?', delay: 1000 },
    { role: 'user', content: 'max@example.com', delay: 2000 },
    { role: 'assistant', content: 'Danke! 📧 Und deine Telefonnummer?', delay: 1000 },
    { role: 'user', content: '+49 123 456789', delay: 1500 },
    { role: 'assistant', content: 'Klasse! Noch ein paar Angaben: In welcher Straße wohnst du?', delay: 1000 },
    { role: 'user', content: 'Musterstraße 42', delay: 1500 },
    { role: 'assistant', content: 'Fast geschafft! 🎉 Zu guter Letzt: Deine Postleitzahl?', delay: 1000 },
    { role: 'user', content: '12345', delay: 1500 },
    { role: 'assistant', content: 'Wunderbar, Max! 🎊 Wir haben alle Felder ausgefüllt. Möchtest du dir die Vorschau ansehen und das fertige PDF herunterladen?', delay: 1000 },
];

export default function ChatPanel({ onShowHelp, onShowPreview }) {
    const messagesEndRef = useRef(null);
    const { messages, isTyping, pdfFileName, isDemo, filledFields, updateField } = useApp();
    const [demoIndex, setDemoIndex] = useState(0);
    const [isRunningDemo, setIsRunningDemo] = useState(false);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    // Run demo conversation
    useEffect(() => {
        if (isDemo && !isRunningDemo && messages.length > 0) {
            setIsRunningDemo(true);
            runDemoConversation();
        }
    }, [isDemo, messages.length]);

    const runDemoConversation = async () => {
        for (let i = 0; i < DEMO_CONVERSATION.length; i++) {
            await new Promise(resolve => setTimeout(resolve, DEMO_CONVERSATION[i].delay));

            const msg = DEMO_CONVERSATION[i];

            // Update fields as we go
            if (msg.role === 'user') {
                const fieldNames = ['Vorname', 'Nachname', 'Email', 'Telefon', 'Straße', 'Postleitzahl'];
                const userMessages = DEMO_CONVERSATION.filter(m => m.role === 'user');
                const userIndex = userMessages.findIndex(m => m.content === msg.content);

                if (userIndex >= 0 && userIndex < fieldNames.length) {
                    updateField(fieldNames[userIndex], msg.content);
                }
            }

            setDemoIndex(i + 1);
        }

        // After demo is complete, show preview automatically
        setTimeout(() => {
            onShowPreview();
        }, 2000);
    };

    const displayMessages = isDemo ? DEMO_CONVERSATION.slice(0, demoIndex) : messages;

    return (
        <div className="chat-panel">
            <div className="chat-header">
                <div className="chat-header-info">
                    <div className="chat-header-avatar">
                        <img src="/assets/finny-mascot.png" alt="Finny" />
                    </div>
                    <div className="chat-header-text">
                        <h3>Finny</h3>
                        <span>● {isDemo ? 'Demo-Modus' : 'Online'} - {pdfFileName || 'Bereit zum Helfen'}</span>
                    </div>
                </div>
            </div>

            <div className="chat-messages">
                {displayMessages.length === 0 && !isDemo && (
                    <motion.div
                        className="chat-welcome"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <img src="/assets/finny-mascot.png" alt="Finny" className="chat-welcome-avatar" />
                        <h3>Willkommen! 👋</h3>
                        <p>Lade ein PDF hoch und ich helfe dir beim Ausfüllen der Formularfelder.</p>
                    </motion.div>
                )}

                {displayMessages.map((message, index) => (
                    <ChatMessage key={index} message={message} index={index} />
                ))}

                <AnimatePresence>
                    {(isTyping || (isDemo && demoIndex < DEMO_CONVERSATION.length)) && <TypingIndicator />}
                </AnimatePresence>

                <div ref={messagesEndRef} />
            </div>

            {!isDemo && <QuickActionBar />}

            {!isDemo && <ChatInput />}

            {/* Action Buttons */}
            <div className="chat-action-buttons">
                <motion.button
                    className="chat-action-btn help"
                    onClick={onShowHelp}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <HelpCircle />
                    Hilfe
                </motion.button>

                <motion.button
                    className="chat-action-btn preview"
                    onClick={onShowPreview}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <Eye />
                    Vorschau
                </motion.button>
            </div>
        </div>
    );
}
