import React, { useEffect, useMemo, useRef } from 'react';
import { applyTerminalPlotlyTheme, terminalPlotlyConfig, TerminalPlotlyOptions } from '../utils/plotlyTheme';

interface PlotlyTerminalChartProps {
  data: any[];
  layout?: any;
  options?: TerminalPlotlyOptions;
  style?: React.CSSProperties;
  className?: string;
}

const PLOTLY_POLL_MS = 50;

export const PlotlyTerminalChart: React.FC<PlotlyTerminalChartProps> = ({
  data,
  layout = {},
  options = {},
  style,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<boolean>(false);

  // Callers pass literal objects, so compare by value: otherwise every parent re-render
  // (e.g. each 15 s live poll) would purge and redraw every chart on the page.
  const layoutKey = JSON.stringify(layout);
  const optionsKey = JSON.stringify(options);
  const themedLayout = useMemo(
    () => applyTerminalPlotlyTheme(JSON.parse(layoutKey), JSON.parse(optionsKey)),
    [layoutKey, optionsKey]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let cancelled = false;
    let retryTimer: number | undefined;
    const renderChart = () => {
      if (cancelled) return;
      if (!window.Plotly) {
        // Plotly loads with `defer`, so it can arrive after React's first render.
        retryTimer = window.setTimeout(renderChart, PLOTLY_POLL_MS);
        return;
      }
      window.Plotly.react(el, data, themedLayout, terminalPlotlyConfig);
      chartInstanceRef.current = true;
    };

    renderChart();

    const resizeObserver = new ResizeObserver(() => {
      if (window.Plotly && chartInstanceRef.current) {
        window.Plotly.Plots.resize(el);
      }
    });
    resizeObserver.observe(el);

    return () => {
      cancelled = true;
      window.clearTimeout(retryTimer);
      resizeObserver.disconnect();
    };
  }, [data, themedLayout]);

  useEffect(() => {
    const el = containerRef.current;
    return () => {
      if (el && window.Plotly && chartInstanceRef.current) {
        window.Plotly.purge(el);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`plotly-terminal-container ${className}`}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '180px',
        ...style,
      }}
    />
  );
};
