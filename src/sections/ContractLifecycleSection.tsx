import React, { useState } from 'react';
import { SectionHeading } from '../components/SectionHeading';
import { MethodologyCard } from '../components/MethodologyCard';
import { useTerminal } from '../store/terminalStore';

export const ContractLifecycleSection: React.FC = () => {
  const { contracts } = useTerminal();
  const [selectedSymbol, setSelectedSymbol] = useState<string>('GOLDTEN');
  const [filterQuery, setFilterQuery] = useState<string>('');

  const contractList = (contracts ?? []).filter((c) => c.symbol === selectedSymbol);
  const displayedContracts = filterQuery
    ? contractList.filter((c) => c.expiry.includes(filterQuery) || c.first_traded.includes(filterQuery))
    : contractList.slice(-10);

  return (
    <section id="contract-lifecycle" className="story-section" style={{ backgroundColor: '#FAFBFD' }}>
      <div className="section-inner">
        <SectionHeading
          eyebrow="Contract Timing & Risk Discipline"
          title="Discrete Lifecycle Gates & Delivery Avoidance"
          description="AuRA never stitches contracts into artificial continuous futures. Each contract is tracked through three distinct lifecycle phases to avoid illiquid trading and physical delivery delivery risks."
        />

        {/* Horizontal Lifecycle Timeline */}
        <div className="lifecycle-timeline-wrap" style={{ marginBottom: '36px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <span className="section-eyebrow">The 4 Lifecycle Stages</span>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--brand-navy)', marginTop: '4px' }}>
              Why AuRA avoids thin contracts and physical delivery windows
            </h3>
          </div>

          <div className="lifecycle-horizontal-stages">
            {/* Stage 1 */}
            <div className="lifecycle-stage-card">
              <div className="stage-badge">STAGE 1</div>
              <h4 className="stage-title">Listing &amp; Incubation</h4>
              <p className="stage-desc">
                Newly listed far-month contracts. Order books have low depth and wide bid-ask spreads.
              </p>
              <div className="stage-rule-box red">
                <strong>AuRA Protocol:</strong> Zero trading permitted; observed only.
              </div>
            </div>

            <div className="stage-connector-arrow">&rarr;</div>

            {/* Stage 2 */}
            <div className="lifecycle-stage-card highlight">
              <div className="stage-badge blue">STAGE 2 (ELIGIBLE)</div>
              <h4 className="stage-title">Liquidity Ramp (&ge; 50% OI)</h4>
              <p className="stage-desc">
                The contract accumulates &ge; 50% of its symbol&apos;s open interest, ensuring executable depth.
              </p>
              <div className="stage-rule-box green">
                <strong>AuRA Protocol:</strong> Active trading window; spreads are tightest.
              </div>
            </div>

            <div className="stage-connector-arrow">&rarr;</div>

            {/* Stage 3 */}
            <div className="lifecycle-stage-card">
              <div className="stage-badge amber">STAGE 3 (STEP ASIDE)</div>
              <h4 className="stage-title">Tender Window (Final 5 Days)</h4>
              <p className="stage-desc">
                Brokers require delivery intentions and margins rise steeply during the staggered delivery period.
              </p>
              <div className="stage-rule-box amber">
                <strong>AuRA Protocol:</strong> Mandatory exit &ge; 9 DTE before delivery window.
              </div>
            </div>

            <div className="stage-connector-arrow">&rarr;</div>

            {/* Stage 4 */}
            <div className="lifecycle-stage-card">
              <div className="stage-badge">STAGE 4</div>
              <h4 className="stage-title">Expiry &amp; Settlement</h4>
              <p className="stage-desc">
                Final physical settlement or cash marking. No positions remain open.
              </p>
              <div className="stage-rule-box">
                <strong>AuRA Protocol:</strong> Position already closed; zero delivery risk.
              </div>
            </div>
          </div>
        </div>

        {/* Real Contract Lifecycle Calendar / Table */}
        <div className="terminal-panel-card" style={{ marginBottom: '40px' }}>
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h4 className="panel-title">Real MCX Contract Lifecycle Records</h4>
              <p className="panel-subtitle">
                Official DuckDB records showing first traded date, days to liquid benchmark status, and tender window start
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {['GOLDTEN', 'GOLDM', 'GOLDGUINEA', 'GOLDPETAL'].map((sym) => (
                <button
                  key={sym}
                  onClick={() => setSelectedSymbol(sym)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: selectedSymbol === sym ? 'var(--brand-navy)' : '#FFFFFF',
                    color: selectedSymbol === sym ? '#FFFFFF' : 'var(--text-secondary)',
                    transition: 'all 150ms ease',
                  }}
                >
                  {sym}
                </button>
              ))}

              <input
                type="text"
                placeholder="Search expiry..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: '#FFFFFF',
                  color: 'var(--brand-navy)',
                  width: '140px',
                }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="terminal-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Contract Expiry</th>
                  <th>First Traded</th>
                  <th>Became Liquid (&ge; 50% OI)</th>
                  <th className="num">Sessions to Liquid</th>
                  <th className="num">Peak OI (Lots)</th>
                  <th>Tender Step-Aside Date</th>
                  <th>Last Traded</th>
                </tr>
              </thead>
              <tbody>
                {displayedContracts.length > 0 ? (
                  displayedContracts.map((c, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, color: 'var(--brand-navy)' }}>{c.symbol}</td>
                      <td className="font-mono" style={{ fontWeight: 700 }}>{c.expiry}</td>
                      <td className="font-mono">{c.first_traded}</td>
                      <td className="font-mono">{c.became_liquid || 'In Incubation'}</td>
                      <td className="num font-mono">{c.sessions_to_liquid !== null ? c.sessions_to_liquid : '—'}</td>
                      <td className="num font-mono">{c.peak_oi_lots.toLocaleString()}</td>
                      <td className="font-mono" style={{ color: 'var(--semantic-amber)' }}>
                        {c.delivery_window_from || '—'}
                      </td>
                      <td className="font-mono">{c.last_traded}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      No contract records found matching query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 7 Research Safeguards & Data Integrity Audit */}
        <div>
          <div style={{ marginBottom: '20px' }}>
            <span className="section-eyebrow">Academic Rigor &amp; Trust</span>
            <h3 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--brand-navy)', marginTop: '4px' }}>
              The 7 Core Safeguards: Eliminating hidden assumptions
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '780px', marginTop: '6px' }}>
              Track 03 Commodity Derivatives Intelligence requires eliminating deceptive shortcuts. Here is how AuRA prevents false positives and ensures data hygiene.
            </p>
          </div>

          <div className="safeguards-accordion">
            <MethodologyCard
              id={1}
              title="Purity Adjustment"
              summary="AuRA never compares 995 and 999 purity gold without mathematical correction."
              detailedText="GOLDM delivers 995 purity gold, while GOLDTEN delivers 999 fineness. Failing to adjust produces an artificial 40 bps distortion. AuRA maps all four contracts into grams of 100% fine gold before computing spreads."
              codeSnippet="price / quote_grams / purity"
              riskMitigated="False 40 bps arbitrage illusions caused by differing metal fineness."
            />
            <MethodologyCard
              id={2}
              title="Exact-Expiry Matching"
              summary="AuRA avoids treating contracts with different settlement dates as the same trade."
              detailedText="GOLDM contracts expire early in the month (3rd–5th), whereas GOLDTEN, GOLDGUINEA, and GOLDPETAL expire at month-end (27th–31st). Treating these as identical risks massive delivery dislocations."
              codeSnippet="same_expiry = (leg_a.expiry == leg_b.expiry)"
              riskMitigated="Mismatched roll-down timing being mistaken for relative value mispricings."
            />
            <MethodologyCard
              id={3}
              title="Carry & Term-Structure Adjustment"
              summary="Normal roll-down and delivery timing are separated from a genuine price difference."
              detailedText="Because gold futures trade in contango (~9.8% annualised carry), contracts expiring 24 days apart naturally trade at different price points along the forward curve. AuRA interpolates along the curve."
              codeSnippet="curve_price = ten_fine ** (1 - w) * next_fine ** w"
              riskMitigated="Normal contango term structure being mistaken for an actionable spread."
            />
            <MethodologyCard
              id={4}
              title="Whole-Lot Hedging"
              summary="Trade tests use practical integer lot combinations, not unrealistic fractional positions."
              detailedText="Exchange contracts cannot be divided into fractional units. Hedge tests require integer lot ratios (e.g., 1 GOLDTEN vs 10 GOLDPETAL, or 4 GOLDTEN vs 5 GOLDGUINEA) to achieve true gold beta = 0.00."
              codeSnippet="lots_a * lot_grams_a == lots_b * lot_grams_b"
              riskMitigated="Directional gold spot exposure creeping into a supposedly market-neutral pair."
            />
            <MethodologyCard
              id={5}
              title="Cost-Aware Testing"
              summary="Fees, slippage, and liquidity gates are included before judging an opportunity."
              detailedText="AuRA models the complete friction of real trading: brokerage, Commodities Transaction Tax (CTT), exchange turnover fees, GST, SEBI charges, plus crossing the bid-ask spread (13.1 bps round-trip hurdle)."
              codeSnippet="hurdle_bps = fees_bps + 2 * half_spread_bps"
              riskMitigated="Paper profits that evaporate once a trader crosses the bid-ask spread."
            />
            <MethodologyCard
              id={6}
              title="Untouched Out-of-Sample Validation"
              summary="Final results are tested on data the strategy did not use during development."
              detailedText="Parameter tuning was locked to the development window (Apr 2025 – Apr 2026). The holdout window (Apr 2026 – Oct 2026) was strictly untouched, preventing overfitting and look-ahead bias."
              codeSnippet="holdout_data = data[data.session >= '2026-04-20']"
              riskMitigated="Overfitting to historical noise and reporting unrealistic backtest returns."
            />
            <MethodologyCard
              id={7}
              title="Data-Quality & Holiday Echo Checks"
              summary="Holiday, duplicate-date, expiry, and stale-data checks prevent misleading inputs."
              detailedText="The MCX Bhavcopy API silently returns the prior trading day when queried on a holiday. AuRA asserts that the response date matches the requested date, and strips space-padded symbol strings."
              codeSnippet="assert response['Date'] == requested_date, 'Silent holiday echo'"
              riskMitigated="Duplicate sessions inflating backtest trade sample sizes."
            />
          </div>
        </div>
      </div>
    </section>
  );
};
