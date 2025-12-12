import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import './Header.css';

export default function Header() {
    const { status } = useApp();

    const isProcessing = ['uploading', 'extracting', 'generating', 'filling'].includes(status);

    const getStatusText = () => {
        switch (status) {
            case 'uploading':
                return 'PDF wird hochgeladen...';
            case 'extracting':
                return 'Felder werden analysiert...';
            case 'chatting':
                return 'Bereit zum Ausfüllen';
            case 'generating':
                return 'JSON wird generiert...';
            case 'filling':
                return 'PDF wird ausgefüllt...';
            case 'done':
                return 'Fertig!';
            default:
                return 'Online';
        }
    };

    return (
        <header className="header">
            <div className="header-brand">
                <motion.img
                    src="/assets/finny-logo.png"
                    alt="Finny Logo"
                    className="header-logo"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                />
                <div className="header-title-container">
                    <motion.h1
                        className="header-title"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        Hallo, ich bin <span>Finny</span>
                    </motion.h1>
                    <motion.p
                        className="header-subtitle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        Dein AI-PDF Assistent
                    </motion.p>
                </div>
            </div>

            <motion.div
                className="header-status"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.3 }}
            >
                {isProcessing && (
                    <div className="header-mascot">
                        <motion.img
                            src="/assets/finny-mascot.png"
                            alt="Finny"
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                        />
                    </div>
                )}
                <motion.div
                    className={`header-status-dot ${isProcessing ? 'processing' : ''}`}
                    animate={isProcessing ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                />
                <span className="header-status-text">{getStatusText()}</span>
            </motion.div>
        </header>
    );
}
