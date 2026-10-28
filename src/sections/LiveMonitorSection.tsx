import React, { useState, useMemo } from 'react';
import { SectionHeading } from '../components/SectionHeading';
import { PlotlyTerminalChart } from '../components/PlotlyTerminalChart';
import { LiveOrderBookLadder } from '../components/LiveOrderBookLadder';
import { useTerminal } from '../store/terminalStore';

export const LiveMonitorSection: React.FC = () => {
  const { live, summary, refreshAll, isLoading } = useTerminal();
  const [showDepthLadder, setShowDepthLadder] = useState(false);

  const snapshot = live?.snapshot;
  const contracts = snapshot?.contracts ?? [];
  const pairs = snapshot?.pairs ?? [];
  const ticks = live?.ticks ?? [];
  const hurdle = summary?.hurdle_bps ?? 13.0762;

  const isMarketOpen = snapshot?.market_open ?? false;
  const status = live?.status ?? (isMarketOpen ? 'live' : 'closed');
  const sourceLabel = live?.source ? `Source: ${live.source}` : 'Session Archive';
  const polledTime = snapshot?.polled_ist ?? 'Recently updated';

  // Overall system decision
  const hasFlaggedPair = pairs.some((p) => p.status === 'flagged');
  const hasWatchPair = pairs.some((p) => p.status === 'watch');

  let overallStatusTag = 'NORMAL';
  let overallStatusBadgeClass = 'normal-state';
  if (!isMarketOpen) {
    overallStatusTag = 'MARKET CLOSED';
    overallStatusBadgeClass = 'closed-state';
  } else if (status === 'delayed' || status === 'replay') {
    overallStatusTag = 'ARCHIVE REPLAY';
    overallStatusBadgeClass = 'watch-state';
  } else if (hasFlaggedPair) {
    overallStatusTag = 'FLAGGED';
    overallStatusBadgeClass = 'flagged-state';
  } else if (hasWatchPair) {
    overallStatusTag = 'WATCH';
    overallStatusBadgeClass = 'watch-state';
  }

  const mainDecision = hasFlaggedPair
    ? 'Statistical Dislocation Detected (Review Advised)'
    : !isMarketOpen
    ? 'MCX Session Closed (Replaying Last Real Session)'
    : 'No Actionable Opportunity (Normal Noise)';

  const mainReason = hasFlaggedPair
    ? 'A contract pair cleared both statistical divergence and the 13.1 bps cost hurdle after crossing the spread. Evaluator review advised.'
    : !isMarketOpen
    ? 'MCX trading session is currently closed. Showing verified snapshot from the last trading day. No trades are suggested.'
    : 'Current screen premiums do not exceed the estimated 13.1 bps round-trip transaction, tax, and bid-ask execution hurdle.';

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
        name: 'Executable Sell Gap (bps)',
        line: { color: '#DC2626', width: 1.2, dash: 'dot' },
      },
      {
        x: [times[0], times[times.length - 1]],
        y: [hurdle, hurdle],
        type: 'scatter',
        mode: 'lines',
        name: `13.1 bps Hurdle`,
        line: { color: '#DC2626', width: 1.5, dash: 'dash' },
      },
    ];
  }, [ticks, hurdle]);

  return (
    <section id="live" className="story-section">
      <div className="section-inner">
        <SectionHeading
          eyebrow="Real-Time MCX Quote Feed"
          title="Live MCX Gold Contract Monitor"
          description="AuRA monitors live quote streams and 5-level order books every 15 seconds to determine whether any intraday price difference remains profitable after estimated exchange fees, stamp duty, CTT, and bid-ask slippage."
        />

        {/* Clear Institutional Disclaimer Note */}
        <div
          style={{
            padding: '12px 18px',
            backgroundColor: 'var(--bg-surface-subtle)',
            borderLeft: '4px solid var(--brand-navy)',
            borderRadius: '4px',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <span>
            <strong>Monitor-Only Intelligence:</strong> AuRA does not place trades, submit orders, or manage money.
            It evaluates live market depth to filter out false arbitrage opportunities.
          </span>
          <span className="live-pill font-mono" style={{ fontSize: '11px' }}>
            Poll Interval: 15s
          </span>
        </div>

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

            <span className={`live-pill ${overallStatusBadgeClass}`}>
              State: {overallStatusTag}
            </span>
          </div>

          <button
            onClick={() => refreshAll()}
            className="btn-hero-secondary"
            style={{ height: '38px', padding: '0 16px', fontSize: '13px' }}
            disabled={isLoading}
          >
            <span>{isLoading ? 'Polling Feed...' : 'Refresh Quotes'}</span>
          </button>
        </div>

        {/* Main Decision Card */}
        <div
          style={{
            backgroundColor: hasFlaggedPair ? 'var(--semantic-crimson-bg)' : '#FFFFFF',
            border: `1px solid ${hasFlaggedPair ? 'var(--semantic-crimson-border)' : 'var(--border-subtle)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: hasFlaggedPair ? 'var(--semantic-crimson)' : 'var(--text-muted)' }}>
              Current Gate Decision
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 800, color: hasFlaggedPair ? 'var(--semantic-crimson)' : 'var(--brand-navy)', marginTop: '4px' }}>
              {mainDecision}
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '6px', maxWidth: '720px' }}>
              {mainReason}
            </p>
          </div>

          <div
            style={{
              padding: '12px 20px',
              backgroundColor: 'var(--bg-surface-subtle)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              textAlign: 'right',
            }}
          >
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Active Cost Hurdle
            </div>
            <div className="font-mono" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--brand-navy)' }}>
              {hurdle.toFixed(1)} bps
            </div>
          </div>
        </div>

        {/* 1. Top-of-Book Contract Quotes Grid */}
        <div style={{ marginBottom: '32px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--brand-navy)', marginBottom: '14px' }}>
            Current Top-of-Book Contract Quotes
          </h4>
          <div className="contracts-grid-4">
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

                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                      Normalised: <strong className="font-mono">₹{c.fine.toFixed(2)}/g</strong>
                    </div>

                    <div className="quote-depth-row">
                      <span>Best Bid: <strong className="font-mono">₹{c.bid ? c.bid.toLocaleString() : '—'}</strong></span>
                      <span>Best Ask: <strong className="font-mono">₹{c.ask ? c.ask.toLocaleString() : '—'}</strong></span>
                    </div>

                    <div className="quote-depth-row" style={{ marginTop: '6px' }}>
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

        {/* 2. Executable Relative-Value Comparison Table */}
        <div className="terminal-panel-card" style={{ marginBottom: '32px' }}>
          <div className="panel-header">
            <div>
              <h4 className="panel-title">Executable Relative-Value Comparison</h4>
              <p className="panel-subtitle">Comparing screen premiums against executable spread-crossing bids and asks</p>
            </div>
            <span className="panel-badge">Dual-Condition Gate</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="terminal-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Contract Pair</th>
                  <th className="num">Screen Premium</th>
                  <th className="num">Cost Hurdle</th>
                  <th className="num">Net Executable Gap</th>
                  <th>Status State</th>
                  <th>Decision Rationale</th>
                </tr>
              </thead>
              <tbody>
                {pairs.length > 0 ? (
                  pairs.map((p, idx) => {
                    const edgeVal = p.exec_gap_bps !== null ? `${p.exec_gap_bps >= 0 ? '+' : ''}${p.exec_gap_bps.toFixed(1)} bps` : 'None';
                    const isFlagged = p.status === 'flagged';
                    const isWatch = p.status === 'watch';
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
                          <span
                            className="live-pill"
                            style={{
                              backgroundColor: isFlagged ? 'var(--semantic-crimson-bg)' : isWatch ? 'var(--semantic-amber-bg)' : 'var(--bg-surface-subtle)',
                              color: isFlagged ? 'var(--semantic-crimson)' : isWatch ? 'var(--semantic-amber)' : 'var(--brand-navy)',
                              border: `1px solid ${isFlagged ? 'var(--semantic-crimson-border)' : isWatch ? 'var(--semantic-amber-border)' : 'var(--border-subtle)'}`,
                              fontWeight: 700,
                              fontSize: '11px',
                            }}
                          >
                            {p.status.toUpperCase()}
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
                    <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      Loading pair comparison telemetry...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Intraday Tick Chart & Interactive Order-Book Depth Ladder Toggle */}
        <div style={{ display: 'grid', gridTemplateColumns: showDepthLadder ? '1fr 1fr' : '1fr', gap: '24px', alignItems: 'start' }}>
          <div className="terminal-panel-card">
            <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h4 className="panel-title">Intraday Premium &amp; Executable Spread (15s Ticks)</h4>
                <p className="panel-subtitle">Tracks intraday premium movements against the 13.1 bps hurdle</p>
              </div>
              <button
                onClick={() => setShowDepthLadder(!showDepthLadder)}
                style={{
                  padding: '6px 14px',
                  backgroundColor: showDepthLadder ? 'var(--brand-navy)' : 'var(--bg-surface-subtle)',
                  color: showDepthLadder ? '#FFFFFF' : 'var(--brand-navy)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {showDepthLadder ? 'Hide 5-Level Depth Ladder' : 'Inspect 5-Level Depth Ladder & Slippage'}
              </button>
            </div>
            <div style={{ height: '320px', padding: '12px' }}>
              <PlotlyTerminalChart
                data={tickChartData}
                options={{
                  yTitle: 'Premium (bps)',
                  showLegend: true,
                  legendOrientation: 'h',
                }}
              />
            </div>
          </div>

          {showDepthLadder && (
            <div>
              <LiveOrderBookLadder />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
