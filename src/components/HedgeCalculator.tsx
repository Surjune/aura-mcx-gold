import React, { useState } from 'react';
import { TerminalPanel } from './TerminalPanel';

interface HedgeTemplate {
  name: string;
  type: 'Same-Expiry' | 'Cross-Expiry Carry-Adj';
  legA: { symbol: string; gramsPerLot: number; multiplier: number };
  legB: { symbol: string; gramsPerLot: number; multiplier: number };
  desc: string;
}

const HEDGE_TEMPLATES: HedgeTemplate[] = [
  {
    name: 'GOLDTEN vs GOLDPETAL',
    type: 'Same-Expiry',
    legA: { symbol: 'GOLDTEN', gramsPerLot: 10, multiplier: 1 },
    legB: { symbol: 'GOLDPETAL', gramsPerLot: 1, multiplier: 10 },
    desc: '10g parity: 1 lot GOLDTEN vs 10 lots GOLDPETAL',
  },
  {
    name: 'GOLDTEN vs GOLDGUINEA',
    type: 'Same-Expiry',
    legA: { symbol: 'GOLDTEN', gramsPerLot: 10, multiplier: 4 },
    legB: { symbol: 'GOLDGUINEA', gramsPerLot: 8, multiplier: 5 },
    desc: '40g parity: 4 lots GOLDTEN (40g) vs 5 lots GOLDGUINEA (40g)',
  },
  {
    name: 'GOLDM vs GOLDGUINEA',
    type: 'Cross-Expiry Carry-Adj',
    legA: { symbol: 'GOLDM', gramsPerLot: 100, multiplier: 2 },
    legB: { symbol: 'GOLDGUINEA', gramsPerLot: 8, multiplier: 25 },
    desc: '200g parity: 2 lots GOLDM (200g) vs 25 lots GOLDGUINEA (200g)',
  },
  {
    name: 'GOLDM vs GOLDTEN',
    type: 'Cross-Expiry Carry-Adj',
    legA: { symbol: 'GOLDM', gramsPerLot: 100, multiplier: 1 },
    legB: { symbol: 'GOLDTEN', gramsPerLot: 10, multiplier: 10 },
    desc: '100g parity: 1 lot GOLDM (100g) vs 10 lots GOLDTEN (100g)',
  },
];

export const HedgeCalculator: React.FC = () => {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [multiplierInput, setMultiplierInput] = useState<number>(1);

  const activeTemplate = HEDGE_TEMPLATES[selectedIdx];
  const lotsA = activeTemplate.legA.multiplier * multiplierInput;
  const lotsB = activeTemplate.legB.multiplier * multiplierInput;
  const totalGramsA = lotsA * activeTemplate.legA.gramsPerLot;
  const totalGramsB = lotsB * activeTemplate.legB.gramsPerLot;

  return (
    <TerminalPanel
      title="Beta-Neutral Hedge Calculator"
      badge="Gold Beta ≈ 0.00"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="terminal-callout cyan" style={{ margin: 0 }}>
          <div style={{ fontWeight: 600, color: 'var(--accent-primary)', fontSize: '13px' }}>
            Integer Grams Parity
          </div>
          <div style={{ fontSize: '12px', marginTop: '4px', color: 'var(--text-secondary)' }}>
            MCX futures contracts trade in discrete integer lots. Whole-lot ratios neutralise
            directional gold spot price movements to achieve zero spot beta.
          </div>
        </div>

        {/* Template Selector */}
        <div>
          <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>
            Hedge Structure
          </label>
          <select
            className="terminal-input"
            value={selectedIdx}
            onChange={(e) => setSelectedIdx(Number(e.target.value))}
            style={{ marginTop: '4px' }}
          >
            {HEDGE_TEMPLATES.map((tmpl, idx) => (
              <option key={idx} value={idx}>
                [{tmpl.type}] {tmpl.name}
              </option>
            ))}
          </select>
        </div>

        {/* Scale Multiplier */}
        <div>
          <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>
            Scale Multiplier (&times; Base Ratio)
          </label>
          <input
            type="number"
            min={1}
            max={100}
            className="terminal-input"
            value={multiplierInput}
            onChange={(e) => setMultiplierInput(Math.max(1, parseInt(e.target.value || '1', 10)))}
            style={{ marginTop: '4px' }}
          />
        </div>

        {/* Computed Legs Breakdown */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
          }}
        >
          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
            }}
          >
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              LEG A (LONG/SHORT)
            </div>
            <div className="font-mono" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-primary)', marginTop: '2px' }}>
              {lotsA} Lots
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {activeTemplate.legA.symbol} ({totalGramsA}g)
            </div>
          </div>

          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
            }}
          >
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              LEG B (OPPOSITE)
            </div>
            <div className="font-mono" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
              {lotsB} Lots
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {activeTemplate.legB.symbol} ({totalGramsB}g)
            </div>
          </div>
        </div>

        {/* Parity Status Footer */}
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--accent-tint)',
            border: '1px solid rgba(37, 99, 235, 0.2)',
            borderRadius: '6px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
          }}
        >
          <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
            Net Mass Exposure:
          </span>
          <span className="font-mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
            {totalGramsA}g vs {totalGramsB}g &bull; Delta: 0g (Balanced)
          </span>
        </div>
      </div>
    </TerminalPanel>
  );
};
