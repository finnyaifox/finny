import { useState } from 'react';
import { motion } from 'framer-motion';
import { Home, FileText, HelpCircle, Info, Upload, Menu, X, User, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

export default function Navbar({ currentPage, onNavigate, onUploadClick, status }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const { user, isAuthenticated } = useAuth();

    const navItems = [
        { id: 'home', label: 'Startseite', icon: Home },
        { id: 'assistant', label: 'PDF Assistent', icon: FileText },
        { id: 'features', label: 'Funktionen', icon: Info },
        { id: 'help', label: 'Hilfe', icon: HelpCircle },
    ];

    const isProcessing = ['uploading', 'extracting', 'generating', 'filling'].includes(status);

    const handleNavClick = (e, pageId) => {
        e.preventDefault();
        onNavigate(pageId);
        setMenuOpen(false);
    };

    return (
        <nav className="navbar">
            <a
                href="#"
                className="navbar-brand"
                onClick={(e) => handleNavClick(e, 'home')}
            >
                <motion.img
                    src="/assets/finny-mascot.png"
                    alt="Finny"
                    className="navbar-logo"
                    whileHover={{ scale: 1.05 }}
                />
                <span className="navbar-title">Finny</span>
            </a>

            <div className={`navbar-nav ${menuOpen ? 'open' : ''}`}>
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <a
                            key={item.id}
                            href="#"
                            className={`nav-link ${currentPage === item.id ? 'active' : ''}`}
                            onClick={(e) => handleNavClick(e, item.id)}
                        >
                            <Icon />
                            <span>{item.label}</span>
                        </a>
                    );
                })}
            </div>

            <div className="navbar-actions">
                {status !== 'idle' && (
                    <div className="navbar-status">
                        <div className={`navbar-status-dot ${isProcessing ? 'processing' : ''}`} />
                        <span>{isProcessing ? 'Verarbeitung...' : 'Bereit'}</span>
                    </div>
                )}

                <motion.button
                    className="navbar-upload-btn"
                    onClick={onUploadClick}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <Upload />
                    <span className="navbar-upload-text">PDF hochladen</span>
                </motion.button>

                {isAuthenticated ? (
                    <motion.button
                        className="navbar-user-btn"
                        onClick={(e) => handleNavClick(e, 'member')}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="navbar-user-avatar">
                            {user?.displayName?.charAt(0) || 'M'}
                        </div>
                        <span className="navbar-user-name">{user?.displayName || 'Mitglied'}</span>
                    </motion.button>
                ) : (
                    <motion.button
                        className="navbar-login-btn"
                        onClick={(e) => handleNavClick(e, 'login')}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <LogIn />
                        <span>Anmelden</span>
                    </motion.button>
                )}

                <button
                    className="navbar-menu-toggle"
                    onClick={() => setMenuOpen(!menuOpen)}
                >
                    {menuOpen ? <X /> : <Menu />}
                </button>
            </div>
        </nav>
    );
}
