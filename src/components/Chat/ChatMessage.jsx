import { motion } from 'framer-motion';
import { User } from 'lucide-react';

export default function ChatMessage({ message, index }) {
    const isUser = message.role === 'user';

    return (
        <motion.div
            className={`chat-message ${isUser ? 'user' : 'assistant'}`}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
                duration: 0.3,
                delay: index * 0.05,
                type: 'spring',
                stiffness: 200
            }}
        >
            <div className="chat-message-avatar">
                {isUser ? (
                    <User />
                ) : (
                    <img src="/assets/finny-mascot.png" alt="Finny" />
                )}
            </div>

            <div className="chat-message-bubble">
                {message.content}
            </div>
        </motion.div>
    );
}
