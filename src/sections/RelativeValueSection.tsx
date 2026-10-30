import React, { useState, useMemo } from 'react';
import { SectionHeading } from '../components/SectionHeading';
import { ContractCard } from '../components/ContractCard';
import { HedgeCalculator } from '../components/HedgeCalculator';
import { PlotlyTerminalChart } from '../components/PlotlyTerminalChart';
import { useTerminal } from '../store/terminalStore';
import { bps, count, num } from '../utils/format';

type Symbol = 'GOLDM' | 'GOLDTEN' | 'GOLDGUINEA' | 'GOLDPETAL';
const SYMBOLS: Symbol[] = ['GOLDM', 'GOLDTEN', 'GOLDGUINEA', 'GOLDPETAL'];

export const RelativeValueSection: React.FC = () => {
  const { series, summary } = useTerminal();
  const [showFormula, setShowFormula] = useState(false);
  const [calcSymbol, setCalcSymbol] = useState<Symbol>('GOLDTEN');
  const [calcPrice, setCalcPrice] = useState<number>(145360);

  const hurdle = summary?.hurdle_bps;
  const hurdleLabel = num(hurdle);
  const petal = summary?.premiums?.GOLDPETAL;
  const guinea = summary?.premiums?.GOLDGUINEA;

  const specs = {
    GOLDM: { quote: 10, purity: 0.995, label: '10g quote, 0.995 fineness', lot: '100g' },
    GOLDTEN: { quote: 10, purity: 0.999, label: '10g quote, 0.999 pure', lot: '10g' },
    GOLDGUINEA: { quote: 8, purity: 0.999, label: '8g quote, 0.999 pure', lot: '8g' },
    GOLDPETAL: { quote: 1, purity: 0.999, label: '1g quote, 0.999 pure', lot: '1g' },
  };

  const selected = specs[calcSymbol];
  const finePrice = calcPrice / selected.quote / selected.purity;

  // Chart 1: Normalised Price Comparison in ₹/g fine gold
  const normalisedPriceChartData = useMemo(() => {
    if (!series) return [];
    return [
      {
        x: series.session,
        y: series.ten_fine,
        type: 'scatter',
        mode: 'lines',
        name: 'GOLDTEN (Benchmark 999)',
        line: { color: '#0F172A', width: 2 },
      },
      {
        x: series.session,
        y: series.petal_fine,
        type: 'scatter',
        mode: 'lines',
        name: 'GOLDPETAL (Retail 1g)',
        line: { color: '#2563EB', width: 1.5 },
      },
      {
        x: series.session,
        y: series.guinea_fine,
        type: 'scatter',
        mode: 'lines',
        name: 'GOLDGUINEA (8g)',
        line: { color: '#64748B', width: 1.5 },
      },
      {
        x: series.session,
        y: series.m_fine,
        type: 'scatter',
        mode: 'lines',
        name: 'GOLDM (100g, 995)',
        line: { color: '#D97706', width: 1.2, dash: 'dot' },
      },
    ];
  }, [series]);

  // Chart 2: Same-Expiry Premium vs Cost Hurdle Lines
  const premiumSpreadChartData = useMemo(() => {
    if (!series) return [];
    const premiums = [
      {
        x: series.session,
        y: series.prem_petal,
        type: 'scatter',
        mode: 'lines',
        name: 'GOLDPETAL Premium vs GOLDTEN',
        line: { color: '#2563EB', width: 1.8 },
      },
      {
        x: series.session,
        y: series.prem_guinea,
        type: 'scatter',
        mode: 'lines',
        name: 'GOLDGUINEA Premium vs GOLDTEN',
        line: { color: '#64748B', width: 1.5 },
      },
    ];
    if (hurdle === undefined) return premiums;
    return [
      ...premiums,
      {
        x: [series.session[0], series.session[series.session.length - 1]],
        y: [hurdle, hurdle],
        type: 'scatter',
        mode: 'lines',
        name: `Cost Hurdle (+${hurdle.toFixed(1)} bps)`,
        line: { color: '#DC2626', width: 1.5, dash: 'dash' },
      },
      {
        x: [series.session[0], series.session[series.session.length - 1]],
        y: [-hurdle, -hurdle],
        type: 'scatter',
        mode: 'lines',
        name: `Cost Hurdle (-${hurdle.toFixed(1)} bps)`,
        line: { color: '#DC2626', width: 1.5, dash: 'dash' },
      },
    ];
  }, [series, hurdle]);

  return (
    <section id="relative-value" className="story-section">
      <div className="section-inner">
        <SectionHeading
          eyebrow="Relative Value Parity"
          title="Why raw MCX gold prices cannot be compared directly"
          description="MCX lists four separate contracts on the same metal. Because lot size, quote unit, and gold fineness (995 vs 999) differ by design, comparing raw screen prices tells you nothing."
        />

        {/* 4 Contract Cards */}
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
            description="The primary benchmark for pure 999 gold trading in standard 10g quote increments."
          />
          <ContractCard
            symbol="GOLDGUINEA"
            role="Sovereign Equivalent"
            lotGrams={8}
            quoteGrams={8}
            purity={0.999}
            purityLabel="999 Pure Gold"
            expiryWindow="27th – 31st of Month"
            description="Designed for physical guinea sizing (8 grams) with 999 fineness at month-end."
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

        {/* The False Arbitrage Trap & 4-Step Visual Flow */}
        <div className="problem-flow-wrap" style={{ marginBottom: '32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <span className="section-eyebrow">The False Arbitrage Trap</span>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--brand-navy)', marginTop: '4px' }}>
              How raw price differences mislead traders
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '720px', margin: '8px auto 0' }}>
              Seeing ₹14,887 for GOLDPETAL against ₹148,276 for GOLDTEN looks like a 10x price difference.
              Even comparing per-gram rates directly ignores that GOLDM is only 99.5% pure while GOLDTEN is 99.9% pure.
            </p>
          </div>

          <div className="problem-flow-steps">
            <div className="flow-step-box">
              <h4>1. Raw Screen Prices</h4>
              <p>Lot sizes (1g to 100g), quote units, and purity standards differ by exchange rule.</p>
            </div>
            <div className="flow-step-arrow">&rarr;</div>
            <div className="flow-step-box highlight">
              <h4>2. Normalise to ₹/g Fine</h4>
              <p>AuRA converts every contract into ₹ per gram of 100% fine gold: <code>px / quote_g / purity</code>.</p>
            </div>
            <div className="flow-step-arrow">&rarr;</div>
            <div className="flow-step-box">
              <h4>3. Compare Same Expiry</h4>
              <p>Measure basis point gaps against the liquid GOLDTEN benchmark for the identical settlement date.</p>
            </div>
            <div className="flow-step-arrow">&rarr;</div>
            <div className="flow-step-box" style={{ border: '2px solid var(--brand-navy)', backgroundColor: '#FFFFFF' }}>
              <h4>4. Meaningful Gap Test</h4>
              <p>Test whether the remaining gap is a true dislocation or simply covers real-world transaction friction.</p>
            </div>
          </div>
        </div>

        {/* Normalisation Formula Banner & Interactive Calculator */}
        <div className="formula-banner-card" style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div className="formula-plain-text">
              <span className="formula-icon">&sum;</span>
              <span>
                <strong>Normalisation Formula:</strong> Price per gram of fine gold = Quoted Price &divide; Quote Grams &divide; Metal Purity.
              </span>
            </div>
            <button
              onClick={() => setShowFormula(!showFormula)}
              className="details-summary-btn"
            >
              <span>{showFormula ? 'Hide Formula Calculator' : 'Interactive Normalisation Calculator \u2193'}</span>
            </button>
          </div>

          {showFormula && (
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', alignItems: 'center' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Select Contract</label>
                  <select
                    className="terminal-input"
                    value={calcSymbol}
                    onChange={(e) => setCalcSymbol(SYMBOLS.find((s) => s === e.target.value) ?? 'GOLDTEN')}
                    style={{ marginTop: '4px', width: '100%' }}
                  >
                    <option value="GOLDM">GOLDM (10g quote, 995 purity)</option>
                    <option value="GOLDTEN">GOLDTEN (10g quote, 999 purity)</option>
                    <option value="GOLDGUINEA">GOLDGUINEA (8g quote, 999 purity)</option>
                    <option value="GOLDPETAL">GOLDPETAL (1g quote, 999 purity)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Quoted Screen Price (₹)</label>
                  <input
                    type="number"
                    className="terminal-input"
                    value={calcPrice}
                    onChange={(e) => setCalcPrice(parseFloat(e.target.value) || 0)}
                    style={{ marginTop: '4px', width: '100%' }}
                  />
                </div>
                <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Normalised Result</div>
                  <div className="font-mono" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brand-navy)', marginTop: '2px' }}>
                    ₹{finePrice.toFixed(2)} / g fine
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    ₹{calcPrice} &divide; {selected.quote}g &divide; {selected.purity}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Charts & Beta-Neutral Whole-Lot Calculator Grid */}
        <div className="split-grid" style={{ marginBottom: '32px' }}>
          {/* Left: Normalised Price History Chart */}
          <div className="terminal-panel-card">
            <div className="panel-header">
              <div>
                <h4 className="panel-title">Normalised Price History (₹ per Gram of Fine Gold)</h4>
                <p className="panel-subtitle">Converting all four contracts onto one scale shows true price agreement</p>
              </div>
              <span className="panel-badge">{count(series?.session.length, 'Sessions')}</span>
            </div>
            <div style={{ height: '320px', padding: '12px' }}>
              <PlotlyTerminalChart
                data={normalisedPriceChartData}
                options={{
                  yTitle: '₹ / gram fine',
                  showLegend: true,
                  legendOrientation: 'h',
                }}
              />
            </div>
          </div>

          {/* Right: Integer Beta-Neutral Whole-Lot Hedge Calculator */}
          <div>
            <HedgeCalculator />
          </div>
        </div>

        {/* Same-Expiry Premium vs Cost Hurdle Chart */}
        <div className="terminal-panel-card">
          <div className="panel-header">
            <div>
              <h4 className="panel-title">Same-Expiry Premium vs. {hurdleLabel} bps Cost Hurdle</h4>
              <p className="panel-subtitle">
                GOLDPETAL trades at a structural median premium of {bps(petal?.median)}; GOLDGUINEA at {bps(guinea?.median)}.
                These are standing retail lot premiums, not fleeting arbitrage.
              </p>
            </div>
            <span className="panel-badge">Hurdle: &plusmn;{hurdleLabel} bps</span>
          </div>
          <div style={{ height: '320px', padding: '12px' }}>
            <PlotlyTerminalChart
              data={premiumSpreadChartData}
              options={{
                yTitle: 'Spread (bps)',
                showLegend: true,
                legendOrientation: 'h',
              }}
            />
          </div>
          <div style={{ padding: '12px 20px', backgroundColor: 'var(--bg-surface-subtle)', borderTop: '1px solid var(--border-subtle)', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <strong>Key Finding:</strong> GOLDPETAL has never traded below {bps(petal?.min)} over GOLDTEN across all {count(petal?.n, 'sessions')}.
            Retail buyers consistently pay a premium for small lot sizing (1g), meaning this spread cannot simply be sold short profitably after friction.
          </div>
        </div>
      </div>
    </section>
  );
};
