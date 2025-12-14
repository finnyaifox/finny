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
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef(null);

  const isWorkspace = status === 'chatting' || status === 'generating' || status === 'filling' || status === 'demo';
  const isDone = status === 'done';

  // Auto-switch to workspace when PDF is loaded OR demo mode starts
  useEffect(() => {
    if ((isWorkspace || isDemo) && currentPage !== 'assistant') {
      console.log('Auto-switching to assistant page');
      setCurrentPage('assistant');
    }
  }, [isWorkspace, isDemo]); // Remove currentPage from dependencies to avoid loop

  // Show download modal when done
  useEffect(() => {
    if (isDone && filledPdfUrl) {
      setShowDownloadModal(true);
    }
  }, [isDone, filledPdfUrl]);

  const handleNavigate = (page) => {
    console.log('Navigating to:', page);

    // Safety check leaving workspaces
    if ((page !== 'assistant' && page !== 'full-ai') && isWorkspace) {
      const confirm = window.confirm('Möchtest du die aktuelle Sitzung beenden? Nicht gespeicherte Daten gehen verloren.');
      if (!confirm) return;
      resetSession();
    }
    setCurrentPage(page);
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      uploadPdf(file);
      setCurrentPage('assistant');
      setShowUploadModal(false);
    }
    e.target.value = '';
  };

  const handleStartDemo = () => {
    console.log('Starting demo from LandingPage');
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
        // For demo, just show success
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

  // Check if we should show workspace (has fields loaded)
  const hasFields = fields && fields.length > 0;

  return (
    <div className="app">
      {/* Hidden file input */}
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

          {/* Features Page */}
          {currentPage === 'features' && !isWorkspace && (
            <motion.div
              key="features"
              className="page-wrapper"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="page-content">
                <div className="page-container">
                  <h1>Funktionen</h1>
                  <p className="page-lead">Entdecke alle Features von Finny - deinem intelligenten PDF-Assistenten.</p>

                  <div className="feature-grid-page">
                    <div className="feature-item">
                      <h3>🤖 KI-gestützte Analyse</h3>
                      <p>Finny erkennt automatisch alle Formularfelder in deinem PDF und versteht deren Kontext.</p>
                    </div>
                    <div className="feature-item">
                      <h3>💬 Natürlicher Dialog</h3>
                      <p>Beantworte einfache Fragen im Chat. Kein kompliziertes Formular-Ausfüllen mehr.</p>
                    </div>
                    <div className="feature-item">
                      <h3>✏️ Flexible Bearbeitung</h3>
                      <p>Ändere Eingaben jederzeit über die Sidebar oder im Chat.</p>
                    </div>
                    <div className="feature-item">
                      <h3>📱 Responsive Design</h3>
                      <p>Nutze Finny auf Desktop, Tablet oder Smartphone - überall optimal.</p>
                    </div>
                    <div className="feature-item">
                      <h3>🔒 Datenschutz</h3>
                      <p>Deine Daten werden nicht dauerhaft gespeichert und sind sicher verschlüsselt.</p>
                    </div>
                    <div className="feature-item">
                      <h3>⚡ Schnelle Verarbeitung</h3>
                      <p>In wenigen Minuten ist dein PDF ausgefüllt und zum Download bereit.</p>
                    </div>
                  </div>
                </div>
              </div>
              <Footer />
            </motion.div>
          )}

          {/* Help/FAQ Page */}
          {currentPage === 'help' && !isWorkspace && (
            <motion.div
              key="help"
              className="page-wrapper"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="page-content">
                <div className="page-container">
                  <h1>Hilfe & FAQ</h1>
                  <p className="page-lead">Häufig gestellte Fragen zu Finny</p>

                  <div className="faq-list">
                    <div className="faq-item">
                      <h3>Wie funktioniert Finny?</h3>
                      <p>Lade ein PDF mit Formularfeldern hoch. Finny analysiert die Felder und stellt dir Fragen im Chat. Deine Antworten werden automatisch in die richtigen Felder eingetragen.</p>
                    </div>
                    <div className="faq-item">
                      <h3>Welche PDF-Dateien werden unterstützt?</h3>
                      <p>Finny unterstützt PDF-Dokumente mit nativen Formularfeldern (erstellt z.B. mit Adobe Acrobat, LibreOffice oder ähnlichen Tools).</p>
                    </div>
                    <div className="faq-item">
                      <h3>Wie sicher sind meine Daten?</h3>
                      <p>Deine Daten werden verschlüsselt übertragen und nicht dauerhaft gespeichert. Nach der Sitzung werden alle Daten gelöscht.</p>
                    </div>
                    <div className="faq-item">
                      <h3>Kann ich Eingaben korrigieren?</h3>
                      <p>Ja! Du kannst alle Felder in der linken Sidebar jederzeit bearbeiten oder löschen.</p>
                    </div>
                    <div className="faq-item">
                      <h3>Was kostet Finny?</h3>
                      <p>Finny ist aktuell kostenlos nutzbar. Keine Registrierung erforderlich.</p>
                    </div>
                  </div>
                </div>
              </div>
              <Footer />
            </motion.div>
          )}

          {/* Login Page */}
          {currentPage === 'login' && !isWorkspace && (
            <motion.div
              key="login"
              className="page-wrapper"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AuthPage onSuccess={handleAuthSuccess} />
              <Footer />
            </motion.div>
          )}

          {/* Member Page */}
          {currentPage === 'member' && !isWorkspace && isAuthenticated && (
            <motion.div
              key="member"
              className="page-wrapper"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
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
