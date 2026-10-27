import React from 'react';
import { TerminalPanel } from './TerminalPanel';
import { useTerminal } from '../store/terminalStore';

export const WalkForwardLab: React.FC = () => {
  const { backtest, inspectCrashOutlier, setInspectCrashOutlier } = useTerminal();
  const petal = backtest?.summary?.['GOLDPETAL'];
  const dev = petal?.development;
  const holdout = petal?.holdout;

  const outlierTrade = {
    entry: '2026-01-21',
    exit: '2026-01-30',
    held: 6,
    gross: 36110.0,
    costs: 2139.59,
    net: 33970.41,
    shareOfProfit: 75.9,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top 6-cell comparison matrix */}
      <TerminalPanel
        title="Walk-Forward Robustness Matrix (GOLDPETAL vs GOLDTEN)"
        badge="Development vs Untouched Holdout"
      >
        <div className="stats-grid-6">
          {/* Cell 1: Total Trades */}
          <div className="stats-cell">
            <span className="stats-cell-label">Total Trades</span>
            <div className="stats-cell-val">
              <span>{dev?.trades ?? 15}</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 400 }}>vs</span>
              <span style={{ color: 'var(--accent-primary)' }}>{holdout?.trades ?? 6}</span>
            </div>
            <span className="stats-cell-sub">Dev (12M) vs Holdout (6M)</span>
          </div>

          {/* Cell 2: Net bps/trade */}
          <div className="stats-cell">
            <span className="stats-cell-label">Net bps / Trade</span>
            <div className="stats-cell-val">
              <span>
                +{dev?.net_bps_per_trade?.toFixed(1) ?? '21.1'}
              </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 400 }}>vs</span>
              <span style={{ color: 'var(--text-primary)' }}>
                {holdout?.net_bps_per_trade ? holdout.net_bps_per_trade.toFixed(1) : '-2.7'}
              </span>
            </div>
            <span className="stats-cell-sub">After 13.0 bps cost friction</span>
          </div>

          {/* Cell 3: Net bps ex best */}
          <div className="stats-cell">
            <span className="stats-cell-label">Net Excl. Best Trade</span>
            <div className="stats-cell-val">
              <span>
                +{dev?.net_bps_ex_best?.toFixed(1) ?? '7.5'}
              </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 400 }}>vs</span>
              <span>
                {holdout?.net_bps_ex_best ? holdout.net_bps_ex_best.toFixed(1) : '-5.7'}
              </span>
            </div>
            <span className="stats-cell-sub">Fragility test ex 30-Jan</span>
          </div>

          {/* Cell 4: Annualised Sharpe */}
          <div className="stats-cell">
            <span className="stats-cell-label">Annualised Sharpe</span>
            <div className="stats-cell-val">
              <span>
                {dev?.sharpe?.toFixed(2) ?? '0.89'}
              </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 400 }}>vs</span>
              <span style={{ color: 'var(--accent-primary)' }}>
                {holdout?.sharpe?.toFixed(2) ?? '-0.05'}
              </span>
            </div>
            <span className="stats-cell-sub">Negative in OOS holdout</span>
          </div>

          {/* Cell 5: Bootstrap p-value */}
          <div className="stats-cell">
            <span className="stats-cell-label">Bootstrap p-value</span>
            <div className="stats-cell-val">
              <span>
                {dev?.bootstrap_p?.toFixed(2) ?? '0.12'}
              </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 400 }}>vs</span>
              <span>
                {holdout?.bootstrap_p?.toFixed(2) ?? '0.52'}
              </span>
            </div>
            <span className="stats-cell-sub">P &gt; 0.05 fails significance</span>
          </div>

          {/* Cell 6: Deflated Sharpe Prob */}
          <div className="stats-cell">
            <span className="stats-cell-label">Deflated Sharpe Prob</span>
            <div className="stats-cell-val">
              <span>
                {dev?.deflated_sharpe_prob ? dev.deflated_sharpe_prob.toFixed(2) : '0.73'}
              </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 400 }}>vs</span>
              <span>
                {holdout?.deflated_sharpe_prob ? holdout.deflated_sharpe_prob.toFixed(2) : '0.49'}
              </span>
            </div>
            <span className="stats-cell-sub">Bailey &amp; López de Prado</span>
          </div>
        </div>
      </TerminalPanel>

      {/* Outlier Inspector Callout & Interactive Toggle */}
      <TerminalPanel
        title="30 Jan 2026 Crash Outlier Auditor"
        badge="Stress-Day Anomaly"
        controls={
          <button
            className={inspectCrashOutlier ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setInspectCrashOutlier((prev: boolean) => !prev)}
          >
            {inspectCrashOutlier ? 'Collapse Audit' : 'Inspect 30 Jan 2026 Crash Outlier'}
          </button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="terminal-callout cyan" style={{ margin: 0 }}>
            <div style={{ fontWeight: 600, color: 'var(--accent-primary)', fontSize: '13px' }}>
              {inspectCrashOutlier ? 'Single-Trade Concentration Uncovered' : 'Fragility Check: 75.9% of Profit from 1 Print'}
            </div>
            <div style={{ fontSize: '12px', marginTop: '4px', color: 'var(--text-secondary)' }}>
              During development, the strategy captured <strong>₹44,773</strong> net P&amp;L.
              A single trade exiting on <strong>30 Jan 2026</strong> accounted for <strong>₹33,970</strong> (75.9% of total profits).
              This was an un-executable stress-day bhavcopy close during the historic gold crash.
            </div>
          </div>

          {inspectCrashOutlier && (
            <div
              style={{
                backgroundColor: 'var(--bg-surface-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '16px',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '16px',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>ENTRY SESSION</div>
                <div className="font-mono" style={{ color: 'var(--text-primary)', fontWeight: 600, marginTop: '2px' }}>
                  {outlierTrade.entry}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>EXIT SESSION</div>
                <div className="font-mono" style={{ color: 'var(--accent-primary)', fontWeight: 600, marginTop: '2px' }}>
                  {outlierTrade.exit} (Crash)
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>NET P&amp;L (₹)</div>
                <div className="font-mono" style={{ color: 'var(--text-primary)', fontWeight: 700, marginTop: '2px' }}>
                  +₹{outlierTrade.net.toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>DEV PROFIT SHARE</div>
                <div className="font-mono" style={{ color: 'var(--accent-primary)', fontWeight: 700, marginTop: '2px' }}>
                  {outlierTrade.shareOfProfit}%
                </div>
              </div>
            </div>
          )}
        </div>
      </TerminalPanel>
    </div>
  );
};
