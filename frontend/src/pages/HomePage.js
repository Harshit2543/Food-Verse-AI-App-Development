import React from 'react';
import Hero from '../components/Hero/Hero';
import Features from '../components/Features/Features';

const HomePage = () => {
  return (
    <div className="home-page fade-in-up">
      <Hero />
      <Features />
    </div>
  );
};

export default HomePage;
