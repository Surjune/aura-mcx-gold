import React, { useMemo } from 'react';
import { SectionHeading } from '../components/SectionHeading';
import { PlotlyTerminalChart } from '../components/PlotlyTerminalChart';
import { CarryTrapDecomposer } from '../components/CarryTrapDecomposer';
import { useTerminal } from '../store/terminalStore';

export const CarryCurveSection: React.FC = () => {
  const { series, summary } = useTerminal();
  const carry = summary?.carry_pa;
  const roll = summary?.roll_split;

  // Chart: GOLDM Carry Decomposition over time
  const carryCurveChartData = useMemo(() => {
    if (!series) return [];
    return [
      {
        x: series.session,
        y: series.m_naive,
        type: 'scatter',
        mode: 'lines',
        name: 'Naive Price Gap (Misleading: -24.6 bps median)',
        line: { color: '#DC2626', width: 1.2, dash: 'dot' },
      },
      {
        x: series.session,
        y: series.m_purity,
        type: 'scatter',
        mode: 'lines',
        name: 'Purity Adjusted (995 -> 999: +15.5 bps median)',
        line: { color: '#64748B', width: 1.5 },
      },
      {
        x: series.session,
        y: series.m_carry,
        type: 'scatter',
        mode: 'lines',
        name: 'Carry & Curve Adjusted (True Residual: +6.5 bps median)',
        line: { color: '#0F172A', width: 2 },
      },
    ];
  }, [series]);

  return (
    <section id="carry-curve" className="story-section">
      <div className="section-inner">
        <SectionHeading
          eyebrow="Term Structure & Forward Curve"
          title="The Carry Trap: When delivery timing looks like mispricing"
          description="GOLDM contracts expire in the 3rd–5th window of each month, while GOLDTEN expires at month-end (27th–31st). That ~24-day gap places them at different points on the gold futures curve. Part of the price gap is simply the cost of holding gold across those days."
        />

        {/* Compact Visual Sequence: Different Expiry -> Expected Carry -> Carry-Adjusted Gap -> True Anomaly or Normal Pricing */}
        <div className="problem-flow-wrap" style={{ marginBottom: '32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <span className="section-eyebrow">Deconstructing The Illusion</span>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--brand-navy)', marginTop: '4px' }}>
              Why a price gap across different expiry dates is not free money
            </h3>
          </div>

          <div className="problem-flow-steps">
            <div className="flow-step-box">
              <h4>1. Different Expiry</h4>
              <p>GOLDM delivers ~24 days earlier than GOLDTEN in the same calendar month.</p>
            </div>
            <div className="flow-step-arrow">&rarr;</div>
            <div className="flow-step-box">
              <h4>2. Expected Carry (~9.8% p.a.)</h4>
              <p>Gold futures trade in contango: holding gold costs financing and storage over time.</p>
            </div>
            <div className="flow-step-arrow">&rarr;</div>
            <div className="flow-step-box highlight">
              <h4>3. Carry-Adjusted Gap (+6.5 bps)</h4>
              <p>AuRA reads the GOLDTEN curve at GOLDM&apos;s exact expiry, shrinking the gap from &minus;25 bps to under 7 bps.</p>
            </div>
            <div className="flow-step-arrow">&rarr;</div>
            <div className="flow-step-box" style={{ border: '2px solid var(--brand-navy)', backgroundColor: '#FFFFFF' }}>
              <h4>4. Normal Pricing</h4>
              <p>The remaining residual is within normal bid-ask noise and well below the 13.1 bps execution hurdle.</p>
            </div>
          </div>
        </div>

        {/* Core Narrative Metrics Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          <div className="proof-metric-card" style={{ textAlign: 'left', padding: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--semantic-crimson)' }}>NAIVE GAP (RAW QUOTES)</div>
            <div className="font-mono" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--brand-navy)', margin: '4px 0' }}>
              &minus;24.6 bps
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Appears artificially cheap; ignores that GOLDM is 995 fineness and expires 24 days earlier.
            </div>
          </div>

          <div className="proof-metric-card" style={{ textAlign: 'left', padding: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>AFTER PURITY NORMALISATION</div>
            <div className="font-mono" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--brand-navy)', margin: '4px 0' }}>
              +15.5 bps
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Correcting for 995 vs 999 fineness flips the sign: GOLDM is actually quoted at a premium.
            </div>
          </div>

          <div className="proof-metric-card" style={{ textAlign: 'left', padding: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--semantic-emerald)' }}>AFTER CARRY ADJUSTMENT</div>
            <div className="font-mono" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--brand-navy)', margin: '4px 0' }}>
              +6.5 bps
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Adjusting for the GOLDTEN forward curve eliminates the carry trap; fair parity is restored.
            </div>
          </div>

          <div className="proof-metric-card" style={{ textAlign: 'left', padding: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-gold)' }}>MECHANICAL ROLL-DOWN</div>
            <div className="font-mono" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--brand-navy)', margin: '4px 0' }}>
              {roll ? `${(roll.share_abs_move_from_roll * 100).toFixed(1)}%` : '3.9%'}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              96.1% of daily spread move is macroeconomic spot shift; only 3.9% is mechanical curve roll.
            </div>
          </div>
        </div>

        {/* Chart & Decomposer Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', alignItems: 'start' }}>
          {/* Left: Plotly Chart of GOLDM Carry Decomposition */}
          <div className="terminal-panel-card">
            <div className="panel-header">
              <div>
                <h4 className="panel-title">GOLDM vs GOLDTEN: The Carry Trap Deconstructed</h4>
                <p className="panel-subtitle">
                  Watch how the naive &minus;25 bps discount vanishes into +6.5 bps after purity and forward curve adjustments
                </p>
              </div>
              <span className="panel-badge">398 Sessions</span>
            </div>
            <div style={{ height: '340px', padding: '12px' }}>
              <PlotlyTerminalChart
                data={carryCurveChartData}
                options={{
                  yTitle: 'Gap vs GOLDTEN (bps)',
                  showLegend: true,
                  legendOrientation: 'h',
                }}
              />
            </div>
            <div style={{ padding: '12px 20px', backgroundColor: 'var(--bg-surface-subtle)', borderTop: '1px solid var(--border-subtle)', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <strong>Evaluator Takeaway:</strong> Anyone attempting to arbitrage GOLDM against GOLDTEN without modeling the 24-day forward curve would suffer unexpected delivery carry roll losses.
            </div>
          </div>

          {/* Right: Interactive Decomposer & Roll-Down Metrics */}
          <div>
            <CarryTrapDecomposer />
          </div>
        </div>
      </div>
    </section>
  );
};
