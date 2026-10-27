import React, { useMemo } from 'react';
import { TerminalPanel } from '../components/TerminalPanel';
import { CarryTrapDecomposer } from '../components/CarryTrapDecomposer';
import { PlotlyTerminalChart } from '../components/PlotlyTerminalChart';
import { useTerminal } from '../store/terminalStore';

export const CarryTrapWorkspace: React.FC = () => {
  const { series, traceFilter, setTraceFilter } = useTerminal();

  // Filter traces based on typed state buttons
  const chartData = useMemo(() => {
    if (!series) return [];

    const traceNaive = {
      x: series.session,
      y: series.m_naive,
      type: 'scatter',
      mode: 'lines',
      name: '1. Naive Gap (Untransformed)',
      line: { color: '#94A3B8', width: 1.5, dash: 'dot' },
    };

    const tracePurity = {
      x: series.session,
      y: series.m_purity,
      type: 'scatter',
      mode: 'lines',
      name: '2. Purity Adjusted (995->999)',
      line: { color: '#0F172A', width: 1.5 },
    };

    const traceCarry = {
      x: series.session,
      y: series.m_carry,
      type: 'scatter',
      mode: 'lines',
      name: '3. Purity + Curve Carry Adjusted',
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

  // Bottom Chart: Annualised Cost of Carry (% p.a.)
  const carryRateChartData = useMemo(() => {
    if (!series) return [];
    return [
      {
        x: series.session,
        y: series.carry_pa,
        type: 'scatter',
        mode: 'lines',
        name: 'Implied Contango Carry Rate (% p.a.)',
        line: { color: '#2563EB', width: 1.8 },
      },
    ];
  }, [series]);

  return (
    <div className="workspace-container">
      <div className="grid-12">
        {/* Left Column (7 cols): Main Carry Trap Decomposition Plotly Chart */}
        <div className="col-7" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <TerminalPanel
            title="GOLDM vs GOLDTEN Carry Trap Decomposition"
            badge="Multi-Stage Adjustment"
            controls={
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  className={`btn-terminal ${traceFilter === 'ALL' ? 'active' : ''}`}
                  onClick={() => setTraceFilter('ALL')}
                >
                  All Traces
                </button>
                <button
                  className={`btn-terminal ${traceFilter === 'NAIVE' ? 'active' : ''}`}
                  onClick={() => setTraceFilter('NAIVE')}
                >
                  1. Naive
                </button>
                <button
                  className={`btn-terminal ${traceFilter === 'PURITY' ? 'active' : ''}`}
                  onClick={() => setTraceFilter('PURITY')}
                >
                  2. Purity
                </button>
                <button
                  className={`btn-terminal ${traceFilter === 'CARRY' ? 'active' : ''}`}
                  onClick={() => setTraceFilter('CARRY')}
                >
                  3. Purity + Carry
                </button>
              </div>
            }
            style={{ height: '420px' }}
            noPadding
          >
            <div style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
              Watch how the naive discount (&minus;25 bps, gray dotted) shifts up to +40 bps after purity adjustment, and settles at +7.1 bps after interpolation along the ~24-day GOLDTEN term structure.
            </div>
            <div style={{ height: 'calc(100% - 41px)' }}>
              <PlotlyTerminalChart
                data={chartData}
                options={{
                  yTitle: 'Gap (Basis Points)',
                  showLegend: true,
                  yTickSuffix: ' bps',
                }}
              />
            </div>
          </TerminalPanel>

          {/* Bottom Chart: Implied Annualised Carry Rate */}
          <TerminalPanel
            title="Implied GOLDTEN Term-Structure Contango Carry (% p.a.)"
            badge="Annualised Slope"
            style={{ height: '300px' }}
            noPadding
          >
            <div style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
              Annualised slope between GOLDTEN front and next contract expiries: median carry is <strong>9.77% p.a.</strong>
            </div>
            <div style={{ height: 'calc(100% - 41px)' }}>
              <PlotlyTerminalChart
                data={carryRateChartData}
                options={{
                  yTitle: '% per annum',
                  showLegend: true,
                  yTickSuffix: '%',
                }}
              />
            </div>
          </TerminalPanel>
        </div>

        {/* Right Column (5 cols): Explainer & Quantitative Metrics */}
        <div className="col-5" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <CarryTrapDecomposer />
        </div>
      </div>
    </div>
  );
};
