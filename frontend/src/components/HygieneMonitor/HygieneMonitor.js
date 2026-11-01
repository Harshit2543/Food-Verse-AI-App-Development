import React, { useState } from 'react';
import ImageUploader from '../ImageUploader/ImageUploader';
import ResultCard from '../ResultCard/ResultCard';
import { analyzeHygiene, analyzeHygieneVideoFrame } from '../../services/api';
import './HygieneMonitor.css';

const HygieneMonitor = () => {
  const [isVideoFrame, setIsVideoFrame] = useState(false);
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
      const data = isVideoFrame
        ? await analyzeHygieneVideoFrame(selectedFile)
        : await analyzeHygiene(selectedFile);
      setResult(data);
    } catch (err) {
      setError(err.userMessage || 'Hygiene analysis failed. Please try another image.');
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    switch (grade?.toUpperCase()) {
      case 'A': return '#2D6A4F';
      case 'B': return '#0284C7';
      case 'C': return '#D97706';
      case 'D': return '#EA580C';
      case 'F': return '#DC2626';
      default: return '#4B5563';
    }
  };

  const getGradeBadge = (grade) => {
    switch (grade?.toUpperCase()) {
      case 'A': return 'success';
      case 'B': return 'info';
      case 'C': return 'warning';
      default: return 'danger';
    }
  };

  return (
    <div className="feature-container fade-in-up">
      <div className="feature-header">
        <div className="feature-tag">Commercial & Domestic Food Safety</div>
        <h1 className="feature-title">AI Restaurant & Kitchen Hygiene Monitoring</h1>
        <p className="feature-subtitle">
          Real-time visual hygiene verification for commercial kitchens, prep surfaces,
          sanitation compliance, and food storage protocols.
        </p>
      </div>

      <div className="frame-type-bar">
        <label className="toggle-switch-label">
          <input
            type="checkbox"
            checked={isVideoFrame}
            onChange={(e) => setIsVideoFrame(e.target.checked)}
            className="toggle-checkbox"
          />
          <span className="toggle-slider"></span>
          <span className="toggle-text">
            {isVideoFrame
              ? '📹 Live Stream / Video Frame Mode Active'
              : '📸 Kitchen Photo Mode Active'}
          </span>
        </label>
      </div>

      <div className="feature-layout">
        <div className="input-column">
          <div className="card-box">
            <h3 className="box-title">Upload Kitchen Environment Photo</h3>
            <ImageUploader
              onImageSelected={handleImageSelected}
              label={
                isVideoFrame
                  ? 'Drop surveillance or prep-line video frame'
                  : 'Drop commercial kitchen, prep station, or food storage photo'
              }
              sublabel="Evaluates cleanliness, cross-contamination risks, staff PPE & storage"
            />
            <button
              type="button"
              className="action-primary-btn"
              onClick={handleAnalyze}
              disabled={!selectedFile || loading}
            >
              {loading ? (
                <span className="btn-loading">
                  <span className="spinner"></span> Performing Automated Health Audit...
                </span>
              ) : (
                '🏥 Run Hygiene Inspection Audit'
              )}
            </button>
            {error && <div className="error-alert">⚠️ {error}</div>}
          </div>

          <div className="card-box info-box">
            <h4 className="box-title">Inspection Criteria Standards</h4>
            <ul className="criteria-list">
              <li>🛡️ <strong>Surface Cleanliness:</strong> Grease buildup, sanitizer residue, crumbs</li>
              <li>❄️ <strong>Storage Protocols:</strong> Raw meat separation, temperature control</li>
              <li>🧤 <strong>Staff Hygiene:</strong> Hair nets, clean apron, gloves compliance</li>
              <li>🪰 <strong>Pest & Contamination:</strong> Exposed open ingredients, debris</li>
            </ul>
          </div>
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

          {!loading && !result && (
            <div className="empty-state">
              <div className="empty-icon">🏥</div>
              <h3>Awaiting Kitchen Audit Photo</h3>
              <p>Upload a view of prep counters, sinks, storage shelves, or cooking ranges to generate a health inspection scorecard.</p>
              <div className="grades-preview">
                <span className="grade-pill grade-a">Grade A: 90–100</span>
                <span className="grade-pill grade-b">Grade B: 80–89</span>
                <span className="grade-pill grade-c">Grade C: 70–79</span>
                <span className="grade-pill grade-f">Grade F: &lt; 70</span>
              </div>
            </div>
          )}

          {!loading && result && (
            <div className="results-wrapper">
              <ResultCard
                title="Hygiene Compliance Scorecard"
                icon="📋"
                badge={`Grade ${result.grade}`}
                badgeType={getGradeBadge(result.grade)}
              >
                {/* Score and Grade Banner */}
                <div className="grade-banner">
                  <div
                    className="grade-stamp"
                    style={{
                      borderColor: getGradeColor(result.grade),
                      color: getGradeColor(result.grade),
                    }}
                  >
                    <span className="grade-letter">{result.grade}</span>
                    <span className="grade-tag">Rating</span>
                  </div>
                  <div className="grade-summary">
                    <span className="score-label">Overall Hygiene Score</span>
                    <span
                      className="score-number"
                      style={{ color: getGradeColor(result.grade) }}
                    >
                      {result.overall_score} / 100
                    </span>
                    <span className="audit-timestamp">
                      Audited: {new Date().toLocaleDateString()} • Multimodal Vision Certified
                    </span>
                  </div>
                </div>

                {/* Critical Violations Alert */}
                {result.critical_violations && result.critical_violations.length > 0 && (
                  <div className="critical-violations-box">
                    <h4 className="critical-title">⚠️ Critical Safety Violations</h4>
                    <ul className="critical-list">
                      {result.critical_violations.map((violation, idx) => (
                        <li key={idx} className="critical-item">
                          <span>🚨</span>
                          <span>{violation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Categories Breakdown */}
                {result.categories && result.categories.length > 0 && (
                  <div className="hygiene-categories">
                    <h4 className="section-title">Category Audit Breakdown</h4>
                    <div className="categories-stack">
                      {result.categories.map((cat, idx) => (
                        <div key={idx} className="category-row">
                          <div className="cat-header">
                            <span className="cat-name">{cat.name}</span>
                            <span className="cat-score">{cat.score} / 100</span>
                          </div>
                          <div className="cat-track">
                            <div
                              className="cat-fill"
                              style={{
                                width: `${cat.score}%`,
                                backgroundColor: getGradeColor(
                                  cat.score >= 90 ? 'A' : cat.score >= 80 ? 'B' : cat.score >= 70 ? 'C' : 'F'
                                ),
                              }}
                            ></div>
                          </div>
                          {cat.issues && cat.issues.length > 0 && (
                            <ul className="cat-issues">
                              {cat.issues.map((issue, issueIdx) => (
                                <li key={issueIdx}>• {issue}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {result.recommendations && result.recommendations.length > 0 && (
                  <div className="recommendations-box">
                    <h4 className="section-title">Actionable Corrective Steps</h4>
                    <ol className="recommendation-list">
                      {result.recommendations.map((rec, idx) => (
                        <li key={idx} className="rec-item">
                          <span className="rec-number">{idx + 1}</span>
                          <span className="rec-text">{rec}</span>
                        </li>
                      ))}
                    </ol>
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

export default HygieneMonitor;
