import React from 'react';
import { SectionHeading } from '../components/SectionHeading';
import { MethodologyCard } from '../components/MethodologyCard';
import { LifecycleSwimlane } from '../components/LifecycleSwimlane';

export const MethodologySection: React.FC = () => {
  return (
    <section id="methodology" className="story-section">
      <div className="section-inner">
        <SectionHeading
          eyebrow="Methodology & Safeguards"
          title="How AuRA avoids misleading signals"
          description="Institutional commodity research requires eliminating hidden assumptions. Here is how AuRA prevents false positives and adheres to the Track 03 data safeguards."
        />

        {/* 7 Expandable Safeguard Cards */}
        <div className="safeguards-accordion">
          <MethodologyCard
            id={1}
            title="Purity Adjustment"
            summary="AuRA does not compare 995 and 999 purity gold without correction."
            detailedText="GOLDM delivers 995 purity gold, while GOLDTEN delivers 999 fineness. Failing to adjust produces a 40 bps distortion. AuRA maps both contracts into grams of 100% fine gold before any spread calculation."
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
            summary="Trade tests use practical lot combinations, not unrealistic fractional positions."
            detailedText="Exchange contracts cannot be divided into fractional units. Hedge tests require integer lot ratios (e.g., 1 GOLDTEN vs 10 GOLDPETAL, or 4 GOLDTEN vs 5 GOLDGUINEA) to achieve true gold beta = 0.00."
            codeSnippet="lots_a * lot_grams_a == lots_b * lot_grams_b"
            riskMitigated="Directional gold spot exposure creeping into a supposedly market-neutral pair."
          />

          <MethodologyCard
            id={5}
            title="Cost-Aware Testing"
            summary="Fees, slippage, and liquidity gates are included before judging an opportunity."
            detailedText="AuRA models the complete friction of real trading: brokerage, Securities Transaction Tax (STT), exchange turnover fees, GST, SEBI charges, plus crossing the bid-ask spread (13.1 bps round-trip hurdle)."
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

        {/* Contract Timing / Discrete Lifecycle Swimlane */}
        <div style={{ marginTop: '32px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--brand-navy)', marginBottom: '8px' }}>
            Contract Timing &amp; Discrete Lifecycle Gates
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', maxWidth: '800px' }}>
            To prevent roll-date artificial price jumps, AuRA never artificially stitches contracts into a fake continuous series.
            Contracts are tracked through three strict phases: Listing &rarr; Liquidity Ramp (&ge; 50% OI) &rarr; Mandatory Tender Window Step-Aside.
          </p>

          <LifecycleSwimlane />
        </div>
      </div>
    </section>
  );
};
