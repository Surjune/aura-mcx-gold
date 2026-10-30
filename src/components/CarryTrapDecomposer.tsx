import React from 'react';
import { TerminalPanel } from './TerminalPanel';
import { useTerminal } from '../store/terminalStore';
import { bps, count, num, pct } from '../utils/format';

// 999 vs 995 fineness: GOLDM's quote buys 0.5% less fine gold, a fixed (0.999 / 0.995 - 1) = 40.2 bps.
const PURITY_LIFT_BPS = (0.999 / 0.995 - 1) * 1e4;

export const CarryTrapDecomposer: React.FC = () => {
  const { summary } = useTerminal();
  const carry = summary?.carry_pa;
  const roll = summary?.roll_split;
  const naive = summary?.premiums?.GOLDM_naive?.median;
  const carryAdj = summary?.premiums?.GOLDM_carry?.median;
  const rollShare = roll?.share_abs_move_from_roll;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <TerminalPanel title="Term Structure & Roll-Down Mechanics" badge="~24-Day Expiry Gap">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="terminal-callout" style={{ margin: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '13px' }}>The MCX Contract Expiry Trap</div>
            <div style={{ fontSize: '12px', marginTop: '4px', color: 'var(--text-secondary)' }}>
              A trader comparing GOLDM quotes with GOLDTEN sees a median apparent discount of <strong>{bps(naive)}</strong>.
              That apparent arbitrage comes from two structural factors:
            </div>
          </div>

          <div className="split-grid-even" style={{ gap: '12px' }}>
            <div style={{ padding: '16px', backgroundColor: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>STEP 1: PURITY CONVERSION</div>
              <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>995 &rarr; 999 Fineness</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                GOLDM delivers 995 fineness, whereas GOLDTEN delivers 999. Purity normalisation lifts the spread by{' '}
                <strong>{bps(PURITY_LIFT_BPS)}</strong>.
              </div>
            </div>

            <div style={{ padding: '16px', backgroundColor: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>STEP 2: CARRY &amp; ROLL-DOWN</div>
              <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>3rd–5th vs 27th–31st</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                GOLDM expires ~24 days earlier than GOLDTEN in the same delivery month. Cost of carry along the curve consumes the difference.
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--surface-bone)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>Net Corrected Position (median)</div>
              <div style={{ fontSize: '13px', marginTop: '2px' }}>
                From <strong>{bps(naive)}</strong> (naive illusion) to:
              </div>
            </div>
            <div className="font-mono" style={{ fontSize: '20px', fontWeight: 700 }}>
              {bps(carryAdj)}
            </div>
          </div>
        </div>
      </TerminalPanel>

      <TerminalPanel title="Annualised Carry & Roll-Down Metrics" badge="Empirical Stats">
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
                <td className="num font-mono" style={{ fontWeight: 600 }}>{carry ? `${num(carry.median, 2)}% p.a.` : '\u2014'}</td>
                <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Contango carry rate across GOLDTEN front vs next contract curve
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Share Positive Carry</td>
                <td className="num font-mono" style={{ fontWeight: 600 }}>{pct(carry?.share_positive)}</td>
                <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Sessions where the GOLDTEN curve was in contango, out of {count(carry?.n, 'sessions')}
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Mean Daily Roll</td>
                <td className="num font-mono">{roll ? `${num(roll.mean_roll_bps, 2)} bps` : '\u2014'}</td>
                <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Daily roll component across the curve</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Roll Share of Daily Move</td>
                <td className="num font-mono">{pct(rollShare)}</td>
                <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {pct(rollShare === undefined ? undefined : 1 - rollShare)} of the absolute daily move is a genuine curve shift; only {pct(rollShare)} is roll-down
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </TerminalPanel>
    </div>
  );
};
