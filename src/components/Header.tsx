import React, { useState, useEffect } from 'react';
import { useTerminal } from '../store/terminalStore';

export const Header: React.FC = () => {
  const { live } = useTerminal();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');

  const isMarketOpen = live?.snapshot?.market_open ?? false;
  const statusLabel = isMarketOpen ? 'MCX Open' : 'MCX Closed';

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['overview', 'problem', 'how-it-works', 'research', 'live', 'methodology'];
      const scrollY = window.scrollY + 120;
      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollY >= top && scrollY < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="site-header">
      <div className="header-container">
        {/* Left: Brand & Subtitle */}
        <a href="#overview" onClick={(e) => { e.preventDefault(); scrollTo('overview'); }} className="brand-block">
          <span className="brand-mark">
            AuRA
            <span className="brand-gold-dot" />
          </span>
          <span className="brand-subtitle">MCX Gold Futures Intelligence</span>
        </a>

        {/* Center / Right Nav: Desktop */}
        <nav aria-label="Main Navigation" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ul className="nav-links" style={{ display: window.innerWidth < 900 ? 'none' : 'flex' }}>
            <li>
              <a
                href="#overview"
                className={`nav-link ${activeSection === 'overview' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); scrollTo('overview'); }}
              >
                Overview
              </a>
            </li>
            <li>
              <a
                href="#problem"
                className={`nav-link ${activeSection === 'problem' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); scrollTo('problem'); }}
              >
                The Problem
              </a>
            </li>
            <li>
              <a
                href="#how-it-works"
                className={`nav-link ${activeSection === 'how-it-works' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); scrollTo('how-it-works'); }}
              >
                How It Works
              </a>
            </li>
            <li>
              <a
                href="#research"
                className={`nav-link ${activeSection === 'research' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); scrollTo('research'); }}
              >
                Research Results
              </a>
            </li>
            <li>
              <a
                href="#live"
                className={`nav-link ${activeSection === 'live' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); scrollTo('live'); }}
              >
                Live Monitor
              </a>
            </li>
            <li>
              <a
                href="#methodology"
                className={`nav-link ${activeSection === 'methodology' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); scrollTo('methodology'); }}
              >
                Methodology
              </a>
            </li>
          </ul>

          <div className="header-actions">
            {/* GitHub Link */}
            <a
              href="https://github.com/Surjune/aura-mcx-gold"
              target="_blank"
              rel="noopener noreferrer"
              className="github-link"
              title="View Source on GitHub"
              aria-label="GitHub Repository"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </a>

            {/* Right CTA */}
            <a
              href="#live"
              onClick={(e) => { e.preventDefault(); scrollTo('live'); }}
              className="cta-live-btn"
            >
              <span
                className="live-status-pulse"
                style={{ backgroundColor: isMarketOpen ? 'var(--semantic-emerald)' : '#94A3B8' }}
              />
              <span>Open Live Monitor</span>
              <span style={{ fontSize: '11px', opacity: 0.8, fontWeight: 500 }}>({statusLabel})</span>
            </a>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="github-link"
              style={{ display: window.innerWidth < 900 ? 'flex' : 'none' }}
              aria-label="Toggle Navigation"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
              </svg>
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div style={{ padding: '16px 24px', backgroundColor: '#FFFFFF', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {['overview', 'problem', 'how-it-works', 'research', 'live', 'methodology'].map((sec) => (
            <button
              key={sec}
              onClick={() => scrollTo(sec)}
              style={{
                textAlign: 'left',
                padding: '10px 14px',
                background: 'none',
                border: 'none',
                fontSize: '15px',
                fontWeight: 600,
                color: activeSection === sec ? 'var(--brand-navy)' : 'var(--text-secondary)',
                borderRadius: '6px',
                backgroundColor: activeSection === sec ? 'var(--bg-surface-subtle)' : 'transparent',
              }}
            >
              {sec === 'how-it-works' ? 'How It Works' : sec.charAt(0).toUpperCase() + sec.slice(1).replace('-', ' ')}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
