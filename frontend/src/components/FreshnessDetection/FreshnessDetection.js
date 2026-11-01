import React, { useState } from 'react';
import ImageUploader from '../ImageUploader/ImageUploader';
import ResultCard from '../ResultCard/ResultCard';
import { analyzeFreshness, analyzeFreshnessBatch } from '../../services/api';
import './FreshnessDetection.css';

const FreshnessDetection = () => {
  const [mode, setMode] = useState('single'); // 'single' or 'batch'
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [batchResults, setBatchResults] = useState([]);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');

  const handleSingleImageSelected = (file) => {
    setSelectedFile(file);
    if (!file) {
      setResult(null);
      setError('');
    }
  };

  const handleBatchImagesSelected = (files) => {
    setSelectedFiles(files);
    if (!files || !files.length) {
      setBatchResults([]);
      setError('');
    }
  };

  const handleAnalyze = async () => {
    setError('');

    if (mode === 'single') {
      if (!selectedFile) return;
      setLoading(true);

      try {
        const data = await analyzeFreshness(selectedFile);
        setResult(data);
        setHistory((prev) => [
          {
            food_name: data.food_name,
            score: data.freshness_score,
            status: data.freshness_status,
            date: new Date().toLocaleTimeString(),
          },
          ...prev.slice(0, 4),
        ]);
      } catch (err) {
        setError(err.userMessage || 'Freshness evaluation failed. Please try another image.');
      } finally {
        setLoading(false);
      }
    } else {
      if (!selectedFiles.length) return;
      setLoading(true);

      try {
        const data = await analyzeFreshnessBatch(selectedFiles);
        setBatchResults(Array.isArray(data) ? data : [data]);
      } catch (err) {
        setError(err.userMessage || 'Batch freshness analysis failed.');
      } finally {
        setLoading(false);
      }
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#2D6A4F'; // Fresh
    if (score >= 50) return '#F77F00'; // Slightly Aged
    return '#D62828'; // Spoiled
  };

  const getScoreBadgeType = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('fresh')) return 'success';
    if (s.includes('slight') || s.includes('aged')) return 'warning';
    return 'danger';
  };

  return (
    <div className="feature-container fade-in-up">
      <div className="feature-header">
        <div className="feature-tag">Food Safety & Shelf-Life AI</div>
        <h1 className="feature-title">AI Freshness & Spoilage Detection</h1>
        <p className="feature-subtitle">
          Computer vision algorithms inspect discoloration, wilting, oxidation, and mold
          to provide objective freshness scores and science-backed storage guidance.
        </p>
      </div>

      <div className="mode-toggle-bar">
        <button
          type="button"
          className={`mode-btn ${mode === 'single' ? 'active' : ''}`}
          onClick={() => {
            setMode('single');
            setError('');
          }}
        >
          📷 Single Item Scan
        </button>
        <button
          type="button"
          className={`mode-btn ${mode === 'batch' ? 'active' : ''}`}
          onClick={() => {
            setMode('batch');
            setError('');
          }}
        >
          📦 Multi-Item Batch (Fridge / Pantry)
        </button>
      </div>

      <div className="feature-layout">
        <div className="input-column">
          <div className="card-box">
            <h3 className="box-title">
              {mode === 'single' ? 'Upload Item Photo' : 'Upload Batch Images'}
            </h3>
            <ImageUploader
              onImageSelected={mode === 'single' ? handleSingleImageSelected : handleBatchImagesSelected}
              multiple={mode === 'batch'}
              label={
                mode === 'single'
                  ? 'Drop fruit, vegetable, dairy, or meat photo'
                  : 'Select multiple items for batch safety audit'
              }
              sublabel="High clarity & good lighting reveal surface textures best"
            />
            <button
              type="button"
              className="action-primary-btn"
              onClick={handleAnalyze}
              disabled={loading || (mode === 'single' ? !selectedFile : !selectedFiles.length)}
            >
              {loading ? (
                <span className="btn-loading">
                  <span className="spinner"></span> Analyzing Freshness Metrics...
                </span>
              ) : (
                `🧪 Run ${mode === 'single' ? 'Freshness' : 'Batch'} Inspection`
              )}
            </button>
            {error && <div className="error-alert">⚠️ {error}</div>}
          </div>

          {history.length > 0 && (
            <div className="card-box history-box">
              <h4 className="box-title">Recent Inspection Log</h4>
              <ul className="history-list">
                {history.map((h, i) => (
                  <li key={i} className="history-item">
                    <span className="history-name">{h.food_name}</span>
                    <span
                      className="history-score"
                      style={{ color: getScoreColor(h.score) }}
                    >
                      {h.score}/100 ({h.status})
                    </span>
                    <span className="history-time">{h.date}</span>
                  </li>
                ))}
              </ul>
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

          {!loading && !result && batchResults.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🧪</div>
              <h3>Awaiting Produce or Food Item</h3>
              <p>Upload photos of fruits, vegetables, dairy, or cooked dishes to inspect freshness indicators.</p>
              <div className="freshness-scale-legend">
                <span className="legend-chip green">80–100: Fresh</span>
                <span className="legend-chip yellow">50–79: Aging / Consume Soon</span>
                <span className="legend-chip red">0–49: Spoiled / Do Not Eat</span>
              </div>
            </div>
          )}

          {/* Single Item Result */}
          {!loading && mode === 'single' && result && (
            <div className="results-wrapper">
              <ResultCard
                title={result.food_name}
                icon="🔬"
                badge={result.freshness_status}
                badgeType={getScoreBadgeType(result.freshness_status)}
              >
                {/* Score Gauge Circle */}
                <div className="gauge-container">
                  <div
                    className="gauge-circle"
                    style={{
                      background: `conic-gradient(${getScoreColor(
                        result.freshness_score
                      )} ${result.freshness_score * 3.6}deg, #E5E7EB 0deg)`,
                    }}
                  >
                    <div className="gauge-inner">
                      <span
                        className="gauge-number"
                        style={{ color: getScoreColor(result.freshness_score) }}
                      >
                        {result.freshness_score}
                      </span>
                      <span className="gauge-label">Freshness Score</span>
                    </div>
                  </div>
                  <div className="gauge-meta">
                    <div className="meta-card">
                      <span className="meta-sub">Estimated Shelf Life</span>
                      <span className="meta-val">
                        ⏳ {result.days_remaining} {result.days_remaining === 1 ? 'day' : 'days'}
                      </span>
                    </div>
                    <div className="meta-card">
                      <span className="meta-sub">Safety Status</span>
                      <span
                        className="meta-val"
                        style={{ color: getScoreColor(result.freshness_score) }}
                      >
                        ● {result.freshness_status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Visual Indicators Observed */}
                {result.indicators && result.indicators.length > 0 && (
                  <div className="indicators-section">
                    <h4 className="section-subtitle">Visual Indicators Observed</h4>
                    <div className="indicators-grid">
                      {result.indicators.map((ind, i) => (
                        <div key={i} className="indicator-chip">
                          <span className="ind-bullet">👁️</span>
                          <span>{ind}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Storage & Shelf-Life Tips */}
                {result.storage_tips && result.storage_tips.length > 0 && (
                  <div className="storage-section">
                    <h4 className="section-subtitle">Storage Recommendations</h4>
                    <ul className="storage-list">
                      {result.storage_tips.map((tip, i) => (
                        <li key={i} className="storage-item">
                          <span className="storage-icon">💡</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </ResultCard>
            </div>
          )}

          {/* Batch Results */}
          {!loading && mode === 'batch' && batchResults.length > 0 && (
            <div className="batch-results-list">
              <h3 className="batch-title">
                Batch Safety Audit: {batchResults.length} Items Inspected
              </h3>
              {batchResults.map((item, idx) => (
                <ResultCard
                  key={idx}
                  title={item.food_name}
                  icon="📦"
                  badge={`${item.freshness_score}/100 — ${item.freshness_status}`}
                  badgeType={getScoreBadgeType(item.freshness_status)}
                >
                  <div className="batch-item-body">
                    <div className="batch-shelf">
                      <strong>Remaining Shelf Life:</strong> {item.days_remaining} days
                    </div>
                    {item.indicators && (
                      <p className="batch-indicators">
                        <strong>Indicators:</strong> {item.indicators.join(' • ')}
                      </p>
                    )}
                  </div>
                </ResultCard>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FreshnessDetection;
