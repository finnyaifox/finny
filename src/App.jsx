import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import LandingPage from './components/LandingPage/LandingPage';
import UploadZone from './components/UploadZone/UploadZone';
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
  const { status, filledPdfUrl, generatePdf, resetSession, uploadPdf, fields, startDemo, isDemo } = useApp();
  const { isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');
  // ... (keep state)

  // ... (keep useEffects)

  const handleNavigate = (page) => {
    console.log('Navigating to:', page);

    // Safety check leaving workspaces
    if ((page !== 'assistant' && page !== 'full-ai') && isWorkspace) {
      const confirm = window.confirm('Möchtest du die aktuelle Sitzung beenden?');
      if (!confirm) return;
      resetSession();
    }
    setCurrentPage(page);
  };

  // ... (keep handlers)

  return (
    <div className="app">
      {/* ... hidden input ... */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onUploadClick={handleUploadClick}
        status={status}
      />

      <main className="app-main">
        <AnimatePresence mode="wait">
          {/* Home / Landing Page */}
          {currentPage === 'home' && !isWorkspace && (
            // ... keep landing ...
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="page-wrapper"
            >
              <LandingPage
                onStartDemo={handleStartDemo}
                onUploadClick={handleUploadClick}
              />
              <Footer />
            </motion.div>
          )}

          {/* ... Features, Help, Login, Member ... */}
          {currentPage === 'features' && !isWorkspace && (
            // keep features
            <motion.div key="features" className="page-wrapper" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* ... content ... */}
              {/* Simplified for replace clarity, keeping structure */}
              <div className="page-content">
                <div className="page-container">
                  <h1>Funktionen</h1>
                  {/* ... rest of features page content ... */}
                  <div className="feature-grid-page">
                    <div className="feature-item"><h3>🤖 KI-gestützte Analyse</h3><p>Finny erkennt automatisch alle Formularfelder in deinem PDF und versteht deren Kontext.</p></div>
                    <div className="feature-item"><h3>💬 Natürlicher Dialog</h3><p>Beantworte einfache Fragen im Chat. Kein kompliziertes Formular-Ausfüllen mehr.</p></div>
                    <div className="feature-item"><h3>✏️ Flexible Bearbeitung</h3><p>Ändere Eingaben jederzeit über die Sidebar oder im Chat.</p></div>
                    <div className="feature-item"><h3>📱 Responsive Design</h3><p>Nutze Finny auf Desktop, Tablet oder Smartphone - überall optimal.</p></div>
                    <div className="feature-item"><h3>🔒 Datenschutz</h3><p>Deine Daten werden nicht dauerhaft gespeichert und sind sicher verschlüsselt.</p></div>
                    <div className="feature-item"><h3>⚡ Schnelle Verarbeitung</h3><p>In wenigen Minuten ist dein PDF ausgefüllt und zum Download bereit.</p></div>
                  </div>
                </div>
              </div>
              <Footer />
            </motion.div>
          )}

          {currentPage === 'help' && !isWorkspace && (
            <motion.div key="help" className="page-wrapper" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="page-content">
                <div className="page-container">
                  <h1>Hilfe & FAQ</h1>
                  {/* ... faq content ... */}
                  <p className="page-lead">Häufig gestellte Fragen zu Finny</p>
                  <div className="faq-list">
                    <div className="faq-item"><h3>Wie funktioniert Finny?</h3><p>Lade ein PDF mit Formularfeldern hoch.</p></div>
                    <div className="faq-item"><h3>Welche PDF-Dateien werden unterstützt?</h3><p>Finny unterstützt PDF-Dokumente mit nativen Formularfeldern.</p></div>
                    <div className="faq-item"><h3>Wie sicher sind meine Daten?</h3><p>Deine Daten werden verschlüsselt übertragen.</p></div>
                    <div className="faq-item"><h3>Kann ich Eingaben korrigieren?</h3><p>Ja! Du kannst alle Felder in der linken Sidebar jederzeit bearbeiten.</p></div>
                    <div className="faq-item"><h3>Was kostet Finny?</h3><p>Finny ist aktuell kostenlos nutzbar.</p></div>
                  </div>
                </div>
              </div>
              <Footer />
            </motion.div>
          )}

          {currentPage === 'login' && !isWorkspace && (
            <motion.div key="login" className="page-wrapper" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AuthPage onSuccess={handleAuthSuccess} />
              <Footer />
            </motion.div>
          )}

          {currentPage === 'member' && !isWorkspace && isAuthenticated && (
            <motion.div key="member" className="page-wrapper" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <MemberPage onNavigate={handleNavigate} />
              <Footer />
            </motion.div>
          )}

          {/* Full KI Mode - NEW INTEGRATION */}
          {currentPage === 'full-ai' && (
            <motion.div
              key="full-ai"
              className="workspace-wrapper full-ki-wrapper"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <FullAIWorkspace />
            </motion.div>
          )}


          {/* PDF Assistant / Workspace (Standard) */}
          {(currentPage === 'assistant' || isWorkspace) && currentPage !== 'full-ai' && (
            <motion.div
              key="workspace"
              className="workspace-wrapper"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
            >
              {!hasFields && !isWorkspace ? (
                <div className="upload-screen">
                  <div className="upload-hero">
                    <motion.img
                      src="/assets/finny-mascot.png"
                      alt="Finny"
                      className="upload-mascot"
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                    <h2>Lade dein PDF hoch! 📄</h2>
                    <p>Finny analysiert das Formular und hilft dir beim Ausfüllen.</p>
                  </div>
                  <UploadZone />
                </div>
              ) : (
                <div className="workspace">
                  <div className="workspace-sidebar">
                    <Sidebar />
                  </div>
                  <div className="workspace-main">
                    <ChatPanel
                      onShowHelp={handleShowHelp}
                      onShowPreview={handleShowPreview}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <SupportWidget />

      {/* Modals */}
      <HelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />

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
        pdfUrl={filledPdfUrl || 'https://example.com/demo.pdf'}
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
              <UploadZone />
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
