/**
 * AuRA Archival Index Theme — Plotly Chart Theme Engine
 * Adheres strictly to the Warm Paper & Carbon design system:
 * Warm Alabaster (#F7F6F2) canvas, crisp #E2E0D8 hairline grids,
 * Obsidian (#141413) text, Stone (#6E6D68) metadata, and International Orange (#FF4F00) accents.
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
    margin: { l: 56, r: 16, t: 24, b: 36, pad: 4 },
    font: {
      family: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      size: 11,
      color: '#6E6D68',
    },
    hovermode: options.hovermode ?? 'x unified',
    hoverlabel: {
      bgcolor: '#FFFFFF',
      bordercolor: '#141413',
      font: {
        family: '"JetBrains Mono", monospace',
        size: 11,
        color: '#141413',
      },
      namelength: -1,
    },
    xaxis: {
      color: '#6E6D68',
      gridcolor: '#EAE8E0',
      gridwidth: 1,
      zerolinecolor: '#D8D5CC',
      zerolinewidth: 1,
      tickfont: {
        family: '"JetBrains Mono", monospace',
        size: 10,
        color: '#6E6D68',
      },
      linecolor: '#D8D5CC',
      linewidth: 1,
      showspikes: true,
      spikethickness: 1,
      spikedash: 'dot',
      spikecolor: '#141413',
      spikemode: 'across',
      title: options.xTitle ? { text: options.xTitle, font: { size: 11, color: '#6E6D68' } } : undefined,
    },
    yaxis: {
      color: '#6E6D68',
      gridcolor: '#EAE8E0',
      gridwidth: 1,
      zerolinecolor: '#D8D5CC',
      zerolinewidth: 1,
      tickfont: {
        family: '"JetBrains Mono", monospace',
        size: 10,
        color: '#6E6D68',
      },
      ticksuffix: options.yTickSuffix ?? '',
      linecolor: '#D8D5CC',
      linewidth: 1,
      title: options.yTitle ? { text: options.yTitle, font: { size: 11, color: '#6E6D68' } } : undefined,
    },
    showlegend: options.showLegend ?? false,
    legend: {
      orientation: options.legendOrientation ?? 'h',
      x: 0,
      y: 1.15,
      font: {
        family: '"Plus Jakarta Sans", sans-serif',
        size: 11,
        color: '#6E6D68',
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
