import { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, UserPlus, Mail, Lock, User, AlertCircle, Info, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

export default function AuthPage({ onSuccess }) {
    const [activeTab, setActiveTab] = useState('login');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Login form
    const [loginUsername, setLoginUsername] = useState('Max');
    const [loginPassword, setLoginPassword] = useState('12345');

    // Register form
    const [regUsername, setRegUsername] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');

    const { login, register } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(loginUsername, loginPassword);
            if (onSuccess) onSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        if (!regUsername || !regEmail || !regPassword) {
            setError('Bitte fülle alle Felder aus');
            return;
        }

        setIsLoading(true);

        try {
            await register(regUsername, regEmail, regPassword);
            if (onSuccess) onSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <motion.div
                className="auth-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div className="auth-header">
                    <motion.div
                        className="auth-logo"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                    >
                        <img src="/assets/finny-mascot.png" alt="Finny" />
                    </motion.div>
                    <h1>Willkommen zurück!</h1>
                    <p>Melde dich an oder erstelle ein Konto</p>
                </div>

                <div className="auth-tabs">
                    <button
                        className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('login'); setError(''); }}
                    >
                        <LogIn style={{ width: 16, height: 16, marginRight: 6, display: 'inline' }} />
                        Anmelden
                    </button>
                    <button
                        className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('register'); setError(''); }}
                    >
                        <UserPlus style={{ width: 16, height: 16, marginRight: 6, display: 'inline' }} />
                        Registrieren
                    </button>
                </div>

                {error && (
                    <motion.div
                        className="auth-error"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <AlertCircle />
                        {error}
                    </motion.div>
                )}

                {activeTab === 'login' ? (
                    <form className="auth-form" onSubmit={handleLogin}>
                        <div className="form-group">
                            <label className="form-label">Benutzername</label>
                            <div style={{ position: 'relative' }}>
                                <User style={{
                                    position: 'absolute',
                                    left: 12,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    width: 18,
                                    height: 18,
                                    color: 'var(--color-text-muted)'
                                }} />
                                <input
                                    type="text"
                                    className="form-input"
                                    style={{ paddingLeft: 40 }}
                                    placeholder="Dein Benutzername"
                                    value={loginUsername}
                                    onChange={(e) => setLoginUsername(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Passwort</label>
                            <div style={{ position: 'relative' }}>
                                <Lock style={{
                                    position: 'absolute',
                                    left: 12,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    width: 18,
                                    height: 18,
                                    color: 'var(--color-text-muted)'
                                }} />
                                <input
                                    type="password"
                                    className="form-input"
                                    style={{ paddingLeft: 40 }}
                                    placeholder="Dein Passwort"
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button type="submit" className="auth-submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 style={{ animation: 'spin 1s linear infinite' }} />
                                    Wird angemeldet...
                                </>
                            ) : (
                                <>
                                    <LogIn />
                                    Anmelden
                                </>
                            )}
                        </button>

                        <div className="demo-credentials">
                            <h4><Info /> Demo-Zugangsdaten</h4>
                            <p>
                                Benutzername: <code>Max</code><br />
                                Passwort: <code>12345</code>
                            </p>
                        </div>
                    </form>
                ) : (
                    <form className="auth-form" onSubmit={handleRegister}>
                        <div className="form-group">
                            <label className="form-label">Benutzername</label>
                            <div style={{ position: 'relative' }}>
                                <User style={{
                                    position: 'absolute',
                                    left: 12,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    width: 18,
                                    height: 18,
                                    color: 'var(--color-text-muted)'
                                }} />
                                <input
                                    type="text"
                                    className="form-input"
                                    style={{ paddingLeft: 40 }}
                                    placeholder="Wähle einen Benutzernamen"
                                    value={regUsername}
                                    onChange={(e) => setRegUsername(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">E-Mail</label>
                            <div style={{ position: 'relative' }}>
                                <Mail style={{
                                    position: 'absolute',
                                    left: 12,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    width: 18,
                                    height: 18,
                                    color: 'var(--color-text-muted)'
                                }} />
                                <input
                                    type="email"
                                    className="form-input"
                                    style={{ paddingLeft: 40 }}
                                    placeholder="deine@email.de"
                                    value={regEmail}
                                    onChange={(e) => setRegEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Passwort</label>
                            <div style={{ position: 'relative' }}>
                                <Lock style={{
                                    position: 'absolute',
                                    left: 12,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    width: 18,
                                    height: 18,
                                    color: 'var(--color-text-muted)'
                                }} />
                                <input
                                    type="password"
                                    className="form-input"
                                    style={{ paddingLeft: 40 }}
                                    placeholder="Wähle ein sicheres Passwort"
                                    value={regPassword}
                                    onChange={(e) => setRegPassword(e.target.value)}
                                />
                            </div>
                            <span className="form-hint">
                                <Info /> Mindestens 5 Zeichen
                            </span>
                        </div>

                        <button type="submit" className="auth-submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 style={{ animation: 'spin 1s linear infinite' }} />
                                    Wird erstellt...
                                </>
                            ) : (
                                <>
                                    <UserPlus />
                                    Konto erstellen
                                </>
                            )}
                        </button>
                    </form>
                )}
            </motion.div>
        </div>
    );
}
