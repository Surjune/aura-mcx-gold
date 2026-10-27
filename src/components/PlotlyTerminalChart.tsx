import React, { useEffect, useRef } from 'react';
import { applyTerminalPlotlyTheme, terminalPlotlyConfig, TerminalPlotlyOptions } from '../utils/plotlyTheme';

interface PlotlyTerminalChartProps {
  data: any[];
  layout?: any;
  options?: TerminalPlotlyOptions;
  style?: React.CSSProperties;
  className?: string;
}

export const PlotlyTerminalChart: React.FC<PlotlyTerminalChartProps> = ({
  data,
  layout = {},
  options = {},
  style,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<boolean>(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const themedLayout = applyTerminalPlotlyTheme(layout, options);

    const renderChart = () => {
      if (!window.Plotly) {
        // Retry if script is still loading
        setTimeout(renderChart, 50);
        return;
      }

      window.Plotly.react(el, data, themedLayout, terminalPlotlyConfig);
      chartInstanceRef.current = true;
    };

    renderChart();

    // Auto-responsiveness via ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      if (el && window.Plotly && chartInstanceRef.current) {
        window.Plotly.Plots.resize(el);
      }
    });

    resizeObserver.observe(el);

    return () => {
      resizeObserver.disconnect();
      if (el && window.Plotly && chartInstanceRef.current) {
        window.Plotly.purge(el);
      }
    };
  }, [data, layout, options]);

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
