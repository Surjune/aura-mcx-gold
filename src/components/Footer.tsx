import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-top-grid">
          {/* Col 1: Brand & Subtitle */}
          <div className="footer-brand">
            <h3>AuRA</h3>
            <p>
              Aurum Relative-value Analytics — An institutional commodity derivatives intelligence
              platform comparing MCX gold futures contracts on a fair, cost-aware, like-for-like basis.
            </p>
            <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#CBD5E1',
                  padding: '4px 10px',
                  borderRadius: '4px',
                }}
              >
                Hack in Hills &apos;26 &bull; Track 03
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#CBD5E1',
                  padding: '4px 10px',
                  borderRadius: '4px',
                }}
              >
                Team Lightning Logics
              </span>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div className="footer-col">
            <h4>Platform</h4>
            <ul className="footer-nav-list">
              <li><a href="#overview">Overview</a></li>
              <li><a href="#problem">The Problem</a></li>
              <li><a href="#how-it-works">How It Works</a></li>
              <li><a href="#research">Research Results</a></li>
              <li><a href="#live">Live Monitor</a></li>
              <li><a href="#methodology">Methodology &amp; Trust</a></li>
            </ul>
          </div>

          {/* Col 3: Research & Code */}
          <div className="footer-col">
            <h4>Resources &amp; Code</h4>
            <ul className="footer-nav-list">
              <li>
                <a
                  href="https://github.com/Surjune/aura-mcx-gold"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub Repository &rarr;
                </a>
              </li>
              <li>
                <a href="#research">
                  Backtesting &amp; Holdout Data
                </a>
              </li>
              <li>
                <a href="#methodology">
                  Data Hygiene Safeguards
                </a>
              </li>
              <li>
                <a href="#live">
                  Top-of-Book Quote Feeds
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Disclaimer */}
        <div className="footer-bottom-disclaimer">
          <div>
            &copy; {new Date().getFullYear()} AuRA &bull; Developed by Team Lightning Logics (R S Surjune, Abhinandana B, Nithiesh Karthick).
          </div>
          <div style={{ maxWidth: '640px', textAlign: 'right' }}>
            <strong>Disclaimer:</strong> AuRA is an academic research prototype for analysing market data.
            It does not place trades, manage client funds, or provide financial investment advice.
          </div>
        </div>
      </div>
    </footer>
  );
};
