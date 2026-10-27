import React, { useMemo } from 'react';
import { TerminalPanel } from '../components/TerminalPanel';
import { LiveOrderBookLadder } from '../components/LiveOrderBookLadder';
import { McxDataHygieneAuditor } from '../components/DataHygieneAuditor';
import { PlotlyTerminalChart } from '../components/PlotlyTerminalChart';
import { useTerminal } from '../store/terminalStore';

export const LiveOrderBookWorkspace: React.FC = () => {
  const { live } = useTerminal();
  const ticks = live?.ticks ?? [];

  // Live session ticks chart
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
        line: { color: '#2563EB', width: 1.8 },
      },
      {
        x: times,
        y: ticks.map((t) => t.p1),
        type: 'scatter',
        mode: 'lines',
        name: 'GOLDGUINEA Premium (bps)',
        line: { color: '#64748B', width: 1.5 },
      },
      {
        x: times,
        y: ticks.map((t) => t.e0),
        type: 'scatter',
        mode: 'lines',
        name: 'Executable Sell Threshold (bps)',
        line: { color: '#0F172A', width: 1.2, dash: 'dot' },
      },
    ];
  }, [ticks]);

  return (
    <div className="workspace-container">
      <div className="grid-12">
        {/* Left Column (6 cols): 5-Level Ladder & Slippage Simulator */}
        <div className="col-6" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <LiveOrderBookLadder />

          {/* Intraday 15s Ticks Premium Monitor */}
          <TerminalPanel
            title="Intraday 15-Second Spread Monitor"
            badge={`${ticks.length} Real Ticks Recorded`}
            style={{ height: '280px' }}
            noPadding
          >
            <div style={{ height: '100%' }}>
              <PlotlyTerminalChart
                data={tickChartData}
                options={{
                  yTitle: 'Premium (bps)',
                  showLegend: true,
                  yTickSuffix: ' bps',
                }}
              />
            </div>
          </TerminalPanel>
        </div>

        {/* Right Column (6 cols): 6 Data Safeguards Auditor */}
        <div className="col-6" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <McxDataHygieneAuditor />
        </div>
      </div>
    </div>
  );
};
