import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const navLinks = [
  { path: '/', label: 'Home' },
  { path: '/food-recognition', label: 'Food Recognition' },
  { path: '/freshness', label: 'Freshness' },
  { path: '/hygiene', label: 'Hygiene' },
  { path: '/cooking', label: 'Cooking' },
  { path: '/nutrition', label: 'Nutrition' },
];

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 30);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  /* Close mobile menu on route change */
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const toggleMenu = () => setIsOpen((prev) => !prev);

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__container">
        {/* Logo */}
        <Link to="/" className="navbar__logo">
          <span className="navbar__logo-icon">🍽️</span>
          <span className="navbar__logo-text">FoodVerse AI</span>
        </Link>

        {/* Desktop Links */}
        <ul className="navbar__links">
          {navLinks.map((link) => (
            <li key={link.path}>
              <Link
                to={link.path}
                className={`navbar__link ${
                  location.pathname === link.path ? 'navbar__link--active' : ''
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Hamburger */}
        <button
          className={`navbar__hamburger ${isOpen ? 'navbar__hamburger--open' : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle navigation menu"
          aria-expanded={isOpen}
        >
          <span className="navbar__hamburger-line" />
          <span className="navbar__hamburger-line" />
          <span className="navbar__hamburger-line" />
        </button>

        {/* Mobile Menu */}
        <div className={`navbar__mobile ${isOpen ? 'navbar__mobile--open' : ''}`}>
          <ul className="navbar__mobile-links">
            {navLinks.map((link, idx) => (
              <li key={link.path} style={{ animationDelay: `${idx * 0.07}s` }}>
                <Link
                  to={link.path}
                  className={`navbar__mobile-link ${
                    location.pathname === link.path ? 'navbar__mobile-link--active' : ''
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div className="navbar__overlay" onClick={() => setIsOpen(false)} />
      )}
    </nav>
  );
}

export default Navbar;
