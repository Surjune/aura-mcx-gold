import React, { useState, useMemo } from 'react';
import { SectionHeading } from '../components/SectionHeading';
import { PlotlyTerminalChart } from '../components/PlotlyTerminalChart';
import { useTerminal } from '../store/terminalStore';

export const BacktestResultsSection: React.FC = () => {
  const { summary, backtest, series } = useTerminal();
  const [showTradeLog, setShowTradeLog] = useState(false);
  const [showGridSearch, setShowGridSearch] = useState(false);
  const [excludeOutlier, setExcludeOutlier] = useState(false);

  const petalSummary = backtest?.summary?.['GOLDPETAL'];
  const petalTrades = backtest?.trades?.['GOLDPETAL'] ?? [];
  const hurdle = summary?.hurdle_bps ?? 13.0762;

  const devTrades = petalSummary?.development?.trades ?? 15;
  const devNetBps = petalSummary?.development?.net_bps_per_trade ? petalSummary.development.net_bps_per_trade.toFixed(1) : '+21.1';
  const devSharpe = petalSummary?.development?.sharpe ? petalSummary.development.sharpe.toFixed(2) : '0.89';

  const holdoutTrades = petalSummary?.holdout?.trades ?? 6;
  const holdoutNetBps = petalSummary?.holdout?.net_bps_per_trade ? petalSummary.holdout.net_bps_per_trade.toFixed(1) : '-2.7';
  const holdoutSharpe = petalSummary?.holdout?.sharpe ? petalSummary.holdout.sharpe.toFixed(2) : '-0.05';
  const holdoutBootstrapP = petalSummary?.holdout?.bootstrap_p ? petalSummary.holdout.bootstrap_p.toFixed(2) : '0.52';
  const holdoutDsr = petalSummary?.holdout?.deflated_sharpe_prob ? petalSummary.holdout.deflated_sharpe_prob.toFixed(2) : '0.49';

  // Cumulative Equity Chart with interactive outlier toggle
  const equityChartData = useMemo(() => {
    if (!series || !series.equity || !series.equity.GOLDPETAL) return [];
    const baseEquity = series.equity.GOLDPETAL;
    const sessions = series.session;

    // Jan 30, 2026 trade exit index
    const outlierIndex = sessions.findIndex((s) => s.startsWith('2026-01-30'));
    const outlierGain = 33970; // Profit from the single anomalous Jan 30 trade (~75.9% of total gain)

    let yValues = baseEquity;
    if (excludeOutlier && outlierIndex !== -1) {
      yValues = baseEquity.map((val, idx) => (idx >= outlierIndex ? val - outlierGain : val));
    }

    return [
      {
        x: sessions,
        y: yValues,
        type: 'scatter',
        mode: 'lines',
        name: excludeOutlier ? 'Strategy Equity (Jan 30 Crash Outlier Removed)' : 'Strategy Net Equity (₹)',
        line: { color: excludeOutlier ? '#64748B' : '#0F172A', width: 2 },
        fill: 'tozeroy',
        fillcolor: 'rgba(15, 23, 42, 0.04)',
      },
      {
        x: ['2026-04-20', '2026-04-20'],
        y: [-15000, 50000],
        type: 'scatter',
        mode: 'lines',
        name: 'Untouched Holdout Cut (Apr 20, 2026)',
        line: { color: '#DC2626', width: 1.5, dash: 'dash' },
      },
    ];
  }, [series, excludeOutlier]);

  return (
    <section id="backtest-results" className="story-section">
      <div className="section-inner">
        <SectionHeading
          eyebrow="Walk-Forward Validation"
          title="The Honest Test: Can you actually trade it after costs?"
          description="Every real friction was charged: exchange fees, stamp duty, CTT, GST, brokerage, and bid-ask slippage. We picked strategy parameters on past development data only, then tested against an untouched 6-month holdout."
        />

        {/* Compact Visual Pipeline of Methodological Discipline */}
        <div className="problem-flow-wrap" style={{ marginBottom: '32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span className="section-eyebrow">Institutional Backtest Discipline</span>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brand-navy)', marginTop: '4px' }}>
              6 Safeguards that prevent curve-fitting and paper alpha illusions
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '640px', margin: '4px auto 0' }}>
              Methodological rules applied to prevent look-ahead bias, fee underestimation, and curve-fitted claims.
            </p>
          </div>

          <div className="discipline-grid-6">
            <div className="discipline-step-card">
              <div className="discipline-card-header">
                <span className="discipline-step-num">STEP 01</span>
                <span className="discipline-step-tag">No Look-Ahead</span>
              </div>
              <h4 className="discipline-step-title">1. Trailing Window (t&minus;1)</h4>
              <p className="discipline-step-desc">
                Z-scores calculated strictly on past closed data; zero future data contamination allowed.
              </p>
            </div>

            <div className="discipline-step-card">
              <div className="discipline-card-header">
                <span className="discipline-step-num">STEP 02</span>
                <span className="discipline-step-tag">Next-Day Fill</span>
              </div>
              <h4 className="discipline-step-title">2. Next-Day Execution (t+1)</h4>
              <p className="discipline-step-desc">
                Signals generated at close t, filled at close t+1 to reflect realistic order submission latency.
              </p>
            </div>

            <div className="discipline-step-card">
              <div className="discipline-card-header">
                <span className="discipline-step-num">STEP 03</span>
                <span className="discipline-step-tag">&beta; = 0.00</span>
              </div>
              <h4 className="discipline-step-title">3. Whole-Lot Hedges</h4>
              <p className="discipline-step-desc">
                Enforced integer lot ratios (100 PETAL vs 10 TEN); zero directional gold beta leakage.
              </p>
            </div>

            <div className="discipline-step-card highlight">
              <div className="discipline-card-header">
                <span className="discipline-step-num">STEP 04</span>
                <span className="discipline-step-tag" style={{ backgroundColor: 'var(--accent-orange-subtle)', color: 'var(--accent-orange)', borderColor: 'var(--accent-orange-border)' }}>13.1 bps</span>
              </div>
              <h4 className="discipline-step-title">4. 13.1 bps Full Costs</h4>
              <p className="discipline-step-desc">
                Every statutory rupee charged: MCX turnover + SEBI + Stamp + CTT + GST + Bid-ask slippage.
              </p>
            </div>

            <div className="discipline-step-card sealed">
              <div className="discipline-card-header">
                <span className="discipline-step-num">STEP 05</span>
                <span className="discipline-step-tag" style={{ backgroundColor: 'var(--ink)', color: 'var(--canvas)' }}>Sealed Window</span>
              </div>
              <h4 className="discipline-step-title">5. Untouched Holdout</h4>
              <p className="discipline-step-desc">
                Final 6 months sealed away completely until all parameter tuning was strictly locked.
              </p>
            </div>

            <div className="discipline-step-card audit">
              <div className="discipline-card-header">
                <span className="discipline-step-num">STEP 06</span>
                <span className="discipline-step-tag" style={{ backgroundColor: 'var(--accent-ochre-subtle)', color: '#8C660A', borderColor: 'var(--accent-ochre-border)' }}>Audit</span>
              </div>
              <h4 className="discipline-step-title">6. Outlier Decomposition</h4>
              <p className="discipline-step-desc">
                Jan 30 windfall trade (+75.9% of dev P&L) isolated to prove true edge does not survive.
              </p>
            </div>
          </div>
        </div>

        {/* Development vs Untouched Holdout Comparison Card */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          {/* Card A: Development Phase */}
          <div className="terminal-panel-card">
            <div className="panel-header">
              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  In-Sample Tuning
                </span>
                <h4 className="panel-title" style={{ marginTop: '2px' }}>Development Period (Apr 2025 – Apr 2026)</h4>
                <p className="panel-subtitle">Strategy parameters chosen from 9-point grid</p>
              </div>
              <span className="panel-badge" style={{ backgroundColor: 'var(--bg-surface-subtle)', color: 'var(--brand-navy)' }}>
                268 Sessions
              </span>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Net Return Per Trade</div>
                  <div className="font-mono" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--semantic-emerald)' }}>
                    +{devNetBps} bps
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Completed Trades</div>
                  <div className="font-mono" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--brand-navy)' }}>
                    {devTrades} trades
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Win Rate</div>
                  <div className="font-mono" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brand-navy)' }}>
                    80.0%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Annualised Sharpe</div>
                  <div className="font-mono" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brand-navy)' }}>
                    {devSharpe}
                  </div>
                </div>
              </div>
              <div style={{ padding: '12px', backgroundColor: 'var(--semantic-amber-bg)', border: '1px solid var(--semantic-amber-border)', borderRadius: '6px', fontSize: '12px', color: 'var(--brand-navy)' }}>
                <strong>The Mirage:</strong> 75.9% of this development profit came from one single trade on Jan 30, 2026. Without that trade, edge was only +7.5 bps.
              </div>
            </div>
          </div>

          {/* Card B: Untouched Holdout */}
          <div className="terminal-panel-card" style={{ border: '2px solid var(--brand-navy)' }}>
            <div className="panel-header" style={{ backgroundColor: 'var(--bg-surface-subtle)' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--semantic-crimson)', textTransform: 'uppercase' }}>
                  Out-of-Sample Verification
                </span>
                <h4 className="panel-title" style={{ marginTop: '2px' }}>Untouched Holdout (Apr 2026 – Oct 2026)</h4>
                <p className="panel-subtitle">Zero parameter changes; real execution test</p>
              </div>
              <span className="panel-badge" style={{ backgroundColor: 'var(--semantic-crimson-bg)', color: 'var(--semantic-crimson)', border: '1px solid var(--semantic-crimson-border)' }}>
                Sealed Period
              </span>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Net Return Per Trade</div>
                  <div className="font-mono" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--semantic-crimson)' }}>
                    {holdoutNetBps} bps
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Completed Trades</div>
                  <div className="font-mono" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--brand-navy)' }}>
                    {holdoutTrades} trades
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Bootstrap p-value</div>
                  <div className="font-mono" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--semantic-crimson)' }}>
                    {holdoutBootstrapP}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Deflated Sharpe Prob</div>
                  <div className="font-mono" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--semantic-crimson)' }}>
                    {holdoutDsr}
                  </div>
                </div>
              </div>
              <div style={{ padding: '12px', backgroundColor: 'var(--semantic-crimson-bg)', border: '1px solid var(--semantic-crimson-border)', borderRadius: '6px', fontSize: '12px', color: 'var(--semantic-crimson)' }}>
                <strong>Rigorous Finding:</strong> Win rate dropped to 33.3%, net return turned negative, and bootstrap p of 0.52 confirms the result is indistinguishable from random luck.
              </div>
            </div>
          </div>
        </div>

        {/* Cumulative Equity Curve Chart with Outlier Toggle */}
        <div className="terminal-panel-card" style={{ marginBottom: '32px' }}>
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h4 className="panel-title">Cumulative Backtest Equity Curve (Net of Full 13.1 bps Friction)</h4>
              <p className="panel-subtitle">Notice the vertical spike on January 30, 2026 followed by the flat/negative holdout period</p>
            </div>
            <button
              onClick={() => setExcludeOutlier(!excludeOutlier)}
              style={{
                padding: '6px 14px',
                backgroundColor: excludeOutlier ? 'var(--brand-navy)' : 'var(--bg-surface-subtle)',
                color: excludeOutlier ? '#FFFFFF' : 'var(--brand-navy)',
                border: '1px solid var(--border-strong)',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              {excludeOutlier ? 'Show With Jan 30 Outlier Included' : 'Inspect Without Jan 30 Crash Outlier'}
            </button>
          </div>
          <div style={{ height: '340px', padding: '12px' }}>
            <PlotlyTerminalChart
              data={equityChartData}
              options={{
                yTitle: 'Net P&L (₹)',
                showLegend: true,
                legendOrientation: 'h',
              }}
            />
          </div>
          <div style={{ padding: '14px 20px', backgroundColor: 'var(--bg-surface-subtle)', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              <strong>Why reporting this proves credibility:</strong> Most retail backtests keep the outlier and market it as alpha.
              AuRA exposes that the Jan 30 sell-off created an artificial close mark nobody could trade in size, proving no persistent edge survives.
            </div>
          </div>
        </div>

        {/* Expandable Trade Log & Parameter Grid Search */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Expandable 1: Complete Trade Log */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '8px', overflow: 'hidden' }}>
            <button
              onClick={() => setShowTradeLog(!showTradeLog)}
              style={{
                width: '100%',
                padding: '16px 20px',
                backgroundColor: 'transparent',
                border: 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--brand-navy)',
              }}
            >
              <span>See Complete Walk-Forward Trade Log ({petalTrades.length} Trades: 15 Dev + 6 Holdout)</span>
              <span>{showTradeLog ? '▲ Hide' : '▼ Expand'}</span>
            </button>

            {showTradeLog && (
              <div style={{ padding: '0 20px 20px', overflowX: 'auto' }}>
                <table className="terminal-table" style={{ width: '100%', fontSize: '12px' }}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Entry Date</th>
                      <th>Exit Date</th>
                      <th>Side</th>
                      <th className="num">Held (Days)</th>
                      <th className="num">Notional (₹)</th>
                      <th className="num">Gross P&L (₹)</th>
                      <th className="num">Costs (₹)</th>
                      <th className="num">Net P&L (₹)</th>
                      <th>Period</th>
                    </tr>
                  </thead>
                  <tbody>
                    {petalTrades.map((t, idx) => {
                      const isHoldout = t.entry >= '2026-04-20';
                      const isOutlier = t.exit === '2026-01-30';
                      return (
                        <tr
                          key={idx}
                          style={{
                            backgroundColor: isOutlier ? 'var(--accent-gold-bg)' : isHoldout ? 'rgba(220, 38, 38, 0.04)' : undefined,
                          }}
                        >
                          <td className="font-mono">{idx + 1}</td>
                          <td className="font-mono">{t.entry}</td>
                          <td className="font-mono">{t.exit}</td>
                          <td>
                            <span className="live-pill" style={{ fontSize: '11px', padding: '2px 8px' }}>
                              {t.side}
                            </span>
                          </td>
                          <td className="num font-mono">{t.held}</td>
                          <td className="num font-mono">₹{Math.round(t.notional).toLocaleString()}</td>
                          <td className="num font-mono" style={{ color: t.gross >= 0 ? 'var(--semantic-emerald)' : 'var(--semantic-crimson)' }}>
                            {t.gross >= 0 ? '+' : ''}{Math.round(t.gross).toLocaleString()}
                          </td>
                          <td className="num font-mono" style={{ color: 'var(--semantic-crimson)' }}>
                            &minus;{Math.round(t.costs).toLocaleString()}
                          </td>
                          <td className="num font-mono" style={{ fontWeight: 700, color: t.net >= 0 ? 'var(--semantic-emerald)' : 'var(--semantic-crimson)' }}>
                            {t.net >= 0 ? '+' : ''}{Math.round(t.net).toLocaleString()}
                          </td>
                          <td>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                color: isHoldout ? 'var(--semantic-crimson)' : 'var(--brand-navy)',
                              }}
                            >
                              {isOutlier ? '★ Jan 30 Outlier' : isHoldout ? 'Untouched Holdout' : 'Development'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Expandable 2: Parameter Grid Search Details */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '8px', overflow: 'hidden' }}>
            <button
              onClick={() => setShowGridSearch(!showGridSearch)}
              style={{
                width: '100%',
                padding: '16px 20px',
                backgroundColor: 'transparent',
                border: 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--brand-navy)',
              }}
            >
              <span>See Parameter Grid Search (9 Trials Evaluated on Development Period Only)</span>
              <span>{showGridSearch ? '▲ Hide' : '▼ Expand'}</span>
            </button>

            {showGridSearch && (
              <div style={{ padding: '0 20px 20px' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  AuRA tested 9 combinations of rolling lookback window (40, 60, 120 sessions) and entry threshold (z = 1.5, 2.0, 2.5) on the development period.
                  The best setting (window = 40, z = 1.5) was frozen before opening the holdout.
                  Bailey &amp; Lopez de Prado&apos;s Deflated Sharpe Ratio (DSR) penalises the holdout result for having searched across 9 trials.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                  {[
                    { w: 40, z: 1.5, sharpe: 0.89, selected: true },
                    { w: 40, z: 2.0, sharpe: 0.72, selected: false },
                    { w: 40, z: 2.5, sharpe: 0.45, selected: false },
                    { w: 60, z: 1.5, sharpe: 0.65, selected: false },
                    { w: 60, z: 2.0, sharpe: 0.51, selected: false },
                    { w: 60, z: 2.5, sharpe: 0.33, selected: false },
                    { w: 120, z: 1.5, sharpe: 0.41, selected: false },
                    { w: 120, z: 2.0, sharpe: 0.28, selected: false },
                    { w: 120, z: 2.5, sharpe: 0.15, selected: false },
                  ].map((g, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '6px',
                        border: g.selected ? '2px solid var(--brand-navy)' : '1px solid var(--border-subtle)',
                        backgroundColor: g.selected ? 'var(--accent-gold-bg)' : 'var(--bg-surface-subtle)',
                      }}
                    >
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {g.selected ? '✓ CHOSEN SETTING' : `TRIAL #${idx + 1}`}
                      </div>
                      <div className="font-mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--brand-navy)', marginTop: '2px' }}>
                        Window {g.w}s &bull; z={g.z}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Dev Sharpe: {g.sharpe}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
