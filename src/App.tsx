import React, { useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { OverviewSection } from './sections/OverviewSection';
import { RelativeValueSection } from './sections/RelativeValueSection';
import { CarryCurveSection } from './sections/CarryCurveSection';
import { BacktestResultsSection } from './sections/BacktestResultsSection';
import { LiveMonitorSection } from './sections/LiveMonitorSection';
import { ContractLifecycleSection } from './sections/ContractLifecycleSection';
import { useTerminal } from './store/terminalStore';

export const App: React.FC = () => {
  const { error, isLoading, refreshAll } = useTerminal();

  // Route awareness: auto-scroll to #live if navigated via /live or #live
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isLivePath = window.location.pathname.includes('/live') || window.location.hash === '#live';
      if (isLivePath) {
        const el = document.getElementById('live');
        if (el) {
          setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 150);
        }
      }
    }
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: '100vh', backgroundColor: 'var(--bg-canvas)' }}>
      {/* 1. Sticky Top Navigation */}
      <Header />

      {/* Global Connection / Offline Notice */}
      {error && (
        <div
          style={{
            padding: '12px 24px',
            backgroundColor: 'var(--semantic-crimson-bg)',
            borderBottom: '1px solid var(--semantic-crimson-border)',
            color: 'var(--semantic-crimson)',
            fontSize: '14px',
            fontFamily: 'var(--font-sans)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>
            <strong>Connection Notice:</strong> Unable to connect to the live poller feed. Replaying verified session archive.
          </span>
          <button
            onClick={() => refreshAll()}
            style={{
              padding: '4px 12px',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--semantic-crimson-border)',
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

      {/* Global Loading Bar */}
      {isLoading && (
        <div
          style={{
            padding: '8px 24px',
            backgroundColor: 'var(--accent-gold-bg)',
            fontSize: '12px',
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
          Updating AuRA research models and quote feeds...
        </div>
      )}

      {/* Main Guided Story Stream (Exact 6-Section Hierarchy) */}
      <main style={{ flex: 1, width: '100%' }}>
        {/* 1. Overview */}
        <OverviewSection />

        {/* 2. Relative Value */}
        <RelativeValueSection />

        {/* 3. Carry & Curve */}
        <CarryCurveSection />

        {/* 4. Backtest Results */}
        <BacktestResultsSection />

        {/* 5. Live Monitor */}
        <LiveMonitorSection />

        {/* 6. Contract Lifecycle */}
        <ContractLifecycleSection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};
