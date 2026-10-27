import React, { useState, useMemo } from 'react';
import { SectionHeading } from '../components/SectionHeading';
import { PlotlyTerminalChart } from '../components/PlotlyTerminalChart';
import { useTerminal } from '../store/terminalStore';

export const LiveMonitorSection: React.FC = () => {
  const { live, summary, refreshAll, isLoading, slippageLots, setSlippageLots } = useTerminal();
  const [showDepthSimulation, setShowDepthSimulation] = useState(false);

  const snapshot = live?.snapshot;
  const contracts = snapshot?.contracts ?? [];
  const pairs = snapshot?.pairs ?? [];
  const ticks = live?.ticks ?? [];
  const hurdle = summary?.hurdle_bps ?? 13.0762;

  const isMarketOpen = snapshot?.market_open ?? false;
  const sourceLabel = live?.source ? `Source: ${live.source}` : 'Session Archive';
  const polledTime = snapshot?.polled_ist ?? 'Recently updated';

  // Check overall decision
  const hasFlaggedPair = pairs.some((p) => p.status === 'flagged');
  const mainDecision = hasFlaggedPair ? 'Review Required' : 'No Actionable Opportunity';
  const mainReason = hasFlaggedPair
    ? 'A contract pair cleared both statistical divergence and the 13.1 bps cost hurdle. Manual review advised.'
    : 'Current screen premiums do not exceed the estimated 13.1 bps round-trip transaction and execution hurdle.';

  // Intraday Premium Chart
  const tickChartData = useMemo(() => {
    if (!ticks || ticks.length === 0) return [];

    const times = ticks.map((t) => {
      const d = new Date(t.t * 1000);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
    });

    return [
      {
        x: times,
        y: ticks.map((t) => t.p0),
        type: 'scatter',
        mode: 'lines',
        name: 'GOLDPETAL Premium (bps)',
        line: { color: '#0F172A', width: 2 },
      },
      {
        x: times,
        y: ticks.map((t) => t.p1),
        type: 'scatter',
        mode: 'lines',
        name: 'GOLDGUINEA Premium (bps)',
        line: { color: '#2563EB', width: 1.5 },
      },
      {
        x: times,
        y: ticks.map((t) => t.e0),
        type: 'scatter',
        mode: 'lines',
        name: 'Executable Sell Net Gap (bps)',
        line: { color: '#DC2626', width: 1.2, dash: 'dot' },
      },
    ];
  }, [ticks]);

  return (
    <section id="live" className="story-section">
      <div className="section-inner">
        <SectionHeading
          eyebrow="Real-Time MCX Feed"
          title="Live MCX Gold Contract Monitor"
          description="AuRA monitors live quotes to determine whether any intraday price difference remains economically meaningful after estimated trading costs."
        />

        {/* Top Control & Telemetry Banner */}
        <div className="live-top-banner">
          <div className="live-status-pills">
            <span className={`live-pill ${isMarketOpen ? 'market-state' : 'closed-state'}`}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: isMarketOpen ? 'var(--semantic-emerald)' : '#94A3B8',
                  display: 'inline-block',
                }}
              />
              {isMarketOpen ? 'MCX Market Open' : 'MCX Market Closed'}
            </span>

            <span className="live-pill font-mono">
              Last Poll: {polledTime} IST
            </span>

            <span className="live-pill" style={{ textTransform: 'capitalize' }}>
              {sourceLabel}
            </span>

            <span
              style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                fontStyle: 'italic',
              }}
            >
              Monitor only — no trades are placed
            </span>
          </div>

          <button
            onClick={() => refreshAll()}
            className="btn-primary"
            disabled={isLoading}
          >
            <span>{isLoading ? 'Refreshing...' : 'Refresh Quotes'}</span>
          </button>
        </div>

        {/* Main Decision Card */}
        <div
          style={{
            backgroundColor: hasFlaggedPair ? 'var(--semantic-crimson-bg)' : 'var(--bg-surface-subtle)',
            border: `1px solid ${hasFlaggedPair ? 'var(--semantic-crimson-border)' : 'var(--border-subtle)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: '28px',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: hasFlaggedPair ? 'var(--semantic-crimson)' : 'var(--text-muted)' }}>
              Execution Decision
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: 800, color: hasFlaggedPair ? 'var(--semantic-crimson)' : 'var(--brand-navy)', marginTop: '4px' }}>
              {mainDecision}
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '6px', maxWidth: '720px' }}>
              {mainReason}
            </p>
          </div>

          <div
            style={{
              padding: '12px 20px',
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              textAlign: 'right',
            }}
          >
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Active Cost Hurdle
            </div>
            <div className="font-mono" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--brand-navy)' }}>
              {hurdle.toFixed(1)} bps
            </div>
          </div>
        </div>

        {/* 1. Contract Quote Cards */}
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--brand-navy)', marginBottom: '12px' }}>
            Current Top-of-Book Contract Quotes
          </h4>
          <div className="quote-cards-grid-4">
            {contracts.length > 0 ? (
              contracts.map((c) => {
                const spreadVal = c.bid && c.ask ? (c.ask - c.bid).toFixed(1) : '—';
                const spreadBps = c.spread_bps ? `${c.spread_bps.toFixed(1)} bps` : '—';
                return (
                  <div key={c.symbol} className="quote-card">
                    <div className="quote-card-header">
                      <span className="quote-card-symbol">{c.symbol}</span>
                      <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {c.expiry}
                      </span>
                    </div>

                    <div className="quote-card-ltp">
                      ₹{c.ltp.toLocaleString()}
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      Normalised: <strong className="font-mono">₹{c.fine.toFixed(2)}/g</strong>
                    </div>

                    <div className="quote-depth-row">
                      <span>Best Bid: <strong className="font-mono">₹{c.bid ? c.bid.toLocaleString() : '—'}</strong></span>
                      <span>Best Ask: <strong className="font-mono">₹{c.ask ? c.ask.toLocaleString() : '—'}</strong></span>
                    </div>

                    <div className="quote-depth-row">
                      <span>Spread: <strong className="font-mono">₹{spreadVal} ({spreadBps})</strong></span>
                      <span>Vol: <strong className="font-mono">{c.volume.toLocaleString()}</strong></span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ gridColumn: 'span 4', textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                Loading live quote snapshots...
              </div>
            )}
          </div>
        </div>

        {/* 2. Executable Comparison Table */}
        <div style={{ marginBottom: '32px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--brand-navy)', marginBottom: '12px' }}>
            Executable Relative-Value Comparison
          </h4>
          <div className="table-responsive">
            <table className="terminal-table">
              <thead>
                <tr>
                  <th>Contract Pair</th>
                  <th className="num">Normalised Gap</th>
                  <th className="num">Est. Cost Hurdle</th>
                  <th className="num">Net Edge After Costs</th>
                  <th>System Decision</th>
                  <th>Analytical Rationale</th>
                </tr>
              </thead>
              <tbody>
                {pairs.length > 0 ? (
                  pairs.map((p, idx) => {
                    const edgeVal = p.exec_gap_bps !== null ? `${p.exec_gap_bps >= 0 ? '+' : ''}${p.exec_gap_bps.toFixed(1)} bps` : 'None';
                    const isFlagged = p.status === 'flagged';
                    return (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600, color: 'var(--brand-navy)' }}>
                          {p.pair}
                        </td>
                        <td className="num font-mono">
                          +{p.premium_bps.toFixed(1)} bps
                        </td>
                        <td className="num font-mono">
                          {hurdle.toFixed(1)} bps
                        </td>
                        <td
                          className="num font-mono"
                          style={{
                            fontWeight: 700,
                            color: p.exec_gap_bps && p.exec_gap_bps > hurdle ? 'var(--semantic-emerald)' : 'var(--text-secondary)',
                          }}
                        >
                          {edgeVal}
                        </td>
                        <td>
                          <span className={`status-badge ${isFlagged ? 'flagged' : 'normal'}`}>
                            {isFlagged ? 'REVIEW' : 'QUIET'}
                          </span>
                        </td>
                        <td style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '420px' }}>
                          {p.why}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      Loading pair classifications...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Intraday Premium Chart */}
        <div className="research-chart-panel">
          <div className="chart-header-block">
            <h3 className="chart-title">Intraday 15-second spread ticks monitor</h3>
            <p className="chart-explanation">
              Real-time premium movements recorded across 15-second polling intervals during the session.
            </p>
          </div>
          <div className="chart-canvas-wrap">
            <PlotlyTerminalChart
              data={tickChartData}
              options={{ yTitle: 'Premium (bps)', showLegend: true, yTickSuffix: ' bps' }}
            />
          </div>
          <div className="chart-meaning-footer">
            <strong>Data Disclosure:</strong> Ticks record official top-of-book quotes published by MCX India.
            Notice how executable bid/ask crossing eliminates apparent screen anomalies.
          </div>
        </div>

        {/* 4. Optional Expandable Depth & Slippage Simulator */}
        <div className="collapsible-wrapper">
          <button
            className="collapsible-header-btn"
            onClick={() => setShowDepthSimulation(!showDepthSimulation)}
          >
            <span>Top-of-book depth &amp; illustrative liquidity simulation</span>
            <span style={{ color: 'var(--action-blue)' }}>{showDepthSimulation ? 'Hide simulation &uarr;' : 'Expand simulation &darr;'}</span>
          </button>

          {showDepthSimulation && (
            <div className="collapsible-content">
              <div style={{ marginBottom: '16px', padding: '12px 16px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <strong>Data Truth Disclosure:</strong> MCX web feeds deliver live top-of-book Best Bid and Best Ask quotes.
                The 5-level depth levels below represent an <em>illustrative liquidity simulation</em> based on typical exchange market depth patterns.
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div style={{ width: '220px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Simulated Order Size (Lots):
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={slippageLots}
                    onChange={(e) => setSlippageLots(Math.max(1, parseInt(e.target.value || '1', 10)))}
                    className="terminal-input"
                    style={{ marginTop: '4px' }}
                  />
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', flex: 1 }}>
                  Tests how price impact scales when sweeping multiple lots beyond the top of the book.
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ padding: '16px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>BUY SWEEP (LIFTING ASKS)</div>
                  <div className="font-mono" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--brand-navy)', marginTop: '4px' }}>
                    Est. Slippage: +{(slippageLots * 0.4).toFixed(1)} bps
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Impact on large lot sizes increases execution friction above the 13.1 bps hurdle.
                  </div>
                </div>

                <div style={{ padding: '16px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>SELL SWEEP (HITTING BIDS)</div>
                  <div className="font-mono" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--brand-navy)', marginTop: '4px' }}>
                    Est. Slippage: +{(slippageLots * 0.4).toFixed(1)} bps
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Crossing bid liquidity erodes theoretical paper profits on reversion.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
