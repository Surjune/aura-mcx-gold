import React, { useState } from 'react';

interface SafeguardCardProps {
  id: number;
  title: string;
  summary: string;
  detailedText: string;
  codeSnippet?: string;
  riskMitigated: string;
}

export const MethodologyCard: React.FC<SafeguardCardProps> = ({
  id,
  title,
  summary,
  detailedText,
  codeSnippet,
  riskMitigated,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`safeguard-card ${isOpen ? 'is-open' : ''}`}>
      <button
        type="button"
        className="safeguard-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className="safeguard-title-wrap">
          <span className="safeguard-num">{id}</span>
          <div className="safeguard-text-block">
            <div className="safeguard-name">{title}</div>
            <div className="safeguard-summary">
              {summary}
            </div>
          </div>
        </div>
        <div className="safeguard-action-link">
          <span>{isOpen ? 'Less info' : 'Learn why'}</span>
          <svg
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 150ms ease',
            }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="safeguard-body">
          <p className="safeguard-detail">{detailedText}</p>
          <div className="safeguard-meta-row">
            {codeSnippet && (
              <code className="audit-code">
                {codeSnippet}
              </code>
            )}
            <span className="safeguard-prevents-tag">
              &bull; Prevents: {riskMitigated}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
