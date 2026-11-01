import React, { useState } from 'react';
import './ResultCard.css';

const ResultCard = ({
  title,
  icon = '✨',
  badge = null,
  badgeType = 'default',
  collapsible = false,
  defaultExpanded = true,
  children,
  className = '',
  actionButton = null,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`result-card scale-in ${className}`}>
      <div
        className={`result-header ${collapsible ? 'cursor-pointer' : ''}`}
        onClick={() => collapsible && setIsExpanded(!isExpanded)}
      >
        <div className="header-left">
          <span className="header-icon">{icon}</span>
          <h3 className="header-title">{title}</h3>
          {badge && (
            <span className={`header-badge badge-${badgeType}`}>{badge}</span>
          )}
        </div>
        <div className="header-right">
          {actionButton && <div className="header-action">{actionButton}</div>}
          {collapsible && (
            <button
              type="button"
              className="toggle-expand-btn"
              aria-label={isExpanded ? 'Collapse section' : 'Expand section'}
            >
              {isExpanded ? '▲' : '▼'}
            </button>
          )}
        </div>
      </div>

      {(!collapsible || isExpanded) && (
        <div className="result-body">{children}</div>
      )}
    </div>
  );
};

export default ResultCard;
