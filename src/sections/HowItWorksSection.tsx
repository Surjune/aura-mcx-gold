import React, { useState } from 'react';
import { SectionHeading } from '../components/SectionHeading';
import { HedgeCalculator } from '../components/HedgeCalculator';

export const HowItWorksSection: React.FC = () => {
  const [showFormula, setShowFormula] = useState(false);
  const [calcSymbol, setCalcSymbol] = useState<'GOLDM' | 'GOLDTEN' | 'GOLDGUINEA' | 'GOLDPETAL'>('GOLDTEN');
  const [calcPrice, setCalcPrice] = useState<number>(145360);

  const specs = {
    GOLDM: { quote: 10, purity: 0.995, label: '10g quote, 0.995 fineness' },
    GOLDTEN: { quote: 10, purity: 0.999, label: '10g quote, 0.999 pure' },
    GOLDGUINEA: { quote: 8, purity: 0.999, label: '8g quote, 0.999 pure' },
    GOLDPETAL: { quote: 1, purity: 0.999, label: '1g quote, 0.999 pure' },
  };

  const selected = specs[calcSymbol];
  const finePrice = calcPrice / selected.quote / selected.purity;

  return (
    <section id="how-it-works" className="story-section">
      <div className="section-inner">
        <SectionHeading
          eyebrow="The Solution"
          title="How AuRA normalises and evaluates every price difference"
          description="AuRA strips away the illusions caused by differing quote units, fineness, and delivery dates before testing whether any executable edge exists."
        />

        {/* 4-Step Visual Workflow */}
        <div className="workflow-grid-4">
          <div className="workflow-card">
            <div className="step-number-badge">1</div>
            <h3>Ingest MCX Data</h3>
            <p>AuRA reads official daily bhavcopy records across 716 sessions alongside live 5-level quote snapshots.</p>
          </div>

          <div className="workflow-card">
            <div className="step-number-badge">2</div>
            <h3>Normalise Contracts</h3>
            <p>It converts every contract into ₹ per gram of fine gold, mapping all four contracts to true physical parity.</p>
          </div>

          <div className="workflow-card">
            <div className="step-number-badge">3</div>
            <h3>Explain the Difference</h3>
            <p>It separates purity, expiry timing, and normal term-structure carry from a possible true price anomaly.</p>
          </div>

          <div className="workflow-card">
            <div className="step-number-badge">4</div>
            <h3>Test Real Execution</h3>
            <p>It tests whole-lot hedges after brokerage, exchange fees, slippage, and out-of-sample holdout validation.</p>
          </div>
        </div>

        {/* Compact Plain-Language Formula Card */}
        <div className="formula-banner-card" style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div className="formula-plain-text">
              <span
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                }}
              >
                &sum;
              </span>
              <span>
                Fair comparison = Price adjusted for quote size, purity, and delivery timing.
              </span>
            </div>

            <button
              onClick={() => setShowFormula(!showFormula)}
              className="details-summary-btn"
            >
              <span>{showFormula ? 'Hide technical formula' : 'See technical formula & interactive inspector &darr;'}</span>
            </button>
          </div>

          {/* Expandable Technical Formula & Interactive Inspector */}
          {showFormula && (
            <div
              style={{
                marginTop: '16px',
                paddingTop: '20px',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand-navy)', marginBottom: '4px' }}>
                  The Mathematical Parity Formula:
                </div>
                <div className="font-mono" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--action-blue)' }}>
                  ₹/g fine = Quoted Price &divide; Quote Grams &divide; Purity
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                  This single conversion strips lot weight bias and purity discrepancies, allowing any MCX contract to be directly referenced against the pure gold benchmark.
                </div>
              </div>

              {/* Interactive Calculator */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '16px',
                  alignItems: 'end',
                }}
              >
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Select Contract:
                  </label>
                  <select
                    className="terminal-input"
                    value={calcSymbol}
                    onChange={(e) => setCalcSymbol(e.target.value as any)}
                    style={{ marginTop: '6px' }}
                  >
                    <option value="GOLDM">GOLDM (10g quote, 0.995 fineness)</option>
                    <option value="GOLDTEN">GOLDTEN (10g quote, 0.999 fineness)</option>
                    <option value="GOLDGUINEA">GOLDGUINEA (8g quote, 0.999 fineness)</option>
                    <option value="GOLDPETAL">GOLDPETAL (1g quote, 0.999 fineness)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Quoted Price (₹):
                  </label>
                  <input
                    type="number"
                    className="terminal-input"
                    value={calcPrice}
                    onChange={(e) => setCalcPrice(Number(e.target.value))}
                    style={{ marginTop: '6px' }}
                  />
                </div>

                <div
                  style={{
                    padding: '12px 16px',
                    backgroundColor: 'var(--accent-gold-bg)',
                    borderRadius: '8px',
                    border: '1px solid var(--accent-gold-border)',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-gold)', textTransform: 'uppercase' }}>
                    Normalised Value
                  </div>
                  <div className="font-mono" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--brand-navy)' }}>
                    ₹{finePrice.toFixed(2)} / gram
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Beta-Neutral Whole-Lot Hedge Calculator Component */}
        <div>
          <HedgeCalculator />
        </div>
      </div>
    </section>
  );
};
