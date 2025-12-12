import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function ProgressBar() {
    const { getProgress, fields, filledFields } = useApp();

    const progress = getProgress();
    const filledCount = Object.keys(filledFields).length;
    const totalFields = fields.length;

    return (
        <div className="sidebar-card progress-section">
            <div className="sidebar-card-header">
                <h3 className="sidebar-card-title">
                    <BarChart3 />
                    Fortschritt
                </h3>
            </div>

            <div className="progress-stats">
                <span className="progress-label">
                    {filledCount} von {totalFields} Feldern
                </span>
                <motion.span
                    className="progress-value"
                    key={progress}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                >
                    {progress}%
                </motion.span>
            </div>

            <div className="progress-bar-container">
                <motion.div
                    className="progress-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                />
            </div>
        </div>
    );
}
