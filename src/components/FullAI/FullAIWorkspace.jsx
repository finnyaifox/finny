import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import Sidebar from '../Sidebar/Sidebar';
import ChatPanel from '../Chat/ChatPanel';
import UploadZone from '../UploadZone/UploadZone';
import { motion, AnimatePresence } from 'framer-motion';

// This component mimics the main Workspace but is dedicated to "Full KI" mode
// In a real implementation, you might pass a prop to ChatPanel to enable "Step-by-Step" mode
// or handle it via a specific AI Prompt (which we did in aiService).

export default function FullAIWorkspace() {
    const { status, uploadPdf, isDemo, startDemo } = useApp();
    const [showPreview, setShowPreview] = useState(false);

    // Auto-inject a special message or set a flag if we wanted to enforce "Full KI Mode" strictly
    // For now, the user just wants this SEPARATE area.

    return (
        <div className="workspace-wrapper">
            {status === 'idle' && !isDemo ? (
                <UploadZone onUpload={uploadPdf} onDemoStart={startDemo} title="Full KI Assistent" subtitle="Lade dein PDF hoch - Ich übernehme den Rest komplett." />
            ) : (
                <div className="workspace">
                    <div className="workspace-sidebar">
                        <Sidebar />
                    </div>
                    <div className="workspace-main">
                        <ChatPanel
                            onShowHelp={() => { }}
                            onShowPreview={() => setShowPreview(true)}
                        />
                    </div>
                </div>
            )}

            {/* Preview Modal would go here re-used from App.jsx logic if extracted */}
        </div>
    );
}
