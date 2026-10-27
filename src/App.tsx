import React, { useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { OverviewSection } from './sections/OverviewSection';
import { ProblemSection } from './sections/ProblemSection';
import { HowItWorksSection } from './sections/HowItWorksSection';
import { ResearchSection } from './sections/ResearchSection';
import { LiveMonitorSection } from './sections/LiveMonitorSection';
import { MethodologySection } from './sections/MethodologySection';
import { useTerminal } from './store/terminalStore';

export const App: React.FC = () => {
  const { error, isLoading, refreshAll } = useTerminal();

  // Route awareness: auto-scroll to #live if navigated via /live or #live
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname.includes('/live') || window.location.hash === '#live') {
        const el = document.getElementById('live');
        if (el) {
          setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 150);
        }
      }
    }
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-canvas)' }}>
      {/* 1. Clean Sticky Header */}
      <Header />

      {/* Global User-Friendly Error Alert */}
      {error && (
        <div
          style={{
            padding: '12px 24px',
            backgroundColor: '#FEF2F2',
            borderBottom: '1px solid #FCA5A5',
            color: 'var(--semantic-crimson)',
            fontSize: '14px',
            fontFamily: 'var(--font-sans)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>
            <strong>Connection Notice:</strong> We could not load the latest data. Please try refreshing the dashboard.
          </span>
          <button
            onClick={() => refreshAll()}
            style={{
              padding: '4px 12px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #FCA5A5',
              borderRadius: '4px',
              color: 'var(--semantic-crimson)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Global Loading Indicator */}
      {isLoading && (
        <div
          style={{
            padding: '10px 24px',
            backgroundColor: 'var(--accent-gold-bg)',
            fontSize: '13px',
            color: 'var(--brand-navy)',
            fontFamily: 'var(--font-sans)',
            borderBottom: '1px solid var(--accent-gold-border)',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-gold)',
              display: 'inline-block',
            }}
          />
          Loading AuRA research data and live quotes...
        </div>
      )}

      {/* Main Guided Story Stream (Pages 1 to 6) */}
      <main style={{ flex: 1 }}>
        {/* Page 1: Overview & Research Verdict */}
        <OverviewSection />

        {/* Page 2: The Problem (4 Contracts & False Arbitrage Trap) */}
        <ProblemSection />

        {/* Page 3: How AuRA Works (4-Step Normalisation & Whole-Lot Calculator) */}
        <HowItWorksSection />

        {/* Page 4: Research Results (Proof, Key Metrics, Charts & Backtest Outlier) */}
        <ResearchSection />

        {/* Page 5: Live Monitor (Quotes, Real Spread Monitor, Depth Simulation) */}
        <LiveMonitorSection />

        {/* Page 6: Methodology and Trust (7 Safeguards & Discrete Lifecycle Gates) */}
        <MethodologySection />
      </main>

      {/* Page 7: Footer */}
      <Footer />
    </div>
  );
};
