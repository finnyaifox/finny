import { Mail, Phone, MapPin, Twitter, Linkedin, Github } from 'lucide-react';
import './Footer.css';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-content">
                <div className="footer-brand">
                    <div className="footer-brand-logo">
                        <img src="/assets/finny-mascot.png" alt="Finny" />
                        <span>Finny</span>
                    </div>
                    <p className="footer-brand-text">
                        Dein intelligenter AI-PDF Formular-Assistent. Fülle PDF-Formulare
                        schnell und einfach mit Hilfe von künstlicher Intelligenz aus.
                    </p>
                </div>

                <div className="footer-column">
                    <h4>Produkt</h4>
                    <ul className="footer-links">
                        <li><a href="#features">Funktionen</a></li>
                        <li><a href="#pricing">Preise</a></li>
                        <li><a href="#faq">FAQ</a></li>
                        <li><a href="#api">API</a></li>
                    </ul>
                </div>

                <div className="footer-column">
                    <h4>Rechtliches</h4>
                    <ul className="footer-links">
                        <li><a href="#privacy">Datenschutz</a></li>
                        <li><a href="#terms">AGB</a></li>
                        <li><a href="#imprint">Impressum</a></li>
                        <li><a href="#cookies">Cookies</a></li>
                    </ul>
                </div>

                <div className="footer-column">
                    <h4>Kontakt</h4>
                    <div className="footer-contact">
                        <div className="footer-contact-item">
                            <Mail />
                            <span>info@finny-gmbh.de</span>
                        </div>
                        <div className="footer-contact-item">
                            <Phone />
                            <span>+49 123 456 7890</span>
                        </div>
                        <div className="footer-contact-item">
                            <MapPin />
                            <span>Musterstraße 1, 12345 Berlin</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <p className="footer-copyright">
                    © 2024 Finny GmbH. Alle Rechte vorbehalten. | Geschäftsführer: Max Mustermann
                </p>
                <div className="footer-social">
                    <a href="#twitter" aria-label="Twitter">
                        <Twitter />
                    </a>
                    <a href="#linkedin" aria-label="LinkedIn">
                        <Linkedin />
                    </a>
                    <a href="#github" aria-label="GitHub">
                        <Github />
                    </a>
                </div>
            </div>
        </footer>
    );
}
