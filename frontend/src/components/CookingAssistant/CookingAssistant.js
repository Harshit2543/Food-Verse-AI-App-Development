import React, { useState } from 'react';
import ImageUploader from '../ImageUploader/ImageUploader';
import ResultCard from '../ResultCard/ResultCard';
import ChatWidget from '../ChatWidget/ChatWidget';
import { getRecipeFromImage, getRecipeFromText } from '../../services/api';
import './CookingAssistant.css';

const CUISINES = [
  'Any',
  'Italian',
  'Indian',
  'Chinese',
  'Mexican',
  'Japanese',
  'Thai',
  'American',
  'Mediterranean',
  'French',
];

const DIETARY_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Dairy-Free',
  'Keto',
  'Halal',
];

const CookingAssistant = () => {
  const [activeTab, setActiveTab] = useState('image'); // 'image' or 'text'
  const [selectedFile, setSelectedFile] = useState(null);

  // Text tab state
  const [ingredientInput, setIngredientInput] = useState('');
  const [ingredientsList, setIngredientsList] = useState([
    'Tomatoes',
    'Garlic',
    'Olive Oil',
    'Basil',
  ]);
  const [selectedCuisine, setSelectedCuisine] = useState('Any');
  const [selectedDietary, setSelectedDietary] = useState([]);

  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState(null);
  const [error, setError] = useState('');
  const [checkedIngredients, setCheckedIngredients] = useState({});

  const handleAddIngredient = (e) => {
    e?.preventDefault();
    if (ingredientInput.trim() && !ingredientsList.includes(ingredientInput.trim())) {
      setIngredientsList([...ingredientsList, ingredientInput.trim()]);
      setIngredientInput('');
    }
  };

  const handleRemoveIngredient = (ing) => {
    setIngredientsList(ingredientsList.filter((item) => item !== ing));
  };

  const handleToggleDietary = (diet) => {
    if (selectedDietary.includes(diet)) {
      setSelectedDietary(selectedDietary.filter((d) => d !== diet));
    } else {
      setSelectedDietary([...selectedDietary, diet]);
    }
  };

  const handleToggleCheck = (index) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleGenerate = async () => {
    setError('');
    setLoading(true);
    setCheckedIngredients({});

    try {
      let data;
      if (activeTab === 'image') {
        if (!selectedFile) return;
        data = await getRecipeFromImage(selectedFile);
      } else {
        if (!ingredientsList.length) {
          setError('Please add at least one ingredient.');
          setLoading(false);
          return;
        }
        data = await getRecipeFromText(
          ingredientsList,
          selectedCuisine,
          selectedDietary
        );
      }
      setRecipe(data);
    } catch (err) {
      setError(err.userMessage || 'Could not generate recipe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="feature-container fade-in-up">
      <div className="feature-header">
        <div className="feature-tag">Multimodal Culinary AI</div>
        <h1 className="feature-title">Smart AI Cooking & Recipe Assistant</h1>
        <p className="feature-subtitle">
          Turn surplus ingredients or pantry photos into delicious, chef-crafted recipes
          with step-by-step guidance and interactive cooking assistance.
        </p>
      </div>

      <div className="tab-control-bar">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'image' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('image');
            setError('');
          }}
        >
          📸 Generate from Ingredients Photo
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('text');
            setError('');
          }}
        >
          📝 Customize Ingredients & Cuisine
        </button>
      </div>

      <div className="feature-layout">
        <div className="input-column">
          {activeTab === 'image' ? (
            <div className="card-box">
              <h3 className="box-title">Upload Pantry / Fridge Photo</h3>
              <ImageUploader
                onImageSelected={setSelectedFile}
                label="Drop ingredients or grocery layout photo"
                sublabel="AI identifies available produce, spices, and proteins"
              />
              <button
                type="button"
                className="action-primary-btn"
                onClick={handleGenerate}
                disabled={!selectedFile || loading}
              >
                {loading ? (
                  <span className="btn-loading">
                    <span className="spinner"></span> Crafting Custom Recipe...
                  </span>
                ) : (
                  '👨‍🍳 Create Recipe from Photo'
                )}
              </button>
              {error && <div className="error-alert">⚠️ {error}</div>}
            </div>
          ) : (
            <div className="card-box">
              <h3 className="box-title">Ingredients You Have</h3>
              <form onSubmit={handleAddIngredient} className="ingredient-add-form">
                <input
                  type="text"
                  value={ingredientInput}
                  onChange={(e) => setIngredientInput(e.target.value)}
                  placeholder="e.g. Chicken breast, bell peppers, soy sauce"
                  className="ingredient-input"
                />
                <button type="submit" className="add-tag-btn">
                  + Add
                </button>
              </form>

              <div className="tags-container">
                {ingredientsList.map((ing, i) => (
                  <span key={i} className="ingredient-tag">
                    {ing}
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(ing)}
                      className="tag-remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="form-group">
                <label className="form-label">Cuisine Preference</label>
                <select
                  value={selectedCuisine}
                  onChange={(e) => setSelectedCuisine(e.target.value)}
                  className="cuisine-select"
                >
                  {CUISINES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Dietary Preferences</label>
                <div className="dietary-checkboxes">
                  {DIETARY_OPTIONS.map((diet) => (
                    <label key={diet} className="diet-pill">
                      <input
                        type="checkbox"
                        checked={selectedDietary.includes(diet)}
                        onChange={() => handleToggleDietary(diet)}
                      />
                      <span>{diet}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="action-primary-btn"
                onClick={handleGenerate}
                disabled={loading || !ingredientsList.length}
              >
                {loading ? (
                  <span className="btn-loading">
                    <span className="spinner"></span> Generating Custom Recipe...
                  </span>
                ) : (
                  '🍳 Generate Tailored Recipe'
                )}
              </button>
              {error && <div className="error-alert">⚠️ {error}</div>}
            </div>
          )}

          {recipe && (
            <div className="chat-section">
              <ChatWidget
                endpoint="/api/cooking/chat"
                context={`Current recipe: ${recipe.recipe_name}. Difficulty: ${recipe.difficulty}. Prep: ${recipe.prep_time}. Cook: ${recipe.cook_time}.`}
                title="Sous-Chef Live Assistant"
                initialMessage={`I'm your AI sous-chef for "${recipe.recipe_name}"! Need an ingredient substitution, timer advice, or step clarification?`}
                suggestedQuestions={[
                  'What can I substitute if I run out of an ingredient?',
                  'How can I make this dish spicier?',
                  'Can this recipe be prepared in an air fryer?',
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

          {!loading && !recipe && (
            <div className="empty-state">
              <div className="empty-icon">🍳</div>
              <h3>Ready to Cook Something Great?</h3>
              <p>Upload a picture of your available ingredients or enter what is in your fridge to generate a full gourmet recipe with step-by-step guidance.</p>
            </div>
          )}

          {!loading && recipe && (
            <div className="results-wrapper">
              <ResultCard
                title={recipe.recipe_name}
                icon="🍲"
                badge={recipe.cuisine}
                badgeType="success"
              >
                {/* Recipe Meta Pills */}
                <div className="recipe-meta-row">
                  <div className="meta-pill">
                    <span className="pill-icon">⏱️</span>
                    <div>
                      <span className="pill-label">Prep Time</span>
                      <span className="pill-val">{recipe.prep_time}</span>
                    </div>
                  </div>
                  <div className="meta-pill">
                    <span className="pill-icon">🔥</span>
                    <div>
                      <span className="pill-label">Cook Time</span>
                      <span className="pill-val">{recipe.cook_time}</span>
                    </div>
                  </div>
                  <div className="meta-pill">
                    <span className="pill-icon">👥</span>
                    <div>
                      <span className="pill-label">Servings</span>
                      <span className="pill-val">{recipe.servings}</span>
                    </div>
                  </div>
                  <div className="meta-pill">
                    <span className="pill-icon">📊</span>
                    <div>
                      <span className="pill-label">Difficulty</span>
                      <span className="pill-val">{recipe.difficulty}</span>
                    </div>
                  </div>
                </div>

                {/* Ingredients with checkboxes */}
                <div className="recipe-ingredients-block">
                  <h4 className="recipe-subheading">Ingredients Checklist</h4>
                  <div className="ingredients-grid">
                    {recipe.ingredients &&
                      recipe.ingredients.map((item, idx) => {
                        const name = typeof item === 'string' ? item : item.name;
                        const amount = typeof item === 'string' ? '' : item.amount;
                        const isChecked = !!checkedIngredients[idx];

                        return (
                          <div
                            key={idx}
                            className={`ing-check-item ${isChecked ? 'checked' : ''}`}
                            onClick={() => handleToggleCheck(idx)}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="ing-checkbox"
                            />
                            <span className="ing-item-text">
                              <strong>{amount}</strong> {name}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Step-by-Step Instructions */}
                <div className="instructions-block">
                  <h4 className="recipe-subheading">Preparation Instructions</h4>
                  <div className="steps-stack">
                    {recipe.instructions &&
                      recipe.instructions.map((step, idx) => {
                        const stepNum = typeof step === 'string' ? idx + 1 : step.step_number || idx + 1;
                        const stepText = typeof step === 'string' ? step : step.description || step.instruction;

                        return (
                          <div key={idx} className="step-card">
                            <span className="step-num">{stepNum}</span>
                            <p className="step-text">{stepText}</p>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Chef Tips */}
                {recipe.tips && recipe.tips.length > 0 && (
                  <div className="chef-tips-card">
                    <h4 className="tips-title">👨‍🍳 Chef's Secret Tips</h4>
                    <ul className="tips-list">
                      {recipe.tips.map((tip, idx) => (
                        <li key={idx}>✨ {tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Nutrition summary */}
                {recipe.nutrition_per_serving && (
                  <div className="recipe-nutrition-footer">
                    <span className="footer-title">Per Serving Nutrition:</span>
                    <div className="nutri-chips">
                      {Object.entries(recipe.nutrition_per_serving).map(([key, val]) => (
                        <span key={key} className="nutri-chip">
                          {key.replace('_', ' ')}: <strong>{val}</strong>
                        </span>
                      ))}
                    </div>
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

export default CookingAssistant;
