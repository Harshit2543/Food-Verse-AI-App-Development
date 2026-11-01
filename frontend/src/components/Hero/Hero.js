import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Hero.css';

const floatingEmojis = [
  { emoji: '🍎', top: '15%', left: '8%', delay: '0s', size: '2.5rem' },
  { emoji: '🥦', top: '25%', left: '85%', delay: '0.5s', size: '2.2rem' },
  { emoji: '🍕', top: '60%', left: '5%', delay: '1s', size: '2.8rem' },
  { emoji: '🥗', top: '70%', left: '90%', delay: '1.5s', size: '2rem' },
  { emoji: '🍔', top: '40%', left: '92%', delay: '2s', size: '2.4rem' },
  { emoji: '🍇', top: '80%', left: '15%', delay: '0.8s', size: '1.8rem' },
  { emoji: '🥑', top: '10%', left: '45%', delay: '1.2s', size: '2rem' },
  { emoji: '🍓', top: '50%', left: '12%', delay: '1.8s', size: '2.2rem' },
  { emoji: '🌽', top: '35%', left: '78%', delay: '0.3s', size: '2rem' },
  { emoji: '🧁', top: '85%', left: '75%', delay: '2.2s', size: '2.1rem' },
];

function Hero() {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const scrollToFeatures = () => {
    const featuresEl = document.getElementById('features');
    if (featuresEl) {
      featuresEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="hero">
      {/* Background Pattern */}
      <div className="hero__pattern" />

      {/* Floating Emojis */}
      {floatingEmojis.map((item, idx) => (
        <span
          key={idx}
          className="hero__emoji"
          style={{
            top: item.top,
            left: item.left,
            animationDelay: item.delay,
            fontSize: item.size,
          }}
          aria-hidden="true"
        >
          {item.emoji}
        </span>
      ))}

      {/* Content */}
      <div className={`hero__content ${showContent ? 'hero__content--visible' : ''}`}>
        <h1 className="hero__title">
          <span className="hero__title-line">Welcome to</span>
          <span className="hero__title-highlight">Food Verse AI</span>
        </h1>
        <p className="hero__subtitle">
          Your intelligent food companion — powered by multimodal AI to recognize foods,
          detect freshness, monitor hygiene, guide cooking, and plan nutrition.
        </p>
        <div className="hero__actions">
          <button className="hero__btn hero__btn--primary" onClick={scrollToFeatures}>
            Explore Features
          </button>
          <Link to="/food-recognition" className="hero__btn hero__btn--secondary">
            Get Started
          </Link>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="hero__scroll" onClick={scrollToFeatures} aria-label="Scroll down">
        <div className="hero__scroll-arrow">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6,9 12,15 18,9" />
          </svg>
        </div>
      </div>
    </section>
  );
}

export default Hero;
