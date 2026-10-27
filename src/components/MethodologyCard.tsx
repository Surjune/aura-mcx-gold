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
    <div className="safeguard-card">
      <button
        className="safeguard-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className="safeguard-title-wrap">
          <span className="safeguard-num">{id}</span>
          <div>
            <div className="safeguard-name">{title}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {summary}
            </div>
          </div>
        </div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--action-blue)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>{isOpen ? 'Less info' : 'Learn why'}</span>
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 150ms ease' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="safeguard-body">
          <p style={{ marginBottom: '10px' }}>{detailedText}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '8px' }}>
            {codeSnippet && (
              <code className="audit-code">
                {codeSnippet}
              </code>
            )}
            <span style={{ fontSize: '12px', color: 'var(--semantic-emerald)', fontWeight: 600 }}>
              &bull; Prevents: {riskMitigated}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
