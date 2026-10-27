import React, { useMemo } from 'react';
import { TerminalPanel } from '../components/TerminalPanel';
import { WalkForwardLab } from '../components/WalkForwardLab';
import { PlotlyTerminalChart } from '../components/PlotlyTerminalChart';
import { useTerminal } from '../store/terminalStore';

export const WalkForwardLabWorkspace: React.FC = () => {
  const { series, backtest } = useTerminal();
  const petalTrades = backtest?.trades?.['GOLDPETAL'] ?? [];
  const holdoutDate = '2026-04-20';

  // Cumulative Equity Plotly Chart
  const equityChartData = useMemo(() => {
    if (!series || !series.equity?.GOLDPETAL) return [];
    return [
      {
        x: series.session,
        y: series.equity.GOLDPETAL,
        type: 'scatter',
        mode: 'lines',
        name: 'Cumulative Net P&L (₹)',
        line: { color: '#2563EB', width: 2 },
        fill: 'tozeroy',
        fillcolor: 'rgba(37, 99, 235, 0.05)',
      },
    ];
  }, [series]);

  // Chart Layout with Holdout Boundary Shape & Annotation
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
          text: 'HOLDOUT BOUNDARY (20-APR-2026)',
          showarrow: true,
          arrowhead: 2,
          arrowcolor: '#DC2626',
          ax: 80,
          ay: -15,
          font: {
            family: 'Inter, sans-serif',
            size: 10,
            color: '#DC2626',
          },
          bgcolor: '#FFFFFF',
          bordercolor: '#E2E8F0',
        },
        {
          x: '2026-01-30',
          y: 0.55,
          yref: 'paper',
          text: '30-JAN CRASH OUTLIER (+₹33,970)',
          showarrow: true,
          arrowhead: 2,
          arrowcolor: '#2563EB',
          ax: -60,
          ay: -25,
          font: {
            family: 'Inter, sans-serif',
            size: 10,
            color: '#2563EB',
          },
          bgcolor: '#FFFFFF',
          bordercolor: '#E2E8F0',
        },
      ],
    };
  }, [holdoutDate]);

  return (
    <div className="workspace-container">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Top 6-cell Matrix & Outlier Auditor */}
        <WalkForwardLab />

        {/* 2-Column Grid for Equity Chart and Trade Log */}
        <div className="grid-12">
          {/* Cumulative Equity Curve (7 cols) */}
          <div className="col-7">
            <TerminalPanel
              title="Cumulative Net P&L with OOS Holdout Boundary"
              badge="Net of 13.0 bps Friction"
              style={{ height: '400px' }}
              noPadding
            >
              <div style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
                Notice the sharp jump on 30-Jan-2026, followed by complete stagnation in the untouched holdout window.
              </div>
              <div style={{ height: 'calc(100% - 41px)' }}>
                <PlotlyTerminalChart
                  data={equityChartData}
                  layout={equityChartLayout}
                  options={{
                    yTitle: 'Net P&L (₹)',
                    yTickSuffix: ' ₹',
                  }}
                />
              </div>
            </TerminalPanel>
          </div>

          {/* Trade Execution Ledger (5 cols) */}
          <div className="col-5">
            <TerminalPanel
              title="Walk-Forward Trade Ledger"
              badge={`${petalTrades.length} Trades`}
              style={{ height: '400px' }}
              contentClassName="no-pad"
            >
              <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                <table className="terminal-table">
                  <thead>
                    <tr>
                      <th>Entry &rarr; Exit</th>
                      <th>Side</th>
                      <th className="num">Days</th>
                      <th className="num">Net (₹)</th>
                      <th>Window</th>
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
                            backgroundColor: isOutlier ? 'var(--accent-tint)' : undefined,
                          }}
                        >
                          <td className="font-mono" style={{ fontSize: '12px' }}>
                            <span style={{ color: isOutlier ? 'var(--accent-primary)' : 'var(--text-primary)', fontWeight: isOutlier ? 600 : 400 }}>
                              {t.entry} &rarr; {t.exit}
                            </span>
                          </td>
                          <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {t.side}
                          </td>
                          <td className="num font-mono">{t.held}d</td>
                          <td
                            className="num font-mono"
                            style={{
                              color: 'var(--text-primary)',
                              fontWeight: 600,
                            }}
                          >
                            {t.net >= 0 ? '+' : ''}₹{Math.round(t.net).toLocaleString()}
                          </td>
                          <td>
                            <span
                              className="gate-badge quiet"
                              style={{
                                fontSize: '10px',
                                padding: '2px 6px',
                                backgroundColor: isHoldout ? 'var(--accent-tint)' : 'var(--bg-surface-subtle)',
                                color: isHoldout ? 'var(--accent-primary)' : 'var(--text-secondary)',
                              }}
                            >
                              {isHoldout ? 'HOLDOUT' : 'DEV'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </TerminalPanel>
          </div>
        </div>
      </div>
    </div>
  );
};
