/**
 * AuRA Light Theme — Plotly Chart Theme Engine
 * Adheres strictly to the 5-color design system: Soft alabaster canvas, pure white card,
 * #E2E8F0 gridlines, #0F172A primary headers, and #2563EB primary accent.
 */

declare global {
  interface Window {
    Plotly?: any;
  }
}

export interface TerminalPlotlyOptions {
  yTitle?: string;
  xTitle?: string;
  showLegend?: boolean;
  legendOrientation?: 'h' | 'v';
  yTickSuffix?: string;
  isDateAxis?: boolean;
  shapes?: any[];
  annotations?: any[];
  hovermode?: 'x unified' | 'closest' | 'x' | false;
}

export function applyTerminalPlotlyTheme(customLayout: any = {}, options: TerminalPlotlyOptions = {}): any {
  const baseLayout = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    margin: { l: 56, r: 20, t: 24, b: 36, pad: 4 },
    font: {
      family: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      size: 11,
      color: '#64748B',
    },
    hovermode: options.hovermode ?? 'x unified',
    hoverlabel: {
      bgcolor: '#FFFFFF',
      bordercolor: '#E2E8F0',
      font: {
        family: 'Inter, -apple-system, sans-serif',
        size: 11,
        color: '#0F172A',
      },
      namelength: -1,
    },
    xaxis: {
      color: '#64748B',
      gridcolor: '#F1F5F9',
      gridwidth: 1,
      zerolinecolor: '#E2E8F0',
      zerolinewidth: 1,
      tickfont: {
        family: 'JetBrains Mono, monospace',
        size: 10,
        color: '#64748B',
      },
      linecolor: '#E2E8F0',
      linewidth: 1,
      showspikes: true,
      spikethickness: 1,
      spikedash: 'dot',
      spikecolor: '#2563EB',
      spikemode: 'across',
      title: options.xTitle ? { text: options.xTitle, font: { size: 11, color: '#64748B' } } : undefined,
    },
    yaxis: {
      color: '#64748B',
      gridcolor: '#F1F5F9',
      gridwidth: 1,
      zerolinecolor: '#E2E8F0',
      zerolinewidth: 1,
      tickfont: {
        family: 'JetBrains Mono, monospace',
        size: 10,
        color: '#64748B',
      },
      ticksuffix: options.yTickSuffix ?? '',
      linecolor: '#E2E8F0',
      linewidth: 1,
      title: options.yTitle ? { text: options.yTitle, font: { size: 11, color: '#64748B' } } : undefined,
    },
    showlegend: options.showLegend ?? false,
    legend: {
      orientation: options.legendOrientation ?? 'h',
      x: 0,
      y: 1.14,
      font: {
        family: 'Inter, sans-serif',
        size: 11,
        color: '#64748B',
      },
      bgcolor: 'rgba(0,0,0,0)',
    },
    shapes: options.shapes || [],
    annotations: options.annotations || [],
  };

  return {
    ...baseLayout,
    ...customLayout,
    xaxis: {
      ...baseLayout.xaxis,
      ...(customLayout.xaxis || {}),
    },
    yaxis: {
      ...baseLayout.yaxis,
      ...(customLayout.yaxis || {}),
    },
  };
}

export const terminalPlotlyConfig = {
  responsive: true,
  displayModeBar: false,
  scrollZoom: false,
};
