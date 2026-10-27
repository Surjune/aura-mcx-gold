import React from 'react';

interface TerminalPanelProps {
  title: string;
  badge?: React.ReactNode;
  controls?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  style?: React.CSSProperties;
  noPadding?: boolean;
}

export const TerminalPanel: React.FC<TerminalPanelProps> = ({
  title,
  badge,
  controls,
  children,
  className = '',
  contentClassName = '',
  style,
  noPadding = false,
}) => {
  return (
    <div className={`terminal-panel ${className}`} style={style}>
      <div className="terminal-panel-header">
        <div className="panel-title">
          <span>{title}</span>
          {badge && <span className="panel-badge">{badge}</span>}
        </div>
        {controls && <div className="panel-controls">{controls}</div>}
      </div>
      <div className={`panel-content ${noPadding ? 'no-pad' : ''} ${contentClassName}`}>
        {children}
      </div>
    </div>
  );
};
