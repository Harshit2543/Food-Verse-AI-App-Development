import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import HomePage from './pages/HomePage';
import FoodRecognitionPage from './pages/FoodRecognitionPage';
import FreshnessPage from './pages/FreshnessPage';
import HygienePage from './pages/HygienePage';
import CookingPage from './pages/CookingPage';
import NutritionPage from './pages/NutritionPage';
import './App.css';

/** Scroll to top on every route change */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
}

function App() {
  return (
    <Router>
      <div className="app">
        <ScrollToTop />
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/food-recognition" element={<FoodRecognitionPage />} />
            <Route path="/freshness" element={<FreshnessPage />} />
            <Route path="/hygiene" element={<HygienePage />} />
            <Route path="/cooking" element={<CookingPage />} />
            <Route path="/nutrition" element={<NutritionPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
