import React, { useMemo } from 'react';
import { TerminalPanel } from '../components/TerminalPanel';
import { NormalisationMatrix } from '../components/NormalisationMatrix';
import { SignalGate } from '../components/SignalGate';
import { HedgeCalculator } from '../components/HedgeCalculator';
import { PlotlyTerminalChart } from '../components/PlotlyTerminalChart';
import { useTerminal } from '../store/terminalStore';

export const SpreadMatrixWorkspace: React.FC = () => {
  const { series, summary } = useTerminal();
  const hurdle = summary?.hurdle_bps ?? 13.0762;

  // Chart 1: Normalised Fine Gold Price (₹/g)
  const normalisedPriceChartData = useMemo(() => {
    if (!series) return [];
    return [
      {
        x: series.session,
        y: series.ten_fine,
        type: 'scatter',
        mode: 'lines',
        name: 'GOLDTEN (Benchmark)',
        line: { color: '#2563EB', width: 2 },
      },
      {
        x: series.session,
        y: series.petal_fine,
        type: 'scatter',
        mode: 'lines',
        name: 'GOLDPETAL',
        line: { color: '#0F172A', width: 1.5 },
      },
      {
        x: series.session,
        y: series.guinea_fine,
        type: 'scatter',
        mode: 'lines',
        name: 'GOLDGUINEA',
        line: { color: '#64748B', width: 1.5 },
      },
      {
        x: series.session,
        y: series.m_fine,
        type: 'scatter',
        mode: 'lines',
        name: 'GOLDM',
        line: { color: '#94A3B8', width: 1.2, dash: 'dot' },
      },
    ];
  }, [series]);

  // Chart 2: Same-Expiry Premium vs GOLDTEN (bps)
  const premiumSpreadChartData = useMemo(() => {
    if (!series) return [];
    return [
      {
        x: series.session,
        y: series.prem_petal,
        type: 'scatter',
        mode: 'lines',
        name: 'GOLDPETAL vs GOLDTEN',
        line: { color: '#2563EB', width: 1.8 },
      },
      {
        x: series.session,
        y: series.prem_guinea,
        type: 'scatter',
        mode: 'lines',
        name: 'GOLDGUINEA vs GOLDTEN',
        line: { color: '#64748B', width: 1.5 },
      },
      {
        x: [series.session[0], series.session[series.session.length - 1]],
        y: [hurdle, hurdle],
        type: 'scatter',
        mode: 'lines',
        name: `Cost Hurdle (+${hurdle.toFixed(1)} bps)`,
        line: { color: '#DC2626', width: 1.2, dash: 'dash' },
      },
      {
        x: [series.session[0], series.session[series.session.length - 1]],
        y: [-hurdle, -hurdle],
        type: 'scatter',
        mode: 'lines',
        name: `Cost Hurdle (-${hurdle.toFixed(1)} bps)`,
        line: { color: '#DC2626', width: 1.2, dash: 'dash' },
      },
    ];
  }, [series, hurdle]);

  return (
    <div className="workspace-container">
      <div className="grid-12">
        {/* Left Rail (4 cols): Contract Specs & Formula Inspector */}
        <div className="col-4" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <NormalisationMatrix />
        </div>

        {/* Center Canvas (5 cols): Normalised & Spread Charts */}
        <div className="col-5" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Top Chart: Normalised Price (₹/g fine) */}
          <TerminalPanel
            title="Normalised Price (₹/g Fine Gold)"
            badge="Pure Parity"
            style={{ height: '360px' }}
            noPadding
          >
            <div style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
              Normalised across all contract specifications to grams of pure gold.
            </div>
            <div style={{ height: 'calc(100% - 41px)' }}>
              <PlotlyTerminalChart
                data={normalisedPriceChartData}
                options={{
                  yTitle: '₹ / gram',
                  showLegend: true,
                }}
              />
            </div>
          </TerminalPanel>

          {/* Bottom Chart: Same-Expiry Premium vs GOLDTEN (bps) */}
          <TerminalPanel
            title="Same-Expiry Premium vs GOLDTEN (bps)"
            badge={`13.0 bps Hurdle`}
            style={{ height: '360px' }}
            noPadding
          >
            <div style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
              <strong>GOLDPETAL</strong> maintains a structural retail premium (+69 bps median). Mean-reversion requires exceeding the 13.0 bps cost hurdle.
            </div>
            <div style={{ height: 'calc(100% - 41px)' }}>
              <PlotlyTerminalChart
                data={premiumSpreadChartData}
                options={{
                  yTitle: 'Basis Points (bps)',
                  showLegend: true,
                  yTickSuffix: ' bps',
                }}
              />
            </div>
          </TerminalPanel>
        </div>

        {/* Right Rail (3 cols): Signal Gate & Whole-Lot Hedge Calculator */}
        <div className="col-3" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <SignalGate />
          <HedgeCalculator />
        </div>
      </div>
    </div>
  );
};
