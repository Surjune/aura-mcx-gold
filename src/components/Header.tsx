import React, { useState, useEffect } from 'react';
import { useTerminal } from '../store/terminalStore';
import { describeFeed } from '../utils/liveFeed';

export const NAV_ITEMS = [
  { id: 'overview', label: 'Overview' },
  { id: 'relative-value', label: 'Relative Value' },
  { id: 'carry-curve', label: 'Carry & Curve' },
  { id: 'backtest-results', label: 'Backtest Results' },
  { id: 'live', label: 'Live Monitor' },
  { id: 'contract-lifecycle', label: 'Contract Lifecycle' },
];

export const Header: React.FC = () => {
  const { live } = useTerminal();
  const [activeSection, setActiveSection] = useState('overview');

  const feed = describeFeed(live);

  useEffect(() => {
    const handleScroll = () => {
      const sectionIds = NAV_ITEMS.map((item) => item.id);
      const scrollY = window.scrollY + 140;

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const id = sectionIds[i];
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          if (scrollY >= top) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      window.history.replaceState(null, '', `#${id}`);
      setActiveSection(id);
    }
  };

  return (
    <header className="site-header">
      <div className="header-container">
        {/* Left: Brand & Subtitle */}
        <a
          href="#overview"
          onClick={(e) => {
            e.preventDefault();
            scrollTo('overview');
          }}
          className="brand-block"
        >
          <span className="brand-mark">
            AuRA
            <span className="brand-gold-dot" />
          </span>
          <span className="brand-subtitle">MCX Gold Futures Intelligence</span>
        </a>

        {/* Center: Exact 6-Item Navigation */}
        <nav aria-label="Main Navigation" className="desktop-nav">
          <ul className="nav-links">
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className={`nav-link ${activeSection === item.id ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollTo(item.id);
                  }}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right: GitHub Icon Link & Open Live Monitor CTA */}
        <div className="header-actions">
          <a
            href="https://github.com/Surjune/aura-mcx-gold"
            target="_blank"
            rel="noopener noreferrer"
            className="github-link"
            title="View Source on GitHub"
            aria-label="GitHub Repository"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
          </a>

          <a
            href="#live"
            onClick={(e) => {
              e.preventDefault();
              scrollTo('live');
            }}
            className="cta-live-btn"
          >
            <span
              className="live-status-pulse"
              style={{ backgroundColor: feed.dotColor }}
            />
            <span>Open Live Monitor</span>
            <span className="cta-live-status">({feed.headerLabel})</span>
          </a>
        </div>
      </div>

      {/* Mobile Horizontal Scrollable Navigation Bar (no cramped text) */}
      <div className="mobile-nav-bar">
        <div className="mobile-nav-scroll">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className={`mobile-nav-chip ${activeSection === item.id ? 'active' : ''}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
