import { motion } from 'framer-motion';

export default function TypingIndicator() {
    return (
        <motion.div
            className="typing-indicator"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
        >
            <div className="typing-indicator-avatar">
                <img src="/assets/finny-mascot.png" alt="Finny" />
            </div>

            <div className="typing-indicator-content">
                <div className="typing-dots">
                    <motion.div
                        className="typing-dot"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                    />
                    <motion.div
                        className="typing-dot"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                    />
                    <motion.div
                        className="typing-dot"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                    />
                </div>
                <span className="typing-text">Finny schreibt...</span>
            </div>
        </motion.div>
    );
}
