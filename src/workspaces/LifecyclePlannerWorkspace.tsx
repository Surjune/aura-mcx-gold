import React, { useMemo } from 'react';
import { TerminalPanel } from '../components/TerminalPanel';
import { LifecycleSwimlane } from '../components/LifecycleSwimlane';
import { PlotlyTerminalChart } from '../components/PlotlyTerminalChart';
import { useTerminal } from '../store/terminalStore';

export const LifecyclePlannerWorkspace: React.FC = () => {
  const { contracts } = useTerminal();

  // Timeline Traces for GOLDTEN expiries
  const timelineChartData = useMemo(() => {
    if (!contracts) return [];

    const tenContracts = contracts
      .filter((c) => c.symbol === 'GOLDTEN')
      .slice(-10);

    const expiries = tenContracts.map((c) => c.expiry);
    const oiValues = tenContracts.map((c) => c.peak_oi_lots);
    const sessionsToLiquid = tenContracts.map((c) => c.sessions_to_liquid);

    return [
      {
        x: expiries,
        y: oiValues,
        type: 'bar',
        name: 'Peak Open Interest (Lots)',
        marker: { color: '#2563EB' },
        yaxis: 'y',
      },
      {
        x: expiries,
        y: sessionsToLiquid,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Sessions to Reach 50% OI',
        marker: { color: '#0F172A', size: 6 },
        line: { color: '#0F172A', width: 2 },
        yaxis: 'y2',
      },
    ];
  }, [contracts]);

  const timelineLayout = useMemo(() => {
    return {
      yaxis: {
        title: { text: 'Peak OI (Lots)', font: { size: 11, color: '#2563EB' } },
        tickfont: { color: '#2563EB' },
      },
      yaxis2: {
        title: { text: 'Sessions to Liquid', font: { size: 11, color: '#0F172A' } },
        tickfont: { color: '#0F172A' },
        overlaying: 'y',
        side: 'right',
        gridcolor: 'rgba(0,0,0,0)',
      },
    };
  }, []);

  return (
    <div className="workspace-container">
      <div className="grid-12">
        {/* Left Column (6 cols): Lifecycle Chart & Peak OI Timeline */}
        <div className="col-6">
          <TerminalPanel
            title="Discrete Expiry OI Ramp-Up & Liquidity"
            badge="No Continuous Stitching"
            style={{ height: '560px' }}
            noPadding
          >
            <div style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
              Each bar represents an unstitched discrete delivery date. Continuous near-month stitching is prohibited because roll dates produce phantom price dislocations.
            </div>
            <div style={{ height: 'calc(100% - 41px)' }}>
              <PlotlyTerminalChart
                data={timelineChartData}
                layout={timelineLayout}
                options={{
                  showLegend: true,
                }}
              />
            </div>
          </TerminalPanel>
        </div>

        {/* Right Column (6 cols): Rules and Contract Phase Ledger */}
        <div className="col-6">
          <LifecycleSwimlane />
        </div>
      </div>
    </div>
  );
};
