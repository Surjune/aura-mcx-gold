import React, { useState, useMemo } from 'react';
import { SectionHeading } from '../components/SectionHeading';
import { PlotlyTerminalChart } from '../components/PlotlyTerminalChart';
import { useTerminal } from '../store/terminalStore';
import { bps, count, dayMonthYear, monthRange, num, pct } from '../utils/format';

const SIGNIFICANCE = 0.05; // the verdict rule in aura/report.py: an edge needs bootstrap p < 0.05

export const BacktestResultsSection: React.FC = () => {
  const { summary, backtest, series } = useTerminal();
  const [showTradeLog, setShowTradeLog] = useState(false);
  const [showGridSearch, setShowGridSearch] = useState(false);
  const [excludeOutlier, setExcludeOutlier] = useState(false);

  const petalSummary = backtest?.summary?.['GOLDPETAL'];
  const petalTrades = backtest?.trades?.['GOLDPETAL'] ?? [];
  const hurdleLabel = num(summary?.hurdle_bps);
  const dev = petalSummary?.development;
  const hold = petalSummary?.holdout;
  const holdoutFrom = petalSummary?.holdout_from;
  const chosen = petalSummary?.chosen;
  const grid = petalSummary?.grid ?? [];

  const isHoldoutTrade = (entry: string) => holdoutFrom !== undefined && entry >= holdoutFrom;
  const devTradeList = petalTrades.filter((t) => !isHoldoutTrade(t.entry));
  const holdTradeCount = petalTrades.length - devTradeList.length;

  // The single development trade that carries most of the profit (reported as best_trade_share).
  const outlier = useMemo(() => {
    if (!dev?.best_trade_share || devTradeList.length === 0) return null;
    return devTradeList.reduce((best, t) => (t.net > best.net ? t : best));
  }, [dev?.best_trade_share, devTradeList]);
  const outlierDate = outlier ? dayMonthYear(outlier.exit) : '\u2014';

  const holdNegative = (hold?.net_bps_per_trade ?? 0) < 0;
  const holdSignificant = hold?.bootstrap_p !== undefined && hold.bootstrap_p < SIGNIFICANCE;

  const equityChartData = useMemo(() => {
    if (!series?.equity?.GOLDPETAL) return [];
    const sessions = series.session;
    const outlierIndex = outlier ? sessions.findIndex((s) => s.startsWith(outlier.exit)) : -1;
    const yValues = excludeOutlier && outlier && outlierIndex !== -1
      ? series.equity.GOLDPETAL.map((val, idx) => (idx >= outlierIndex ? val - outlier.net : val))
      : series.equity.GOLDPETAL;
    return [
      {
        x: sessions,
        y: yValues,
        type: 'scatter',
        mode: 'lines',
        name: excludeOutlier ? `Strategy Equity (${outlierDate} Outlier Removed)` : 'Strategy Net Equity (₹)',
        line: { color: excludeOutlier ? '#64748B' : '#0F172A', width: 2 },
        fill: 'tozeroy',
        fillcolor: 'rgba(15, 23, 42, 0.04)',
      },
    ];
  }, [series, excludeOutlier, outlier, outlierDate]);

  const holdoutMarker = holdoutFrom
    ? {
        shapes: [{ type: 'line', x0: holdoutFrom, x1: holdoutFrom, yref: 'paper', y0: 0, y1: 1, line: { color: '#DC2626', width: 1.5, dash: 'dash' } }],
        annotations: [{ x: holdoutFrom, yref: 'paper', y: 1, text: `Untouched holdout from ${dayMonthYear(holdoutFrom)}`, showarrow: false, xanchor: 'left', yanchor: 'bottom', font: { size: 10, color: '#DC2626' } }],
      }
    : {};

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
                <span className="discipline-step-tag">Equal Grams</span>
              </div>
              <h4 className="discipline-step-title">3. Whole-Lot Hedges</h4>
              <p className="discipline-step-desc">
                Enforced integer lot ratios holding equal grams of gold (100 PETAL vs 10 TEN, 10 GUINEA vs 8 TEN).
              </p>
            </div>

            <div className="discipline-step-card highlight">
              <div className="discipline-card-header">
                <span className="discipline-step-num">STEP 04</span>
                <span className="discipline-step-tag" style={{ backgroundColor: 'var(--accent-orange-subtle)', color: 'var(--accent-orange)', borderColor: 'var(--accent-orange-border)' }}>{hurdleLabel} bps</span>
              </div>
              <h4 className="discipline-step-title">4. {hurdleLabel} bps Full Costs</h4>
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
                The {outlierDate} trade ({pct(dev?.best_trade_share)} of dev P&amp;L) is isolated to test whether any edge remains without it.
              </p>
            </div>
          </div>
        </div>

        {/* Development vs Untouched Holdout Comparison Card */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: '24px', marginBottom: '32px' }}>
          <div className="terminal-panel-card">
            <div className="panel-header">
              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  In-Sample Tuning
                </span>
                <h4 className="panel-title" style={{ marginTop: '2px' }}>Development Period ({monthRange(dev?.from, dev?.to)})</h4>
                <p className="panel-subtitle">Strategy parameters chosen from {grid.length || 9}-point grid</p>
              </div>
              <span className="panel-badge" style={{ backgroundColor: 'var(--bg-surface-subtle)', color: 'var(--brand-navy)' }}>
                {count(dev?.sessions, 'Sessions')}
              </span>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Net Return Per Trade</div>
                  <div className="font-mono" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--semantic-emerald)' }}>
                    {bps(dev?.net_bps_per_trade)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Completed Trades</div>
                  <div className="font-mono" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--brand-navy)' }}>
                    {count(dev?.trades, 'trades')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Win Rate</div>
                  <div className="font-mono" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brand-navy)' }}>
                    {pct(dev?.win_rate)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Annualised Sharpe</div>
                  <div className="font-mono" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brand-navy)' }}>
                    {num(dev?.sharpe, 2)}
                  </div>
                </div>
              </div>
              <div style={{ padding: '12px', backgroundColor: 'var(--semantic-amber-bg)', border: '1px solid var(--semantic-amber-border)', borderRadius: '6px', fontSize: '12px', color: 'var(--brand-navy)' }}>
                <strong>The Mirage:</strong> {pct(dev?.best_trade_share)} of this development profit came from one trade exiting on {outlierDate}.
                Without that trade, the edge was only {bps(dev?.net_bps_ex_best)} per trade.
              </div>
            </div>
          </div>

          <div className="terminal-panel-card" style={{ border: '2px solid var(--brand-navy)' }}>
            <div className="panel-header" style={{ backgroundColor: 'var(--bg-surface-subtle)' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--semantic-crimson)', textTransform: 'uppercase' }}>
                  Out-of-Sample Verification
                </span>
                <h4 className="panel-title" style={{ marginTop: '2px' }}>Untouched Holdout ({monthRange(hold?.from, hold?.to)})</h4>
                <p className="panel-subtitle">Zero parameter changes; real execution test</p>
              </div>
              <span className="panel-badge" style={{ backgroundColor: 'var(--semantic-crimson-bg)', color: 'var(--semantic-crimson)', border: '1px solid var(--semantic-crimson-border)' }}>
                {count(hold?.sessions, 'Sessions')}
              </span>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Net Return Per Trade</div>
                  <div className="font-mono" style={{ fontSize: '24px', fontWeight: 800, color: holdNegative ? 'var(--semantic-crimson)' : 'var(--semantic-emerald)' }}>
                    {bps(hold?.net_bps_per_trade)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Completed Trades</div>
                  <div className="font-mono" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--brand-navy)' }}>
                    {count(hold?.trades, 'trades')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Bootstrap p-value</div>
                  <div className="font-mono" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--semantic-crimson)' }}>
                    {num(hold?.bootstrap_p, 2)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Deflated Sharpe Prob</div>
                  <div className="font-mono" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--semantic-crimson)' }}>
                    {num(hold?.deflated_sharpe_prob, 2)}
                  </div>
                </div>
              </div>
              <div style={{ padding: '12px', backgroundColor: 'var(--semantic-crimson-bg)', border: '1px solid var(--semantic-crimson-border)', borderRadius: '6px', fontSize: '12px', color: 'var(--semantic-crimson)' }}>
                <strong>Rigorous Finding:</strong> Win rate went from {pct(dev?.win_rate)} to {pct(hold?.win_rate)}, net return per trade{' '}
                {holdNegative ? 'turned negative' : `was ${bps(hold?.net_bps_per_trade)}`}, and a bootstrap p of {num(hold?.bootstrap_p, 2)}{' '}
                {holdSignificant ? 'is below the 0.05 significance bar.' : 'means the result is indistinguishable from luck.'}
              </div>
            </div>
          </div>
        </div>

        {/* Cumulative Equity Curve Chart with Outlier Toggle */}
        <div className="terminal-panel-card" style={{ marginBottom: '32px' }}>
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h4 className="panel-title">Cumulative Backtest Equity Curve (Net of Full {hurdleLabel} bps Friction)</h4>
              <p className="panel-subtitle">Notice the vertical spike on {outlierDate} followed by the flat/negative holdout period</p>
            </div>
            <button
              onClick={() => setExcludeOutlier(!excludeOutlier)}
              disabled={!outlier}
              style={{
                padding: '6px 14px',
                backgroundColor: excludeOutlier ? 'var(--brand-navy)' : 'var(--bg-surface-subtle)',
                color: excludeOutlier ? '#FFFFFF' : 'var(--brand-navy)',
                border: '1px solid var(--border-strong)',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: outlier ? 'pointer' : 'default',
                transition: 'all 150ms ease',
              }}
            >
              {excludeOutlier ? `Show With ${outlierDate} Outlier Included` : `Inspect Without ${outlierDate} Outlier`}
            </button>
          </div>
          <div style={{ height: '340px', padding: '12px' }}>
            <PlotlyTerminalChart
              data={equityChartData}
              options={{
                yTitle: 'Net P&L (₹)',
                showLegend: true,
                legendOrientation: 'h',
                ...holdoutMarker,
              }}
            />
          </div>
          <div style={{ padding: '14px 20px', backgroundColor: 'var(--bg-surface-subtle)', borderTop: '1px solid var(--border-subtle)', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <strong>Why reporting this proves credibility:</strong> Most retail backtests keep the outlier and market it as alpha.
            AuRA shows that the {outlierDate} close was a sell-off mark nobody could trade in size; without it, no persistent edge survives.
          </div>
        </div>

        {/* Expandable Trade Log & Parameter Grid Search */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="expand-panel">
            <button className="expand-toggle" onClick={() => setShowTradeLog(!showTradeLog)} aria-expanded={showTradeLog}>
              <span className="expand-toggle-label">
                See Complete Walk-Forward Trade Log ({petalTrades.length} Trades: {devTradeList.length} Dev + {holdTradeCount} Holdout)
              </span>
              <span className="expand-toggle-action">{showTradeLog ? '▲ Hide' : '▼ Expand'}</span>
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
                      <th className="num">Held (Sessions)</th>
                      <th className="num">Notional (₹)</th>
                      <th className="num">Gross P&L (₹)</th>
                      <th className="num">Costs (₹)</th>
                      <th className="num">Net P&L (₹)</th>
                      <th>Period</th>
                    </tr>
                  </thead>
                  <tbody>
                    {petalTrades.map((t, idx) => {
                      const isHoldout = isHoldoutTrade(t.entry);
                      const isOutlier = outlier !== null && t.entry === outlier.entry && t.exit === outlier.exit;
                      return (
                        <tr
                          key={`${t.entry}-${t.exit}`}
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
                              {isOutlier ? `★ ${outlierDate} Outlier` : isHoldout ? 'Untouched Holdout' : 'Development'}
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

          <div className="expand-panel">
            <button className="expand-toggle" onClick={() => setShowGridSearch(!showGridSearch)} aria-expanded={showGridSearch}>
              <span className="expand-toggle-label">
                See Parameter Grid Search ({grid.length} Trials Evaluated on Development Period Only)
              </span>
              <span className="expand-toggle-action">{showGridSearch ? '▲ Hide' : '▼ Expand'}</span>
            </button>

            {showGridSearch && (
              <div style={{ padding: '0 20px 20px' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  AuRA tested {grid.length} combinations of rolling lookback window ({[...new Set(grid.map((g) => g.window))].join(', ')} sessions)
                  and entry threshold (z = {[...new Set(grid.map((g) => g.z_in))].join(', ')}) on the development period.
                  The best setting (window = {chosen?.window ?? '\u2014'}, z = {chosen?.z_in ?? '\u2014'}) was frozen before opening the holdout.
                  Bailey &amp; Lopez de Prado&apos;s Deflated Sharpe Ratio (DSR) penalises the result for having searched across {grid.length} trials.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                  {grid.map((g, idx) => {
                    const selected = chosen !== undefined && g.window === chosen.window && g.z_in === chosen.z_in;
                    return (
                      <div
                        key={`${g.window}-${g.z_in}`}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '6px',
                          border: selected ? '2px solid var(--brand-navy)' : '1px solid var(--border-subtle)',
                          backgroundColor: selected ? 'var(--accent-gold-bg)' : 'var(--bg-surface-subtle)',
                        }}
                      >
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {selected ? '✓ CHOSEN SETTING' : `TRIAL #${idx + 1}`}
                        </div>
                        <div className="font-mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--brand-navy)', marginTop: '2px' }}>
                          Window {g.window} &bull; z={g.z_in}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          Dev Sharpe: {num(g.dev_sharpe, 2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
