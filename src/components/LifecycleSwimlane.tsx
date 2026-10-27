import React, { useState } from 'react';
import { TerminalPanel } from './TerminalPanel';
import { useTerminal } from '../store/terminalStore';

export const LifecycleSwimlane: React.FC = () => {
  const { contracts } = useTerminal();
  const [selectedSymbol, setSelectedSymbol] = useState<string>('GOLDTEN');

  const filteredContracts = (contracts ?? [])
    .filter((c) => c.symbol === selectedSymbol)
    .slice(-12);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Lifecycle Rules & Protocol */}
      <TerminalPanel
        title="Contract Lifecycle Gates & Liquidity Discipline"
        badge="Discrete Expiries"
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
            }}
          >
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>PHASE 1</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
              Listing &amp; Incubation
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Newly listed far-month contracts. Thin order books and wide bid-ask spreads; zero trading permitted.
            </div>
          </div>

          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--accent-tint)',
              border: '1px solid rgba(37, 99, 235, 0.2)',
              borderRadius: '6px',
            }}
          >
            <div style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 500 }}>PHASE 2 (ELIGIBLE)</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent-primary)', marginTop: '2px' }}>
              Liquidity Ramp (&ge; 50% OI)
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Contract becomes eligible only when it commands &ge; 50% of its symbol&apos;s aggregate Open Interest.
            </div>
          </div>

          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
            }}
          >
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>PHASE 3 (STEP ASIDE)</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
              Tender Window (Final 5 Days)
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Mandatory strategy step-aside 5 sessions prior to expiry to eliminate physical delivery squeeze risk.
            </div>
          </div>
        </div>
      </TerminalPanel>

      {/* Discrete Expiry Table */}
      <TerminalPanel
        title="Discrete Contract Phases"
        badge={`${selectedSymbol} Expiries`}
        controls={
          <div style={{ display: 'flex', gap: '6px' }}>
            {['GOLDTEN', 'GOLDM', 'GOLDGUINEA', 'GOLDPETAL'].map((sym) => (
              <button
                key={sym}
                className={`btn-terminal ${selectedSymbol === sym ? 'active' : ''}`}
                onClick={() => setSelectedSymbol(sym)}
              >
                {sym}
              </button>
            ))}
          </div>
        }
      >
        <div style={{ overflowX: 'auto' }}>
          <table className="terminal-table">
            <thead>
              <tr>
                <th>Expiry Date</th>
                <th>First Traded</th>
                <th>Became Liquid</th>
                <th className="num">Days to Liquid</th>
                <th>Tender Window</th>
                <th className="num">Peak OI (Lots)</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.map((c, idx) => (
                <tr key={idx}>
                  <td className="font-mono" style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
                    {c.expiry}
                  </td>
                  <td className="font-mono" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {c.first_traded}
                  </td>
                  <td className="font-mono" style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                    {c.became_liquid}
                  </td>
                  <td className="num font-mono">
                    {c.sessions_to_liquid}d
                  </td>
                  <td className="font-mono" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {c.delivery_window_from}
                  </td>
                  <td className="num font-mono">
                    {c.peak_oi_lots.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TerminalPanel>
    </div>
  );
};
