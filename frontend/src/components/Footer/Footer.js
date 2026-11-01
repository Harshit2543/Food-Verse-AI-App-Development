import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <span className="logo-icon">🍽️</span>
              <span className="logo-text">FoodVerse AI</span>
            </Link>
            <p className="footer-tagline">
              Multimodal AI-Powered Food Intelligence Platform integrating vision,
              freshness analysis, hygiene safety, and personalized nutrition.
            </p>
            <div className="footer-badges">
              <span className="tech-badge">Vision AI</span>
              <span className="tech-badge">Multimodal</span>
              <span className="tech-badge">Real-Time</span>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="footer-links">
            <h4 className="footer-heading">Platform Features</h4>
            <ul>
              <li><Link to="/food-recognition">🔍 Food Recognition</Link></li>
              <li><Link to="/freshness">🧪 Freshness Detection</Link></li>
              <li><Link to="/hygiene">🏥 Hygiene Monitoring</Link></li>
              <li><Link to="/cooking">👨‍🍳 Cooking Assistant</Link></li>
              <li><Link to="/nutrition">📊 Nutrition Planner</Link></li>
            </ul>
          </div>

          {/* Tech Stack Column */}
          <div className="footer-tech">
            <h4 className="footer-heading">Architecture & Core</h4>
            <div className="tech-list">
              <div className="tech-item">
                <span className="tech-dot green"></span>
                <span>Google Gemini 2.0 Flash Vision</span>
              </div>
              <div className="tech-item">
                <span className="tech-dot blue"></span>
                <span>FastAPI Python Backend</span>
              </div>
              <div className="tech-item">
                <span className="tech-dot cyan"></span>
                <span>React 18 & Modern Hooks</span>
              </div>
              <div className="tech-item">
                <span className="tech-dot orange"></span>
                <span>Mifflin-St Jeor TDEE Engine</span>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Food Verse AI. Multimodal Food Intelligence Ecosystem.</p>
          <div className="footer-bottom-links">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
            <span>•</span>
            <a href="#privacy">Privacy</a>
            <span>•</span>
            <a href="#terms">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
