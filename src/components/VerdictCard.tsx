import React from 'react';

interface VerdictCardProps {
  className?: string;
}

export const VerdictCard: React.FC<VerdictCardProps> = ({ className = '' }) => {
  return (
    <div className={`verdict-card ${className}`}>
      <div className="verdict-label">Current Research Verdict</div>
      <div className="verdict-statement">No persistent edge after costs</div>
      <p className="verdict-explanation">
        Historical price gaps did not consistently exceed the full cost of executing a real
        whole-lot trade in the untouched holdout period. Apparent arbitrage disappears once fees,
        bid-ask spreads, and normal contract carry are accounted for.
      </p>

      <div className="evidence-badges-wrap">
        <span className="evidence-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Real MCX Bhavcopy Data
        </span>
        <span className="evidence-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Purity &amp; Expiry Adjusted
        </span>
        <span className="evidence-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Walk-Forward Validation
        </span>
        <span className="evidence-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Cost-Aware Backtesting
        </span>
        <span className="evidence-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Monitor Only, No Auto-Trading
        </span>
      </div>
    </div>
  );
};
