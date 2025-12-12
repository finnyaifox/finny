import { motion } from 'framer-motion';
import './FinnyMascot.css';

export default function FinnyMascot({
    size = 'lg',
    status = 'idle',
    showSpeechBubble = false,
    speechText = '',
    className = ''
}) {
    const sizeClass = `size-${size}`;
    const statusClass = `status-${status}`;

    return (
        <motion.div
            className={`finny-mascot ${sizeClass} ${statusClass} ${className}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
                type: 'spring',
                stiffness: 200,
                damping: 15,
                delay: 0.2
            }}
        >
            <motion.img
                src="/assets/finny-mascot.png"
                alt="Finny - Dein freundlicher PDF-Assistent"
                className="finny-mascot-image"
                drag
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                dragElastic={0.1}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            />

            {showSpeechBubble && speechText && (
                <motion.div
                    className="finny-speech-bubble"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ delay: 0.5 }}
                >
                    {speechText}
                </motion.div>
            )}
        </motion.div>
    );
}
