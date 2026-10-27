import React from 'react';

interface MetricCardProps {
  label: string;
  value: string;
  subtext: string;
  badge?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  badge,
}) => {
  return (
    <div className="metric-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="metric-label">{label}</span>
        {badge && (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: 'var(--bg-surface-subtle)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {badge}
          </span>
        )}
      </div>
      <div className="metric-value font-mono">{value}</div>
      <p className="metric-sub">{subtext}</p>
    </div>
  );
};
