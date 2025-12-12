import { motion } from 'framer-motion';
import { HelpCircle, SkipForward, ArrowLeft, BarChart3 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function QuickActionBar() {
    const { sendMessage } = useApp();

    const actions = [
        { id: 'help', label: 'Hilfe', icon: HelpCircle, message: 'Hilfe' },
        { id: 'skip', label: 'Überspringen', icon: SkipForward, message: 'Überspringen' },
        { id: 'back', label: 'Zurück', icon: ArrowLeft, message: 'Zurück zum vorherigen Feld' },
        { id: 'status', label: 'Status', icon: BarChart3, message: 'Zeige mir den aktuellen Status' },
    ];

    const handleAction = (message) => {
        sendMessage(message);
    };

    return (
        <div className="quick-action-bar">
            {actions.map((action, index) => {
                const Icon = action.icon;
                return (
                    <motion.button
                        key={action.id}
                        className="quick-action-chip"
                        onClick={() => handleAction(action.message)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Icon />
                        {action.label}
                    </motion.button>
                );
            })}
        </div>
    );
}
