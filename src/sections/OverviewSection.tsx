import React from 'react';
import { VerdictCard } from '../components/VerdictCard';

export const OverviewSection: React.FC = () => {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="overview" className="story-section" style={{ paddingTop: '48px', paddingBottom: '64px' }}>
      <div className="section-inner">
        <div className="hero-grid">
          {/* Left Column: Narrative Headline & Actions */}
          <div>
            <div className="section-eyebrow">Institutional Derivatives Intelligence</div>
            <h1 className="hero-headline">
              Are MCX gold price gaps actually tradable?
            </h1>
            <p className="hero-subheading">
              AuRA compares MCX gold futures on a fair, like-for-like basis, then tests whether
              an apparent price gap survives purity, expiry timing, transaction fees, slippage, and liquidity constraints.
            </p>

            <div className="hero-actions">
              <a
                href="#research"
                onClick={(e) => { e.preventDefault(); scrollTo('research'); }}
                className="btn-hero-primary"
              >
                Explore Research Results &rarr;
              </a>
              <a
                href="#live"
                onClick={(e) => { e.preventDefault(); scrollTo('live'); }}
                className="btn-hero-secondary"
              >
                Open Live Monitor
              </a>
            </div>

            {/* Quick Context Stats */}
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
              <div>
                <div className="font-mono" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--brand-navy)' }}>
                  4 Contracts
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  GOLDM, GOLDTEN, GUINEA, PETAL
                </div>
              </div>
              <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '24px' }}>
                <div className="font-mono" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--brand-navy)' }}>
                  13.1 bps
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Round-trip cost hurdle
                </div>
              </div>
              <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '24px' }}>
                <div className="font-mono" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--brand-navy)' }}>
                  716 Sessions
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Historical DuckDB database
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Prominent Verdict Card */}
          <div>
            <VerdictCard />
          </div>
        </div>

        {/* Why this matters callout */}
        <div className="why-matters-box">
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-gold-bg)',
              color: 'var(--accent-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontWeight: 700,
            }}
          >
            !
          </div>
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--brand-navy)', marginBottom: '4px' }}>
              Why this matters
            </h4>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Four MCX gold contracts represent the same underlying metal, but their raw prices differ for legitimate reasons.
              AuRA prevents traders from mistaking these normal contract differences for arbitrage.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
