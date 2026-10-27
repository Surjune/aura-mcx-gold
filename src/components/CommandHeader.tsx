import React from 'react';
import { useTerminal } from '../store/terminalStore';
import { WorkspaceNav } from './WorkspaceNav';

export const CommandHeader: React.FC = () => {
  const { telemetry } = useTerminal();

  return (
    <header className="command-bar">
      {/* Tier 1: 44px Telemetry Strip */}
      <div className="command-bar-tier1">
        <div className="brand-section">
          <div className="brand-title">
            <span className="brand-accent">AuRA</span>
            <span style={{ color: 'var(--border-subtle)' }}>/</span>
            <span>MCX Bullion RV Terminal</span>
          </div>
          <span className="track-badge">TRACK 03</span>
        </div>

        {/* Center Dynamic Monospace Ticker Ribbon */}
        <div className="ticker-ribbon">
          <div className="ticker-item">
            <span className="ticker-label">ANCHOR GOLDTEN:</span>
            <span className="ticker-val font-mono">₹{telemetry.anchorFineGrams.toFixed(2)}/g</span>
          </div>
          <span style={{ color: 'var(--border-subtle)' }}>•</span>

          <div className="ticker-item">
            <span className="ticker-label">GOLDM (CARRY ADJ):</span>
            <span className="ticker-val font-mono">
              {telemetry.goldmCarryAdjBps >= 0 ? '+' : ''}{telemetry.goldmCarryAdjBps.toFixed(1)} bps
            </span>
          </div>
          <span style={{ color: 'var(--border-subtle)' }}>•</span>

          <div className="ticker-item">
            <span className="ticker-label">GOLDPETAL PREM:</span>
            <span className="ticker-val font-mono">
              +{telemetry.petalPremBps.toFixed(1)} bps
            </span>
          </div>
          <span style={{ color: 'var(--border-subtle)' }}>•</span>

          <div className="ticker-item">
            <span className="ticker-label">GOLDGUINEA PREM:</span>
            <span className="ticker-val font-mono">
              +{telemetry.guineaPremBps.toFixed(1)} bps
            </span>
          </div>
          <span style={{ color: 'var(--border-subtle)' }}>•</span>

          <div className="ticker-item">
            <span className="ticker-label">RT COST HURDLE:</span>
            <span className="ticker-val font-mono" style={{ color: 'var(--accent-primary)' }}>
              {telemetry.rtHurdleBps.toFixed(1)} bps
            </span>
          </div>
        </div>

        {/* Right Telemetry & Status Gate */}
        <div className="telemetry-section">
          <div className="telemetry-pill">
            <span className="status-dot" />
            <span>15s Live Poller</span>
          </div>
          <div className="telemetry-pill">
            <span>716 Sessions</span>
          </div>
          <div className={`gate-badge ${telemetry.signalGateStatus.toLowerCase()}`}>
            {telemetry.signalGateStatus === 'QUIET' ? 'Gate: Quiet' : 'Gate: Active Alert'}
          </div>
        </div>
      </div>

      {/* Tier 2: 48px Workspace Navigation Bar */}
      <WorkspaceNav />
    </header>
  );
};
