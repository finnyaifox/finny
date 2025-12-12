import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Settings, LogOut, Upload, Clock, Star, FolderOpen, Trash2, Play } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import './Auth.css';

export default function MemberPage({ onNavigate }) {
    const { user, logout } = useAuth();
    const { getSavedSessions, loadSession, deleteSession } = useApp();
    const [savedSessions, setSavedSessions] = useState([]);

    useEffect(() => {
        // Load saved sessions
        const sessions = getSavedSessions();
        setSavedSessions(sessions);
    }, []);

    const handleLogout = () => {
        logout();
        onNavigate('home');
    };

    const handleLoadSession = (sessionId) => {
        loadSession(sessionId);
        onNavigate('assistant');
    };

    const handleDeleteSession = (sessionId, e) => {
        e.stopPropagation();
        if (window.confirm('Möchtest du diese gespeicherte Sitzung wirklich löschen?')) {
            deleteSession(sessionId);
            setSavedSessions(getSavedSessions());
        }
    };

    const stats = [
        { value: savedSessions.length.toString(), label: 'Gespeicherte PDFs', icon: FileText },
        { value: '24/7', label: 'Verfügbar', icon: Clock },
        { value: '5.0', label: 'Bewertung', icon: Star },
    ];

    const actions = [
        {
            icon: Upload,
            title: 'Neues PDF ausfüllen',
            description: 'Lade ein PDF hoch und lass Finny dir helfen',
            onClick: () => onNavigate('assistant')
        },
        {
            icon: FolderOpen,
            title: 'Meine Dokumente',
            description: `${savedSessions.length} gespeicherte Sitzungen`,
            onClick: () => { }
        },
        {
            icon: Settings,
            title: 'Einstellungen',
            description: 'Profil und Präferenzen verwalten',
            onClick: () => { }
        },
    ];

    return (
        <div className="member-page">
            <motion.div
                className="member-header"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="member-avatar">
                    {user?.displayName?.charAt(0) || 'M'}
                </div>
                <div className="member-info">
                    <h2>Hallo, {user?.displayName || 'Max Mustermann'}! 👋</h2>
                    <p>{user?.email || 'max@finny-gmbh.de'}</p>
                </div>
                <motion.button
                    className="btn-secondary"
                    onClick={handleLogout}
                    style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <LogOut style={{ width: 18, height: 18 }} />
                    Abmelden
                </motion.button>
            </motion.div>

            <div className="member-stats">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div
                            key={index}
                            className="stat-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <div className="stat-value">{stat.value}</div>
                            <div className="stat-label">
                                <Icon style={{ width: 14, height: 14, marginRight: 4, display: 'inline' }} />
                                {stat.label}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <div className="member-actions">
                {actions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                        <motion.div
                            key={index}
                            className="member-action-btn"
                            onClick={action.onClick}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + index * 0.1 }}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                        >
                            <div className="member-action-icon">
                                <Icon />
                            </div>
                            <div className="member-action-text">
                                <h4>{action.title}</h4>
                                <p>{action.description}</p>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Saved Sessions */}
            {savedSessions.length > 0 && (
                <div className="saved-sessions">
                    <h3>💾 Gespeicherte Sitzungen</h3>
                    <div className="sessions-grid">
                        {savedSessions.map((session, index) => (
                            <motion.div
                                key={session.sessionId}
                                className="session-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 + index * 0.1 }}
                                whileHover={{ scale: 1.02 }}
                            >
                                <div className="session-header">
                                    <FileText className="session-icon" />
                                    <div className="session-info">
                                        <h4>{session.pdfFileName || 'Unbenannt'}</h4>
                                        <span className="session-date">
                                            {new Date(session.savedAt).toLocaleString('de-DE')}
                                        </span>
                                    </div>
                                </div>

                                <div className="session-progress">
                                    <span className="session-progress-text">
                                        {Object.keys(session.filledFields || {}).length} / {session.fields?.length || 0} Felder
                                    </span>
                                    <div className="session-progress-bar">
                                        <div
                                            className="session-progress-fill"
                                            style={{
                                                width: `${session.fields?.length > 0 ? (Object.keys(session.filledFields || {}).length / session.fields.length * 100) : 0}%`
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="session-actions">
                                    <button
                                        className="session-btn primary"
                                        onClick={() => handleLoadSession(session.sessionId)}
                                    >
                                        <Play style={{ width: 16, height: 16 }} />
                                        Fortsetzen
                                    </button>
                                    <button
                                        className="session-btn danger"
                                        onClick={(e) => handleDeleteSession(session.sessionId, e)}
                                    >
                                        <Trash2 style={{ width: 16, height: 16 }} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {savedSessions.length === 0 && (
                <motion.div
                    className="no-sessions"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <FolderOpen style={{ width: 64, height: 64, opacity: 0.3 }} />
                    <p>Noch keine gespeicherten Sitzungen</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                        Starte eine neue PDF-Sitzung und sie wird automatisch gespeichert
                    </p>
                </motion.div>
            )}
        </div>
    );
}
