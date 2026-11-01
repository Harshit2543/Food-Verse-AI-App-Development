import React, { useState } from 'react';
import ImageUploader from '../ImageUploader/ImageUploader';
import ResultCard from '../ResultCard/ResultCard';
import ChatWidget from '../ChatWidget/ChatWidget';
import { getNutritionPlan, analyzeMeal } from '../../services/api';
import './NutritionPlanner.css';

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary (Little or no exercise)' },
  { value: 'light', label: 'Lightly Active (Exercise 1-3 days/week)' },
  { value: 'moderate', label: 'Moderately Active (Exercise 3-5 days/week)' },
  { value: 'very_active', label: 'Very Active (Hard exercise 6-7 days/week)' },
];

const DIETARY_PREFERENCES = [
  'None',
  'Vegetarian',
  'Vegan',
  'Keto',
  'Paleo',
  'Mediterranean',
  'Low Carb',
];

const COMMON_ALLERGIES = ['Nuts', 'Dairy', 'Gluten', 'Eggs', 'Soy', 'Shellfish'];

const GOALS = [
  { value: 'maintain', label: 'Maintain Current Weight' },
  { value: 'lose_weight', label: 'Fat Loss & Cutting (-500 kcal)' },
  { value: 'gain_muscle', label: 'Muscle Building & Hypertrophy (+300 kcal)' },
];

