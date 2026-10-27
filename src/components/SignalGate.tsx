import React from 'react';
import { TerminalPanel } from './TerminalPanel';
import { useTerminal } from '../store/terminalStore';

export const SignalGate: React.FC = () => {
  const { signals, summary } = useTerminal();
  const hurdleBps = summary?.hurdle_bps ?? 13.0762;

  return (
    <TerminalPanel
      title="Quiet-by-Default Signal Gate"
      badge={`Cost Hurdle: ${hurdleBps.toFixed(1)} bps`}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="terminal-callout cyan" style={{ margin: 0 }}>
          <div style={{ fontWeight: 600, color: 'var(--accent-primary)', fontSize: '13px' }}>
            Dual-Filter Execution Gate
          </div>
          <div style={{ fontSize: '12px', marginTop: '4px', color: 'var(--text-secondary)' }}>
            AuRA remains <strong style={{ color: 'var(--text-primary)' }}>Quiet</strong> by default.
            An execution signal fires only when both conditions clear:
            <ol style={{ paddingLeft: '18px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <li>Statistical anomaly: |z-score| &gt; threshold (1.5 - 2.5)</li>
              <li>Economic edge: Expected spread &gt; {hurdleBps.toFixed(1)} bps round-trip friction</li>
            </ol>
          </div>
        </div>

        {/* Signals Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="terminal-table">
            <thead>
              <tr>
                <th>Pair</th>
                <th className="num">Prem</th>
                <th className="num">|z|</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {signals && signals.length > 0 ? (
                signals.map((sig, idx) => {
                  const isQuiet = sig.action.toLowerCase() === 'normal' || sig.action.toLowerCase() === 'watch';
                  return (
                    <tr key={idx}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {sig.pair.replace(' vs GOLDTEN', '')}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {sig.expiry} (DTE {sig.dte})
                        </div>
                      </td>
                      <td className="num font-mono">
                        +{sig.premium_bps.toFixed(1)}
                      </td>
                      <td className="num font-mono" style={{ color: 'var(--text-primary)' }}>
                        {Math.abs(sig.z).toFixed(2)}
                      </td>
                      <td>
                        <span
                          className={`gate-badge ${isQuiet ? 'quiet' : 'alert'}`}
                          style={{ fontSize: '11px' }}
                        >
                          {sig.action.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Loading signals...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {signals && signals.map((sig, idx) => (
          <div
            key={`why-${idx}`}
            style={{
              padding: '12px',
              backgroundColor: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              fontSize: '12px',
            }}
          >
            <div style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
              {sig.pair} Rationale:
            </div>
            <div style={{ color: 'var(--text-primary)', marginTop: '4px' }}>
              &ldquo;{sig.why}&rdquo; &bull; <em style={{ color: 'var(--text-secondary)' }}>{sig.validated}</em>
            </div>
          </div>
        ))}
      </div>
    </TerminalPanel>
  );
};
