import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import LandingPage from './components/LandingPage/LandingPage';
import StandardUpload from './components/Upload/StandardUpload';
import FullKiUpload from './components/Upload/FullKiUpload';
import Sidebar from './components/Sidebar/Sidebar';
import ChatPanel from './components/Chat/ChatPanel';
import PreviewModal from './components/Modal/PreviewModal';
import DownloadModal from './components/Modal/DownloadModal';
import HelpModal from './components/Modal/HelpModal';
import AuthPage from './components/Auth/AuthPage';
import MemberPage from './components/Auth/MemberPage';
import FullAIWorkspace from './components/FullAI/FullAIWorkspace';
import SupportWidget from './components/Support/SupportWidget';
import './App.css';

function AppContent() {
  const { status, filledPdfUrl, generatePdf, resetSession, startSession, startDemo, isDemo } = useApp();
  const { isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadMode, setUploadMode] = useState(null); // 'standard' | 'full-ki'

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const isWorkspace = status === 'chatting' || status === 'generating' || status === 'filling' || status === 'demo';
  const isDone = status === 'done';

  // Output logs for debug
  useEffect(() => {
    console.log("App Status:", status, "Page:", currentPage);
  }, [status, currentPage]);

  // Auto-switch to workspace when PDF is loaded OR demo mode starts
  useEffect(() => {
    if ((isWorkspace || isDemo) && currentPage !== 'assistant') {
      setCurrentPage('assistant');
    }
  }, [isWorkspace, isDemo]);

  // Show download modal when done
  useEffect(() => {
    if (isDone && filledPdfUrl) {
      setShowDownloadModal(true);
    }
  }, [isDone, filledPdfUrl]);

  const handleNavigate = (page) => {
    if ((page !== 'assistant' && page !== 'full-ai') && isWorkspace) {
      const confirm = window.confirm('Möchtest du die aktuelle Sitzung beenden? Nicht gespeicherte Daten gehen verloren.');
      if (!confirm) return;
      resetSession();
    }
    setCurrentPage(page);
  };

  // Triggers for Landing Page
  const handleStandardClick = () => {
    setUploadMode('standard');
    setShowUploadModal(true);
  };

  const handleFullKiClick = () => {
    setUploadMode('full-ki');
    setShowUploadModal(true);
  };

  // Called when Upload Component finishes
  const handleUploadComplete = (data) => {
    // data: { mode, pdfUrl, fields, info?, file? }
    startSession(data);
    setShowUploadModal(false);
    setCurrentPage('assistant');
  };

  const handleStartDemo = () => {
    startDemo();
    setCurrentPage('assistant');
  };

  const handleShowHelp = () => {
    setShowHelpModal(true);
  };

  const handleShowPreview = () => {
    setShowPreviewModal(true);
  };

  const handleConfirmGenerate = async () => {
    setIsGenerating(true);
    try {
      if (isDemo) {
        setTimeout(() => {
          setShowPreviewModal(false);
          setShowDownloadModal(true);
        }, 1000);
      } else {
        await generatePdf();
        setShowPreviewModal(false);
        setShowDownloadModal(true);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNewSession = () => {
    setShowDownloadModal(false);
    setCurrentPage('home');
    resetSession();
  };

  const handleAuthSuccess = () => {
    setCurrentPage('member');
  };

  return (
    <div className="app">
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onUploadClick={handleStandardClick} // Default for Navbar
        status={status}
      />

      <main className="app-main">
        <AnimatePresence mode="wait">
          {/* Home / Landing Page */}
          {currentPage === 'home' && !isWorkspace && (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="page-wrapper"
            >
              <LandingPage
                onStartDemo={handleStartDemo}
                onUploadClick={{
                  onStandardClick: handleStandardClick,
                  onFullKiClick: handleFullKiClick
                }}
              />
              <Footer />
            </motion.div>
          )}

          {/* ... Features, Help, Login, Member (Keep existing) ... */}
          {currentPage === 'features' && !isWorkspace && (<div>Feature Placeholder</div>)}

          {/* PDF Assistant / Workspace */}
          {(currentPage === 'assistant' || isWorkspace) && (
            <motion.div
              key="workspace"
              className="workspace-wrapper"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="workspace">
                <div className="workspace-sidebar">
                  <Sidebar />
                </div>
                <div className="workspace-main">
                  <ChatPanel
                    onShowHelp={handleShowHelp}
                    onShowPreview={handleShowPreview}
                  // Pass dummy to ensure it doesn't break if props needed
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <SupportWidget />

      {/* Modals */}
      <HelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />

      <PreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        onConfirm={handleConfirmGenerate}
        isLoading={isGenerating}
      />

      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        onNewSession={handleNewSession}
        pdfUrl={filledPdfUrl || '#'}
      />

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowUploadModal(false)}
          >
            <motion.div
              className="upload-modal"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              {uploadMode === 'standard' ? (
                <StandardUpload onUploadComplete={handleUploadComplete} />
              ) : (
                <FullKiUpload onUploadComplete={handleUploadComplete} />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}