const NutritionPlanner = () => {
  const [activeTab, setActiveTab] = useState('plan'); // 'plan' or 'meal_scan'

  // Profile form state
  const [profile, setProfile] = useState({
    age: 28,
    weight_kg: 72,
    height_cm: 175,
    gender: 'male',
    activity_level: 'moderate',
    dietary_preference: 'None',
    allergies: [],
    goal: 'maintain',
  });

  // Meal scan state
  const [mealFile, setMealFile] = useState(null);
  const [mealResult, setMealResult] = useState(null);

  // Plan result state
  const [planResult, setPlanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAllergyToggle = (allergy) => {
    if (profile.allergies.includes(allergy)) {
      setProfile({
        ...profile,
        allergies: profile.allergies.filter((a) => a !== allergy),
      });
    } else {
      setProfile({
        ...profile,
        allergies: [...profile.allergies, allergy],
      });
    }
  };

  const handleGeneratePlan = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await getNutritionPlan(profile);
      setPlanResult(data);
    } catch (err) {
      setError(err.userMessage || 'Could not generate nutrition plan.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeMeal = async () => {
    if (!mealFile) return;
    setLoading(true);
    setError('');

    try {
      const data = await analyzeMeal(mealFile);
      setMealResult(data);
    } catch (err) {
      setError(err.userMessage || 'Meal analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="feature-container fade-in-up">
      <div className="feature-header">
        <div className="feature-tag">Personalized Metabolic Intelligence</div>
        <h1 className="feature-title">AI Nutrition & Metabolic Planner</h1>
        <p className="feature-subtitle">
          Calculate precise Total Daily Energy Expenditure (TDEE), generate macro-balanced
          dietary protocols, and log meals effortlessly via vision analysis.
        </p>
      </div>

      <div className="tab-control-bar">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'plan' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('plan');
            setError('');
          }}
        >
          📊 Comprehensive Diet Plan Generator
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'meal_scan' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('meal_scan');
            setError('');
          }}
        >
          📸 Instant Meal Photo Analysis
        </button>
      </div>

      <div className="feature-layout">
        <div className="input-column">
          {activeTab === 'plan' ? (
            <form onSubmit={handleGeneratePlan} className="card-box profile-form">
              <h3 className="box-title">Biometric Profile & Fitness Goals</h3>

              <div className="form-row">
                <div className="form-col">
                  <label className="input-label">Age (years)</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={profile.age}
                    onChange={(e) =>
                      setProfile({ ...profile, age: parseInt(e.target.value) || 0 })
                    }
                    className="styled-input"
                  />
                </div>
                <div className="form-col">
                  <label className="input-label">Gender</label>
                  <select
                    value={profile.gender}
                    onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                    className="styled-select"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-col">
                  <label className="input-label">Weight (kg)</label>
                  <input
                    type="number"
                    min="30"
                    max="250"
                    value={profile.weight_kg}
                    onChange={(e) =>
                      setProfile({ ...profile, weight_kg: parseFloat(e.target.value) || 0 })
                    }
                    className="styled-input"
                  />
                </div>
                <div className="form-col">
                  <label className="input-label">Height (cm)</label>
                  <input
                    type="number"
                    min="100"
                    max="230"
                    value={profile.height_cm}
                    onChange={(e) =>
                      setProfile({ ...profile, height_cm: parseFloat(e.target.value) || 0 })
                    }
                    className="styled-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="input-label">Daily Physical Activity</label>
                <select
                  value={profile.activity_level}
                  onChange={(e) => setProfile({ ...profile, activity_level: e.target.value })}
                  className="styled-select"
                >
                  {ACTIVITY_LEVELS.map((act) => (
                    <option key={act.value} value={act.value}>
                      {act.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-col">
                  <label className="input-label">Dietary Preference</label>
                  <select
                    value={profile.dietary_preference}
                    onChange={(e) =>
                      setProfile({ ...profile, dietary_preference: e.target.value })
                    }
                    className="styled-select"
                  >
                    {DIETARY_PREFERENCES.map((diet) => (
                      <option key={diet} value={diet}>
                        {diet}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-col">
                  <label className="input-label">Primary Goal</label>
                  <select
                    value={profile.goal}
                    onChange={(e) => setProfile({ ...profile, goal: e.target.value })}
                    className="styled-select"
                  >
                    {GOALS.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="input-label">Food Allergies / Intolerances</label>
                <div className="allergies-chips">
                  {COMMON_ALLERGIES.map((allergy) => (
                    <label key={allergy} className="allergy-chip">
                      <input
                        type="checkbox"
                        checked={profile.allergies.includes(allergy)}
                        onChange={() => handleAllergyToggle(allergy)}
                      />
                      <span>{allergy}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="action-primary-btn"
                disabled={loading}
              >
                {loading ? (
                  <span className="btn-loading">
                    <span className="spinner"></span> Computing TDEE & Meal Plan...
                  </span>
                ) : (
                  '📊 Calculate Macros & Generate Plan'
                )}
              </button>
              {error && <div className="error-alert">⚠️ {error}</div>}
            </form>
          ) : (
            <div className="card-box">
              <h3 className="box-title">Log Meal from Photo</h3>
              <ImageUploader
                onImageSelected={setMealFile}
                label="Snap or upload plate / meal photo"
                sublabel="AI identifies food types and provides nutritional breakdown"
              />
              <button
                type="button"
                className="action-primary-btn"
                onClick={handleAnalyzeMeal}
                disabled={!mealFile || loading}
              >
                {loading ? (
                  <span className="btn-loading">
                    <span className="spinner"></span> Analyzing Plate Composition...
                  </span>
                ) : (
                  '📸 Analyze Meal Nutrition'
                )}
              </button>
              {error && <div className="error-alert">⚠️ {error}</div>}
            </div>
          )}

          {planResult && activeTab === 'plan' && (
            <div className="chat-section">
              <ChatWidget
                endpoint="/api/nutrition/chat"
                context={`Target: ${planResult.daily_calories} kcal. Protein: ${planResult.total_macros?.protein_g}g. Carbs: ${planResult.total_macros?.carbs_g}g. Fat: ${planResult.total_macros?.fat_g}g.`}
                title="AI Clinical Nutritionist"
                initialMessage={`I have prepared your ${planResult.daily_calories} kcal nutritional blueprint. Do you need snack ideas, hydration goals, or workout timing tips?`}
                suggestedQuestions={[
                  'How should I time my meals around workouts?',
                  'Can you suggest high-protein evening snacks?',
                  'How much water should I drink daily?',
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
            </div>
          )}

          {!loading && !planResult && !mealResult && (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <h3>Generate Your Daily Nutrition Plan</h3>
              <p>Fill out your biometrics or upload a meal photo to calculate precise energy requirements and structured daily eating guidelines.</p>
            </div>
          )}

          {/* Full Plan Results */}
          {!loading && activeTab === 'plan' && planResult && (
            <div className="results-wrapper">
              <ResultCard
                title="Personalized Daily Nutrition Plan"
                icon="🎯"
                badge={`${planResult.daily_calories} kcal / day`}
                badgeType="success"
              >
                {/* Calorie & Macro Target Cards */}
                <div className="macro-cards-grid">
                  <div className="macro-card calories-card">
                    <span className="macro-sub">Daily Energy</span>
                    <span className="macro-main">{planResult.daily_calories}</span>
                    <span className="macro-unit">Kilocalories</span>
                  </div>
                  <div className="macro-card">
                    <span className="macro-sub">Target Protein</span>
                    <span className="macro-main protein-color">
                      {planResult.total_macros?.protein_g || 0}g
                    </span>
                    <span className="macro-unit">Muscle Recovery</span>
                  </div>
                  <div className="macro-card">
                    <span className="macro-sub">Carbohydrates</span>
                    <span className="macro-main carbs-color">
                      {planResult.total_macros?.carbs_g || 0}g
                    </span>
                    <span className="macro-unit">Primary Energy</span>
                  </div>
                  <div className="macro-card">
                    <span className="macro-sub">Essential Fats</span>
                    <span className="macro-main fat-color">
                      {planResult.total_macros?.fat_g || 0}g
                    </span>
                    <span className="macro-unit">Hormonal Health</span>
                  </div>
                </div>

                {/* Structured Daily Meals */}
                {planResult.meals && planResult.meals.length > 0 && (
                  <div className="meals-section">
                    <h4 className="section-title">Structured Daily Meal Schedule</h4>
                    <div className="meals-stack">
                      {planResult.meals.map((meal, idx) => (
                        <div key={idx} className="meal-card">
                          <div className="meal-header">
                            <span className="meal-name">
                              🍽️ {meal.name || `Meal ${idx + 1}`}
                            </span>
                            <span className="meal-cals">{meal.calories} kcal</span>
                          </div>
                          {meal.foods && (
                            <ul className="meal-foods">
                              {(Array.isArray(meal.foods) ? meal.foods : [meal.foods]).map(
                                (food, fIdx) => (
                                  <li key={fIdx}>• {food}</li>
                                )
                              )}
                            </ul>
                          )}
                          {meal.macros && (
                            <div className="meal-macros-strip">
                              <span>P: {meal.macros.protein || 0}g</span>
                              <span>C: {meal.macros.carbs || 0}g</span>
                              <span>F: {meal.macros.fat || 0}g</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {planResult.recommendations && planResult.recommendations.length > 0 && (
                  <div className="plan-recs-box">
                    <h4 className="section-title">Nutritionist Guidance</h4>
                    <ul className="plan-recs-list">
                      {planResult.recommendations.map((rec, idx) => (
                        <li key={idx}>✓ {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </ResultCard>
            </div>
          )}

          {/* Instant Meal Photo Analysis Results */}
          {!loading && activeTab === 'meal_scan' && mealResult && (
            <div className="results-wrapper">
              <ResultCard
                title={mealResult.food_name || 'Meal Analysis'}
                icon="🍲"
                badge={`${mealResult.calories_estimate || 0} kcal`}
                badgeType="info"
              >
                <p className="meal-description">{mealResult.description}</p>
                <div className="macro-cards-grid">
                  <div className="macro-card">
                    <span className="macro-sub">Estimated Calories</span>
                    <span className="macro-main">{mealResult.calories_estimate}</span>
                  </div>
                  <div className="macro-card">
                    <span className="macro-sub">Protein</span>
                    <span className="macro-main protein-color">{mealResult.protein}g</span>
                  </div>
                  <div className="macro-card">
                    <span className="macro-sub">Carbs</span>
                    <span className="macro-main carbs-color">{mealResult.carbs}g</span>
                  </div>
                  <div className="macro-card">
                    <span className="macro-sub">Fat</span>
                    <span className="macro-main fat-color">{mealResult.fat}g</span>
                  </div>
                </div>
              </ResultCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NutritionPlanner;
