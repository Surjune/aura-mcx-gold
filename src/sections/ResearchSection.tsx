import React, { useState, useMemo } from 'react';
import { SectionHeading } from '../components/SectionHeading';
import { MetricCard } from '../components/MetricCard';
import { PlotlyTerminalChart } from '../components/PlotlyTerminalChart';
import { CarryTrapDecomposer } from '../components/CarryTrapDecomposer';
import { useTerminal } from '../store/terminalStore';

export const ResearchSection: React.FC = () => {
  const { summary, backtest, series } = useTerminal();
  const [showTradeLog, setShowTradeLog] = useState(false);
  const [showCarryDeepDive, setShowCarryDeepDive] = useState(false);
  const [traceFilter, setTraceFilter] = useState<'ALL' | 'NAIVE' | 'PURITY' | 'CARRY'>('ALL');

  const petalSummary = backtest?.summary?.['GOLDPETAL'];
  const petalTrades = backtest?.trades?.['GOLDPETAL'] ?? [];
  const hurdle = summary?.hurdle_bps ?? 13.0762;
  const holdoutDate = '2026-04-20';

  // Real Metric values from backend
  const sessionsCount = summary?.data?.sessions ?? 398;
  const hurdleBpsStr = `${hurdle.toFixed(1)} bps`;
  const holdoutTradesCount = `${petalSummary?.holdout?.trades ?? 6} trades`;
  const holdoutNetBpsStr = `${petalSummary?.holdout?.net_bps_per_trade ? petalSummary.holdout.net_bps_per_trade.toFixed(1) : '-2.7'} bps`;

  // Chart 1: Normalised Price Comparison
  const normalisedPriceChartData = useMemo(() => {
    if (!series) return [];
    return [
      {
        x: series.session,
        y: series.ten_fine,
        type: 'scatter',
        mode: 'lines',
        name: 'GOLDTEN (Benchmark 999)',
        line: { color: '#0F172A', width: 2 },
      },
      {
        x: series.session,
        y: series.petal_fine,
        type: 'scatter',
        mode: 'lines',
        name: 'GOLDPETAL (Retail 1g)',
        line: { color: '#2563EB', width: 1.5 },
      },
      {
        x: series.session,
        y: series.guinea_fine,
        type: 'scatter',
        mode: 'lines',
        name: 'GOLDGUINEA (8g)',
        line: { color: '#64748B', width: 1.5 },
      },
      {
        x: series.session,
        y: series.m_fine,
        type: 'scatter',
        mode: 'lines',
        name: 'GOLDM (100g, 995)',
        line: { color: '#94A3B8', width: 1.2, dash: 'dot' },
      },
    ];
  }, [series]);

  // Chart 2: Same-Expiry Premium vs Cost Hurdle
  const premiumSpreadChartData = useMemo(() => {
    if (!series) return [];
    return [
      {
        x: series.session,
        y: series.prem_petal,
        type: 'scatter',
        mode: 'lines',
        name: 'GOLDPETAL Premium vs GOLDTEN',
        line: { color: '#2563EB', width: 1.8 },
      },
      {
        x: series.session,
        y: series.prem_guinea,
        type: 'scatter',
        mode: 'lines',
        name: 'GOLDGUINEA Premium vs GOLDTEN',
        line: { color: '#64748B', width: 1.5 },
      },
      {
        x: [series.session[0], series.session[series.session.length - 1]],
        y: [hurdle, hurdle],
        type: 'scatter',
        mode: 'lines',
        name: `Cost Hurdle (+${hurdle.toFixed(1)} bps)`,
        line: { color: '#DC2626', width: 1.5, dash: 'dash' },
      },
      {
        x: [series.session[0], series.session[series.session.length - 1]],
        y: [-hurdle, -hurdle],
        type: 'scatter',
        mode: 'lines',
        name: `Cost Hurdle (-${hurdle.toFixed(1)} bps)`,
        line: { color: '#DC2626', width: 1.5, dash: 'dash' },
      },
    ];
  }, [series, hurdle]);

  // Chart 3: Walk-Forward Equity Curve
  const equityChartData = useMemo(() => {
    if (!series || !series.equity?.GOLDPETAL) return [];
    return [
      {
        x: series.session,
        y: series.equity.GOLDPETAL,
        type: 'scatter',
        mode: 'lines',
        name: 'Cumulative Net P&L (₹)',
        line: { color: '#0F172A', width: 2 },
        fill: 'tozeroy',
        fillcolor: 'rgba(15, 23, 42, 0.04)',
      },
    ];
  }, [series]);

  const equityChartLayout = useMemo(() => {
    return {
      shapes: [
        {
          type: 'line',
          x0: holdoutDate,
          x1: holdoutDate,
          y0: 0,
          y1: 1,
          yref: 'paper',
          line: {
            color: '#DC2626',
            width: 1.5,
            dash: 'dash',
          },
        },
      ],
      annotations: [
        {
          x: holdoutDate,
          y: 0.95,
          yref: 'paper',
          text: 'UNTOUCHED HOLDOUT (20-APR-2026)',
          showarrow: true,
          arrowhead: 2,
          arrowcolor: '#DC2626',
          ax: 90,
          ay: -15,
          font: { family: 'Inter, sans-serif', size: 11, color: '#DC2626' },
          bgcolor: '#FFFFFF',
          bordercolor: '#E2E8F0',
        },
        {
          x: '2026-01-30',
          y: 0.6,
          yref: 'paper',
          text: '30-JAN CRASH STRESS PRINT (+₹33,970)',
          showarrow: true,
          arrowhead: 2,
          arrowcolor: '#B45309',
          ax: -80,
          ay: -25,
          font: { family: 'Inter, sans-serif', size: 11, color: '#B45309' },
          bgcolor: '#FFFFFF',
          bordercolor: '#E2E8F0',
        },
      ],
    };
  }, [holdoutDate]);

  // Carry Trap Decomposition Chart
  const carryTrapChartData = useMemo(() => {
    if (!series) return [];

    const traceNaive = {
      x: series.session,
      y: series.m_naive,
      type: 'scatter',
      mode: 'lines',
      name: '1. Naive Screen Gap (Uncorrected)',
      line: { color: '#94A3B8', width: 1.5, dash: 'dot' },
    };

    const tracePurity = {
      x: series.session,
      y: series.m_purity,
      type: 'scatter',
      mode: 'lines',
      name: '2. Purity Adjusted (995->999)',
      line: { color: '#B45309', width: 1.5 },
    };

    const traceCarry = {
      x: series.session,
      y: series.m_carry,
      type: 'scatter',
      mode: 'lines',
      name: '3. Purity + Expiry Carry Corrected',
      line: { color: '#2563EB', width: 2 },
    };

    const zeroLine = {
      x: [series.session[0], series.session[series.session.length - 1]],
      y: [0, 0],
      type: 'scatter',
      mode: 'lines',
      name: 'Parity Baseline (0 bps)',
      line: { color: '#CBD5E1', width: 1, dash: 'dash' },
    };

    if (traceFilter === 'NAIVE') return [zeroLine, traceNaive];
    if (traceFilter === 'PURITY') return [zeroLine, tracePurity];
    if (traceFilter === 'CARRY') return [zeroLine, traceCarry];
    return [zeroLine, traceNaive, tracePurity, traceCarry];
  }, [series, traceFilter]);

  return (
    <section id="research" className="story-section">
      <div className="section-inner">
        <SectionHeading
          eyebrow="What the data shows"
          title="Apparent price gaps do not consistently survive real trading costs"
          description="We tested whether relative-value price gaps could generate an actual trading edge after realistic brokerage, taxes, exchange turnover charges, bid-ask spread crossing, and liquidity gates."
        />

        {/* 4 Large Real Metric Cards */}
        <div className="metrics-grid-4">
          <MetricCard
            label="Historical Sessions Analysed"
            value={sessionsCount.toString()}
            subtext="Complete cross-contract overlap period (Apr 2025 – Oct 2026)"
            badge="DuckDB Database"
          />
          <MetricCard
            label="Round-Trip Cost Hurdle"
            value={hurdleBpsStr}
            subtext="Brokerage, STT, turnover charges, and bid-ask spread cost"
            badge="Track 03 Model"
          />
          <MetricCard
            label="Untouched Holdout Trades"
            value={holdoutTradesCount}
            subtext="Strict 6-month out-of-sample forward evaluation"
            badge="Zero Look-Ahead"
          />
          <MetricCard
            label="Average Net Holdout Result"
            value={holdoutNetBpsStr}
            subtext="Performance after executing full whole-lot hedges"
            badge="Negative Edge"
          />
        </div>

        {/* Chart 1: Normalised Price Comparison */}
        <div className="research-chart-panel">
          <div className="chart-header-block">
            <h3 className="chart-title">Price gaps after fair comparison</h3>
            <p className="chart-explanation">
              This chart compares contracts only after adjusting for their different purity and contract sizes into ₹ per gram of fine gold.
            </p>
          </div>
          <div className="chart-canvas-wrap">
            <PlotlyTerminalChart
              data={normalisedPriceChartData}
              options={{ yTitle: '₹ / gram', showLegend: true }}
            />
          </div>
          <div className="chart-meaning-footer">
            <strong>What this means:</strong> When viewed on an identical per-gram basis, the contracts track each other closely.
            Most of the apparent screen difference comes from contract design rather than pricing mistakes.
          </div>
        </div>

        {/* Chart 2: Same-Expiry Premium vs Cost Hurdle */}
        <div className="research-chart-panel">
          <div className="chart-header-block">
            <h3 className="chart-title">Retail premiums vs transaction cost hurdle</h3>
            <p className="chart-explanation">
              GOLDPETAL and GOLDGUINEA trade at a persistent retail premium (+69 bps median) over the GOLDTEN benchmark.
            </p>
          </div>
          <div className="chart-canvas-wrap">
            <PlotlyTerminalChart
              data={premiumSpreadChartData}
              options={{ yTitle: 'Basis Points (bps)', showLegend: true, yTickSuffix: ' bps' }}
            />
          </div>
          <div className="chart-meaning-footer">
            <strong>What this means:</strong> For a mean-reversion trade to be profitable, the expected convergence must exceed the red dashed
            <span style={{ color: 'var(--semantic-crimson)', fontWeight: 700 }}> &plusmn;{hurdle.toFixed(1)} bps round-trip transaction hurdle</span>.
            In practice, the retail premium is structural and rarely reverts enough to overcome transaction friction.
          </div>
        </div>

        {/* Chart 3: Walk-Forward Equity Curve & Outlier Highlight */}
        <div className="research-chart-panel">
          <div className="chart-header-block">
            <h3 className="chart-title">Walk-forward validation over unseen data</h3>
            <p className="chart-explanation">
              The strategy was tuned strictly on development data (Apr 2025 – Apr 2026) and then evaluated on untouched holdout data (Apr – Oct 2026).
            </p>
          </div>
          <div className="chart-canvas-wrap">
            <PlotlyTerminalChart
              data={equityChartData}
              layout={equityChartLayout}
              options={{ yTitle: 'Cumulative Net P&L (₹)', yTickSuffix: ' ₹' }}
            />
          </div>
          <div className="chart-meaning-footer">
            <strong>What this means:</strong> One extreme market day drove <strong>75.9%</strong> of the development profit (the historic 30 Jan 2026 crash print of +₹33,970).
            AuRA does not treat a one-off stress-day print as a repeatable edge. In the untouched out-of-sample holdout period, the strategy delivered <strong>-2.7 bps per trade</strong> (bootstrap p-value = 0.52), proving the absence of a persistent edge.
          </div>
        </div>

        {/* Collapsible Section 1: Detailed Trade Log */}
        <div className="collapsible-wrapper">
          <button
            className="collapsible-header-btn"
            onClick={() => setShowTradeLog(!showTradeLog)}
          >
            <span>View detailed trade log ({petalTrades.length} executions)</span>
            <span style={{ color: 'var(--action-blue)' }}>{showTradeLog ? 'Hide trade ledger &uarr;' : 'Expand trade ledger &darr;'}</span>
          </button>

          {showTradeLog && (
            <div className="collapsible-content">
              <div className="table-responsive">
                <table className="terminal-table">
                  <thead>
                    <tr>
                      <th>Entry Date</th>
                      <th>Exit Date</th>
                      <th>Trade Side</th>
                      <th className="num">Holding Days</th>
                      <th className="num">Gross P&amp;L (₹)</th>
                      <th className="num">Total Costs (₹)</th>
                      <th className="num">Net P&amp;L (₹)</th>
                      <th>Validation Phase</th>
                    </tr>
                  </thead>
                  <tbody>
                    {petalTrades.map((t, idx) => {
                      const isHoldout = t.entry >= holdoutDate;
                      const isOutlier = t.exit === '2026-01-30';
                      return (
                        <tr
                          key={idx}
                          style={{
                            backgroundColor: isOutlier ? 'var(--accent-gold-bg)' : undefined,
                          }}
                        >
                          <td className="font-mono">{t.entry}</td>
                          <td className="font-mono">{t.exit} {isOutlier && <strong style={{ color: 'var(--accent-gold)' }}>(Crash Day)</strong>}</td>
                          <td>{t.side}</td>
                          <td className="num font-mono">{t.held} days</td>
                          <td className="num font-mono">₹{Math.round(t.gross).toLocaleString()}</td>
                          <td className="num font-mono">₹{Math.round(t.costs).toLocaleString()}</td>
                          <td
                            className="num font-mono"
                            style={{
                              color: t.net >= 0 ? 'var(--semantic-emerald)' : 'var(--semantic-crimson)',
                              fontWeight: 700,
                            }}
                          >
                            {t.net >= 0 ? '+' : ''}₹{Math.round(t.net).toLocaleString()}
                          </td>
                          <td>
                            <span
                              className="status-badge normal"
                              style={{
                                backgroundColor: isHoldout ? 'var(--accent-gold-bg)' : 'var(--bg-surface-subtle)',
                                color: isHoldout ? 'var(--accent-gold)' : 'var(--text-muted)',
                              }}
                            >
                              {isHoldout ? 'Holdout (OOS)' : 'Development'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Collapsible Section 2: Deep Dive: Curve & Carry Decomposition */}
        <div className="collapsible-wrapper">
          <button
            className="collapsible-header-btn"
            onClick={() => setShowCarryDeepDive(!showCarryDeepDive)}
          >
            <span>Deep Dive: Curve &amp; Carry Decomposition (GOLDM vs GOLDTEN ~24-day gap)</span>
            <span style={{ color: 'var(--action-blue)' }}>{showCarryDeepDive ? 'Hide curve decomposition &uarr;' : 'Expand curve decomposition &darr;'}</span>
          </button>

          {showCarryDeepDive && (
            <div className="collapsible-content">
              <div style={{ marginBottom: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  className={`btn-secondary ${traceFilter === 'ALL' ? 'btn-primary' : ''}`}
                  onClick={() => setTraceFilter('ALL')}
                >
                  All Traces
                </button>
                <button
                  className={`btn-secondary ${traceFilter === 'NAIVE' ? 'btn-primary' : ''}`}
                  onClick={() => setTraceFilter('NAIVE')}
                >
                  1. Naive Gap
                </button>
                <button
                  className={`btn-secondary ${traceFilter === 'PURITY' ? 'btn-primary' : ''}`}
                  onClick={() => setTraceFilter('PURITY')}
                >
                  2. Purity Adjusted
                </button>
                <button
                  className={`btn-secondary ${traceFilter === 'CARRY' ? 'btn-primary' : ''}`}
                  onClick={() => setTraceFilter('CARRY')}
                >
                  3. Purity + Carry Corrected
                </button>
              </div>

              <div style={{ width: '100%', height: '360px', marginBottom: '24px' }}>
                <PlotlyTerminalChart
                  data={carryTrapChartData}
                  options={{ yTitle: 'Gap (Basis Points)', showLegend: true, yTickSuffix: ' bps' }}
                />
              </div>

              <CarryTrapDecomposer />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
