import React from 'react';
import { VerdictCard } from '../components/VerdictCard';
import { useTerminal } from '../store/terminalStore';
import { count, monthRange, num } from '../utils/format';

export const OverviewSection: React.FC = () => {
  const { summary } = useTerminal();
  const hurdleBps = num(summary?.hurdle_bps);
  const sessionsCount = count(summary?.data?.sessions, 'Sessions');
  const sessionsRange = monthRange(summary?.data?.from, summary?.data?.to);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      window.history.replaceState(null, '', `#${id}`);
    }
  };

  return (
    <section id="overview" className="story-section overview-hero-section">
      <div className="section-inner">
        <div className="hero-grid">
          {/* Left Column: Core Question, Plain Explanation, Metrics & CTAs */}
          <div className="hero-left-content">
            <div className="section-eyebrow">Institutional Derivatives Intelligence</div>
            <h1 className="hero-headline">
              Are MCX gold price gaps actually tradable?
            </h1>
            <p className="hero-subheading">
              AuRA compares MCX&apos;s four gold futures contracts on a fair, like-for-like basis.
              It eliminates the illusions created by differing quote units, metal purity, and delivery dates,
              then tests whether apparent price gaps survive real-world exchange fees, slippage, and holdout validation.
            </p>

            {/* Exactly Two CTAs */}
            <div className="hero-actions">
              <a
                href="#relative-value"
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo('relative-value');
                }}
                className="btn-hero-primary"
              >
                Explore Analysis &rarr;
              </a>
              <a
                href="#live"
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo('live');
                }}
                className="btn-hero-secondary"
              >
                Open Live Monitor
              </a>
            </div>
          </div>

          {/* Right Column: Prominent Verdict Card */}
          <div className="hero-right-card">
            <VerdictCard />
          </div>
        </div>

        {/* Full-Width Stat Cards Row */}
        <div className="proof-metrics-grid">
          <div className="proof-metric-card">
            <div className="font-mono metric-num">4 Contracts</div>
            <div className="metric-desc">GOLDM, GOLDTEN, GUINEA, PETAL</div>
          </div>
          <div className="proof-metric-card">
            <div className="font-mono metric-num">{hurdleBps} bps</div>
            <div className="metric-desc">Round-trip break-even cost hurdle</div>
          </div>
          <div className="proof-metric-card">
            <div className="font-mono metric-num">{sessionsCount}</div>
            <div className="metric-desc">Real MCX trading sessions analysed ({sessionsRange})</div>
          </div>
        </div>

        {/* Simple "Why This Matters" Explanation */}
        <div className="why-matters-box">
          <div className="why-matters-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div>
            <h4 className="why-matters-title">Why this matters for commodity market participants</h4>
            <p className="why-matters-text">
              Four MCX gold contracts represent the exact same physical gold, but trade at different screen prices for legitimate structural reasons:
              different quote weights (1g to 10g), different purity (995 vs 999), and different delivery timing.
              Naive price comparisons lure retail traders into paying for phantom arbitrage.
              AuRA protects capital by demonstrating where the market is efficiently priced after real costs.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
