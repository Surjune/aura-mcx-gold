import React, { useState } from 'react';
import { TerminalPanel } from './TerminalPanel';
import { ContractSpec } from '../types/aura';

const SPECS: ContractSpec[] = [
  { symbol: 'GOLDM', lot_g: 100, quote_g: 10, purity: 0.995, expiry_window: '3rd-5th', description: 'Mini contract, 995 purity, early-month expiry' },
  { symbol: 'GOLDTEN', lot_g: 10, quote_g: 10, purity: 0.999, expiry_window: '27th-31st', description: 'Benchmark leg, 999 purity, month-end delivery' },
  { symbol: 'GOLDGUINEA', lot_g: 8, quote_g: 8, purity: 0.999, expiry_window: '27th-31st', description: 'Sovereign 8g equivalent, 999 purity' },
  { symbol: 'GOLDPETAL', lot_g: 1, quote_g: 1, purity: 0.999, expiry_window: '27th-31st', description: 'Micro 1g retail contract, structural premium' },
];

export const NormalisationMatrix: React.FC = () => {
  const [testSymbol, setTestSymbol] = useState<'GOLDM' | 'GOLDTEN' | 'GOLDGUINEA' | 'GOLDPETAL'>('GOLDTEN');
  const [testPrice, setTestPrice] = useState<number>(145360);

  const selectedSpec = SPECS.find((s) => s.symbol === testSymbol)!;
  const finePerGram = testPrice / selectedSpec.quote_g / selectedSpec.purity;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Contract Spec Matrix */}
      <TerminalPanel title="Contract Spec Matrix" badge="MCX Rules">
        <div style={{ overflowX: 'auto' }}>
          <table className="terminal-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th className="num">Lot (g)</th>
                <th className="num">Quote (g)</th>
                <th className="num">Purity</th>
                <th>Expiry Window</th>
              </tr>
            </thead>
            <tbody>
              {SPECS.map((spec) => (
                <tr key={spec.symbol}>
                  <td style={{ fontWeight: 600, color: spec.symbol === 'GOLDTEN' ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                    {spec.symbol}
                  </td>
                  <td className="num">{spec.lot_g}g</td>
                  <td className="num">{spec.quote_g}g</td>
                  <td className="num font-mono">{(spec.purity * 1000).toFixed(0)} ({spec.purity})</td>
                  <td className="font-mono" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{spec.expiry_window}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TerminalPanel>

      {/* Interactive Formula Inspector */}
      <TerminalPanel title="Formula Inspector" badge="₹/g Fine Normaliser">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="terminal-callout cyan" style={{ margin: 0 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-primary)', fontSize: '13px' }}>
              ₹/g fine = Quoted Price &divide; Quote Grams &divide; Purity
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Maps disparate lot sizes and 995 vs 999 fineness into true pure-gold parity.
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                Select Contract
              </label>
              <select
                className="terminal-input"
                value={testSymbol}
                onChange={(e) => setTestSymbol(e.target.value as any)}
                style={{ marginTop: '4px' }}
              >
                <option value="GOLDM">GOLDM (10g quote, 0.995)</option>
                <option value="GOLDTEN">GOLDTEN (10g quote, 0.999)</option>
                <option value="GOLDGUINEA">GOLDGUINEA (8g quote, 0.999)</option>
                <option value="GOLDPETAL">GOLDPETAL (1g quote, 0.999)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                Quoted Price (₹)
              </label>
              <input
                type="number"
                className="terminal-input"
                value={testPrice}
                onChange={(e) => setTestPrice(Number(e.target.value))}
                style={{ marginTop: '4px' }}
              />
            </div>
          </div>

          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--accent-tint)',
              border: '1px solid rgba(37, 99, 235, 0.2)',
              borderRadius: '6px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                Step Decomposition
              </div>
              <div className="font-mono" style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '2px' }}>
                ₹{testPrice.toLocaleString()} &divide; {selectedSpec.quote_g}g &divide; {selectedSpec.purity}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                Normalised Fine Price
              </div>
              <div className="font-mono" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-primary)' }}>
                ₹{finePerGram.toFixed(2)}/g
              </div>
            </div>
          </div>
        </div>
      </TerminalPanel>
    </div>
  );
};
