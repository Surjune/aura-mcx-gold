import React from 'react';
import { TerminalPanel } from './TerminalPanel';
import { useTerminal } from '../store/terminalStore';

export const CarryTrapDecomposer: React.FC = () => {
  const { summary } = useTerminal();
  const carry = summary?.carry_pa;
  const roll = summary?.roll_split;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Term-Structure & Roll-Down Explainer */}
      <TerminalPanel
        title="Term Structure & Roll-Down Mechanics"
        badge="~24-Day Expiry Gap"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="terminal-callout cyan" style={{ margin: 0 }}>
            <div style={{ fontWeight: 600, color: 'var(--accent-primary)', fontSize: '13px' }}>
              The MCX Contract Expiry Trap
            </div>
            <div style={{ fontSize: '12px', marginTop: '4px', color: 'var(--text-secondary)' }}>
              A trader observing GOLDM quotes vs GOLDTEN sees an apparent discount of <strong>&minus;25 bps</strong>.
              However, this apparent arbitrage is an illusion caused by two structural factors:
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
            }}
          >
            <div
              style={{
                padding: '16px',
                backgroundColor: 'var(--bg-surface-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                STEP 1: PURITY CONVERSION
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                995 &rarr; 999 Fineness
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                GOLDM delivers 995 fineness, whereas GOLDTEN delivers 999. Purity normalisation lifts the spread by <strong>+40 bps</strong>.
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
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                STEP 2: CARRY & ROLL-DOWN
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent-primary)', marginTop: '2px' }}>
                3rd–5th vs 27th–31st
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                GOLDM expires ~24 days earlier than GOLDTEN in the same delivery month. Cost of carry along the curve consumes the difference.
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--accent-tint)',
              border: '1px solid rgba(37, 99, 235, 0.2)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                Net Corrected Position
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '2px' }}>
                From <strong>&minus;25 bps</strong> (naive illusion) to:
              </div>
            </div>
            <div className="font-mono" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-primary)' }}>
              +7.1 bps (Fair Parity)
            </div>
          </div>
        </div>
      </TerminalPanel>

      {/* Quantitative Carry Statistics */}
      <TerminalPanel
        title="Annualised Carry & Roll-Down Metrics"
        badge="Empirical Stats"
      >
        <div style={{ overflowX: 'auto' }}>
          <table className="terminal-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th className="num">Value</th>
                <th>Explanation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>Carry Rate (Median)</td>
                <td className="num font-mono" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                  {carry ? `${carry.median.toFixed(2)}% p.a.` : '9.77% p.a.'}
                </td>
                <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Contango carry rate across GOLDTEN front vs next contract curve
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Share Positive Carry</td>
                <td className="num font-mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  {carry ? `${(carry.share_positive * 100).toFixed(1)}%` : '100.0%'}
                </td>
                <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Gold futures curve maintained contango across all 398 sessions
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Mean Daily Roll</td>
                <td className="num font-mono">
                  {roll ? `${roll.mean_roll_bps.toFixed(2)} bps` : '-4.50 bps'}
                </td>
                <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Daily roll component across the curve
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Roll vs Curve Variance</td>
                <td className="num font-mono">
                  {roll ? `${(roll.share_abs_move_from_roll * 100).toFixed(1)}%` : '3.9%'}
                </td>
                <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  96.1% of spread variance is macro spot shift; only 3.9% is roll-down
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </TerminalPanel>
    </div>
  );
};
