import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Features.css';

const features = [
  {
    icon: '🔍',
    title: 'Food Recognition',
    description: 'Instantly identify foods from photos and get detailed nutrition information with AI-powered visual analysis.',
    link: '/food-recognition',
  },
  {
    icon: '🧪',
    title: 'Freshness Detection',
    description: 'AI-powered freshness analysis for food safety. Know exactly how fresh your produce and ingredients are.',
    link: '/freshness',
  },
  {
    icon: '🏥',
    title: 'Hygiene Monitoring',
    description: 'Smart restaurant and kitchen hygiene evaluation. Get detailed scores and actionable recommendations.',
    link: '/hygiene',
  },
  {
    icon: '👨‍🍳',
    title: 'Cooking Assistant',
    description: 'AI-guided recipes and step-by-step cooking help. Turn your ingredients into delicious meals.',
    link: '/cooking',
  },
  {
    icon: '📊',
    title: 'Nutrition Planning',
    description: 'Personalized meal plans tailored to your health goals, dietary needs, and lifestyle preferences.',
    link: '/nutrition',
  },
];

function Features() {
  const sectionRef = useRef(null);
  const cardsRef = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );

    cardsRef.current.forEach((card) => {
      if (card) observer.observe(card);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section className="features" id="features" ref={sectionRef}>
      <div className="features__container">
        <div className="features__header animate-on-scroll" ref={(el) => cardsRef.current.push(el)}>
          <h2 className="features__title">Our AI-Powered Features</h2>
          <p className="features__subtitle">
            Harness the power of multimodal AI to transform how you interact with food —
            from farm to fork.
          </p>
        </div>

        <div className="features__grid">
          {features.map((feature, idx) => (
            <div
              key={feature.title}
              className="features__card animate-on-scroll"
              style={{ transitionDelay: `${idx * 0.1}s` }}
              ref={(el) => (cardsRef.current[idx + 1] = el)}
            >
              <div className="features__card-icon">{feature.icon}</div>
              <h3 className="features__card-title">{feature.title}</h3>
              <p className="features__card-desc">{feature.description}</p>
              <Link to={feature.link} className="features__card-btn">
                Try Now
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;
