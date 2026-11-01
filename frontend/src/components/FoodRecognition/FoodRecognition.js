import React, { useState } from 'react';
import ImageUploader from '../ImageUploader/ImageUploader';
import ResultCard from '../ResultCard/ResultCard';
import ChatWidget from '../ChatWidget/ChatWidget';
import { recognizeFood } from '../../services/api';
import './FoodRecognition.css';

const FoodRecognition = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleImageSelected = (file) => {
    setSelectedFile(file);
    if (!file) {
      setResult(null);
      setError('');
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError('');

    try {
      const data = await recognizeFood(selectedFile);
      setResult(data);
    } catch (err) {
      setError(err.userMessage || 'Failed to recognize food item. Please try another image.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate percentages for visual macro bars (based on typical 2000 kcal diet reference)
  const proteinPercent = Math.min(100, Math.round(((result?.protein || 0) / 50) * 100));
  const carbsPercent = Math.min(100, Math.round(((result?.carbs || 0) / 275) * 100));
  const fatPercent = Math.min(100, Math.round(((result?.fat || 0) / 78) * 100));
  const fiberPercent = Math.min(100, Math.round(((result?.fiber || 0) / 28) * 100));

  return (
    <div className="feature-container fade-in-up">
      <div className="feature-header">
        <div className="feature-tag">Multimodal Computer Vision</div>
        <h1 className="feature-title">AI Food Recognition & Nutrition Estimation</h1>
        <p className="feature-subtitle">
          Upload any photo of a meal, snack, or ingredient. Our Gemini vision models
          identify items, analyze portions, and estimate comprehensive nutritional content.
        </p>
      </div>

      <div className="feature-layout">
        <div className="input-column">
          <div className="card-box">
            <h3 className="box-title">Upload Food Image</h3>
            <ImageUploader
              onImageSelected={handleImageSelected}
              label="Drop meal or ingredient photo here"
              sublabel="Clear daylight photos yield the highest accuracy"
            />
            <button
              type="button"
              className="action-primary-btn"
              onClick={handleAnalyze}
              disabled={!selectedFile || loading}
            >
              {loading ? (
                <span className="btn-loading">
                  <span className="spinner"></span> Analyzing Image with AI...
                </span>
              ) : (
                '🔍 Identify & Analyze Nutrition'
              )}
            </button>
            {error && <div className="error-alert">⚠️ {error}</div>}
          </div>

          {result && (
            <div className="chat-section">
              <ChatWidget
                endpoint="/api/recognize/chat"
                context={`The user identified ${result.food_name} with estimated ${result.calories_estimate} calories, ${result.protein}g protein, ${result.carbs}g carbs, ${result.fat}g fat.`}
                title={`Ask about ${result.food_name}`}
                initialMessage={`I've analyzed your ${result.food_name}! Ask me anything about its nutritional profile, healthy cooking methods, or dietary suitability.`}
                suggestedQuestions={[
                  `Is ${result.food_name} good for weight loss?`,
                  `What are healthy alternatives to ${result.food_name}?`,
                  `How can I balance this meal with more protein?`,
                ]}
              />
            </div>
          )}
        </div>

        <div className="result-column">
          {loading && (
            <div className="loading-card shimmer">
              <div className="shimmer-line title-line"></div>
              <div className="shimmer-line sub-line"></div>
              <div className="shimmer-box"></div>
              <div className="shimmer-line"></div>
              <div className="shimmer-line"></div>
            </div>
          )}

          {!loading && !result && (
            <div className="empty-state">
              <div className="empty-icon">🥗</div>
              <h3>Awaiting Food Photo</h3>
              <p>Upload a food image to view AI identification, macronutrient metrics, and health benefits.</p>
              <div className="empty-tips">
                <span className="tip-chip">💡 Tips: Works with cooked dishes, raw fruits, packaged goods & beverages</span>
              </div>
            </div>
          )}

          {!loading && result && (
            <div className="results-wrapper">
              {/* Primary Identity Card */}
              <ResultCard
                title={result.food_name}
                icon="🍲"
                badge={`${Math.round(result.confidence * 100)}% Confidence`}
                badgeType="success"
              >
                <p className="food-description">{result.description}</p>
                <div className="serving-info">
                  <span className="serving-label">Serving Size:</span>
                  <span className="serving-val">{result.serving_size || '1 standard portion'}</span>
                </div>

                {/* Nutrition Label Block */}
                <div className="nutrition-label-box">
                  <div className="nutrition-label-header">
                    <h4>Nutrition Facts</h4>
                    <span className="calories-badge">
                      <strong>{result.calories_estimate}</strong> kcal
                    </span>
                  </div>

                  <div className="macro-meters">
                    {/* Protein */}
                    <div className="meter-row">
                      <div className="meter-label-wrap">
                        <span className="meter-name">Protein</span>
                        <span className="meter-val">{result.protein}g</span>
                      </div>
                      <div className="meter-track">
                        <div
                          className="meter-fill protein-fill"
                          style={{ width: `${proteinPercent}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Carbs */}
                    <div className="meter-row">
                      <div className="meter-label-wrap">
                        <span className="meter-name">Carbohydrates</span>
                        <span className="meter-val">{result.carbs}g</span>
                      </div>
                      <div className="meter-track">
                        <div
                          className="meter-fill carbs-fill"
                          style={{ width: `${carbsPercent}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Fat */}
                    <div className="meter-row">
                      <div className="meter-label-wrap">
                        <span className="meter-name">Total Fat</span>
                        <span className="meter-val">{result.fat}g</span>
                      </div>
                      <div className="meter-track">
                        <div
                          className="meter-fill fat-fill"
                          style={{ width: `${fatPercent}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Fiber */}
                    <div className="meter-row">
                      <div className="meter-label-wrap">
                        <span className="meter-name">Dietary Fiber</span>
                        <span className="meter-val">{result.fiber || 0}g</span>
                      </div>
                      <div className="meter-track">
                        <div
                          className="meter-fill fiber-fill"
                          style={{ width: `${fiberPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Health Benefits */}
                {result.health_benefits && result.health_benefits.length > 0 && (
                  <div className="benefits-section">
                    <h4 className="benefits-title">Key Health Benefits</h4>
                    <ul className="benefits-list">
                      {result.health_benefits.map((benefit, idx) => (
                        <li key={idx} className="benefit-item">
                          <span className="benefit-check">✓</span>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </ResultCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FoodRecognition;
