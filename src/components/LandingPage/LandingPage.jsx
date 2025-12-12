import { motion } from 'framer-motion';
import {
    Upload, Play, Sparkles, CheckCircle, FileText,
    MessageSquare, Download, Shield, Zap, Brain,
    Clock, Lock, Languages
} from 'lucide-react';
import './LandingPage.css';

export default function LandingPage({ onStartDemo, onUploadClick }) {
    const steps = [
        { icon: Upload, title: 'PDF hochladen', text: 'Lade dein PDF-Formular hoch' },
        { icon: Sparkles, title: 'KI analysiert', text: 'Finny erkennt alle Felder' },
        { icon: MessageSquare, title: 'Im Chat ausfüllen', text: 'Beantworte einfache Fragen' },
        { icon: Download, title: 'PDF downloaden', text: 'Lade dein ausgefülltes PDF' },
    ];

    const features = [
        { icon: Brain, title: 'Intelligente KI', text: 'Finny versteht den Kontext deines Formulars und stellt die richtigen Fragen.' },
        { icon: Zap, title: 'Blitzschnell', text: 'In wenigen Minuten sind auch komplexe Formulare vollständig ausgefüllt.' },
        { icon: Shield, title: 'Sicher & Privat', text: 'Deine Daten werden verschlüsselt und nicht dauerhaft gespeichert.' },
        { icon: Clock, title: '24/7 Verfügbar', text: 'Nutze Finny jederzeit - ohne Wartezeiten oder Termine.' },
        { icon: Lock, title: 'DSGVO-konform', text: 'Alle Prozesse entsprechen den deutschen Datenschutzrichtlinien.' },
        { icon: Languages, title: 'Mehrsprachig', text: 'Finny versteht Deutsch, Englisch und viele weitere Sprachen.' },
    ];

    return (
        <div className="landing-page">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <motion.div
                        className="hero-text"
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="hero-badge">
                            <Sparkles />
                            KI-gestützter PDF-Assistent
                        </div>

                        <h1 className="hero-title">
                            Hallo, ich bin <span>Finny</span>!
                            <br />
                            Dein PDF-Formular Assistent
                        </h1>

                        <p className="hero-subtitle">
                            Fülle PDF-Formulare ganz einfach im Chat aus. Ich erkenne die Felder
                            automatisch und stelle dir die richtigen Fragen. 🦊
                        </p>

                        <div className="hero-cta">
                            <motion.button
                                className="hero-btn-primary"
                                onClick={onUploadClick}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Upload />
                                PDF hochladen
                            </motion.button>

                            <motion.button
                                className="hero-btn-secondary"
                                onClick={onStartDemo}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Play />
                                Demo starten
                            </motion.button>
                        </div>

                        <div className="hero-features">
                            <div className="hero-feature">
                                <CheckCircle />
                                <span>Kostenlos testen</span>
                            </div>
                            <div className="hero-feature">
                                <CheckCircle />
                                <span>Keine Registrierung</span>
                            </div>
                            <div className="hero-feature">
                                <CheckCircle />
                                <span>Sofort loslegen</span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        className="hero-visual"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <div className="hero-mascot-container">
                            <div className="hero-glow" />
                            <motion.img
                                src="/assets/finny-mascot.png"
                                alt="Finny - Dein freundlicher PDF-Assistent"
                                className="hero-mascot"
                                animate={{ y: [0, -15, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* How It Works */}
            <section className="how-it-works">
                <div className="section-header">
                    <h2 className="section-title">So funktioniert's</h2>
                    <p className="section-subtitle">
                        In nur 4 einfachen Schritten zum ausgefüllten PDF
                    </p>
                </div>

                <div className="steps-container">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        return (
                            <motion.div
                                key={index}
                                className="step-card"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                viewport={{ once: true }}
                            >
                                <div className="step-number">{index + 1}</div>
                                <div className="step-icon">
                                    <Icon />
                                </div>
                                <h3 className="step-title">{step.title}</h3>
                                <p className="step-text">{step.text}</p>
                            </motion.div>
                        );
                    })}
                </div>
            </section>

            {/* Features */}
            <section className="features-section" id="features">
                <div className="section-header">
                    <h2 className="section-title">Warum Finny?</h2>
                    <p className="section-subtitle">
                        Entdecke die Vorteile des intelligenten PDF-Assistenten
                    </p>
                </div>

                <div className="features-grid">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <motion.div
                                key={index}
                                className="feature-card"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                viewport={{ once: true }}
                            >
                                <div className="feature-icon">
                                    <Icon />
                                </div>
                                <h3 className="feature-title">{feature.title}</h3>
                                <p className="feature-text">{feature.text}</p>
                            </motion.div>
                        );
                    })}
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <motion.div
                    className="cta-content"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <h2 className="cta-title">Bereit loszulegen?</h2>
                    <p className="cta-text">
                        Lade jetzt dein erstes PDF hoch und erlebe, wie einfach
                        Formulare ausfüllen sein kann!
                    </p>
                    <motion.button
                        className="hero-btn-primary"
                        onClick={onUploadClick}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{ margin: '0 auto' }}
                    >
                        <Upload />
                        Jetzt starten
                    </motion.button>
                </motion.div>
            </section>
        </div>
    );
}
