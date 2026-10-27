import React from 'react';
import { SectionHeading } from '../components/SectionHeading';
import { ContractCard } from '../components/ContractCard';

export const ProblemSection: React.FC = () => {
  return (
    <section id="problem" className="story-section">
      <div className="section-inner">
        <SectionHeading
          eyebrow="The Root Problem"
          title="Why raw MCX gold prices cannot be compared directly"
          description="MCX offers four separate gold futures contracts. While all four settle against pure gold, each was designed with completely different rules, purity standards, and expiry dates."
        />

        {/* 4 Simple Contract Cards */}
        <div className="contracts-grid-4">
          <ContractCard
            symbol="GOLDM"
            role="Mini Contract"
            lotGrams={100}
            quoteGrams={10}
            purity={0.995}
            purityLabel="995 Fineness"
            expiryWindow="3rd – 5th of Month"
            description="Delivers 995 purity gold and expires ~24 days earlier than the other three contracts."
          />

          <ContractCard
            symbol="GOLDTEN"
            role="Reference Benchmark"
            lotGrams={10}
            quoteGrams={10}
            purity={0.999}
            purityLabel="999 Pure Gold"
            expiryWindow="27th – 31st of Month"
            description="The primary reference benchmark for pure 999 gold trading in standard 10g quote increments."
          />

          <ContractCard
            symbol="GOLDGUINEA"
            role="Sovereign Equivalent"
            lotGrams={8}
            quoteGrams={8}
            purity={0.999}
            purityLabel="999 Pure Gold"
            expiryWindow="27th – 31st of Month"
            description="Designed for retail physical guinea sizing (8 grams) with 999 fineness at month-end."
          />

          <ContractCard
            symbol="GOLDPETAL"
            role="Micro Contract"
            lotGrams={1}
            quoteGrams={1}
            purity={0.999}
            purityLabel="999 Pure Gold"
            expiryWindow="27th – 31st of Month"
            description="1-gram retail micro contract carrying a structural retail premium over the benchmark."
          />
        </div>

        {/* Simple Visual Flow */}
        <div className="problem-flow-wrap">
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--accent-gold)',
              }}
            >
              The False Arbitrage Trap
            </span>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--brand-navy)', marginTop: '4px' }}>
              How naive price comparisons mislead traders
            </h3>
          </div>

          <div className="problem-flow-steps">
            <div className="flow-step-box">
              <h4>1. Different Rules</h4>
              <p>Lot sizes (1g to 100g), purity (995 vs 999), and expiry dates differ by design.</p>
            </div>

            <div className="flow-step-arrow">&rarr;</div>

            <div className="flow-step-box">
              <h4>2. Divergent Prices</h4>
              <p>Quoted screen prices look substantially different on trading screens.</p>
            </div>

            <div className="flow-step-arrow">&rarr;</div>

            <div className="flow-step-box highlight">
              <h4>3. False Arbitrage</h4>
              <p>A naive comparison makes price gaps appear as lucrative risk-free profit.</p>
            </div>

            <div className="flow-step-arrow">&rarr;</div>

            <div className="flow-step-box" style={{ border: '2px solid var(--brand-navy)', backgroundColor: '#FFFFFF' }}>
              <h4>4. AuRA Conversion</h4>
              <p>AuRA converts all four contracts to a common ₹ per gram of pure gold before testing.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
