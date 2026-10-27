import React from 'react';
import { TerminalPanel } from './TerminalPanel';

interface SafeguardItem {
  id: number;
  title: string;
  summary: string;
  codeSnippet: string;
  riskMitigated: string;
}

const SAFEGUARDS: SafeguardItem[] = [
  {
    id: 1,
    title: 'Silent Holiday / Weekend Date Fallback Guard',
    summary: 'MCX Bhavcopy API silently returns the previous active trading day when querying a holiday or weekend. AuRA asserts response_date == request_date to discard duplicate prints.',
    codeSnippet: 'assert resp["Date"] == requested_date',
    riskMitigated: 'Prevents duplicating stale prices as new trading sessions.',
  },
  {
    id: 2,
    title: 'Format & Whitespace Normaliser',
    summary: 'MCX bhavcopy payloads pad symbols and expiry dates with variable trailing spaces (e.g. "GOLDTEN   ", " 04SEP2026 "). AuRA strips whitespace and normalises into compact keys.',
    codeSnippet: 'symbol.strip().upper(), expiry.strftime("%d%b%Y").upper()',
    riskMitigated: 'Eliminates silent join failures and duplicated contract entities.',
  },
  {
    id: 3,
    title: 'No Continuous Near-Month Stitching',
    summary: 'Synthesizing an artificial "continuous" gold futures series introduces false price jumps on roll dates. AuRA preserves discrete contract expiries keyed strictly by expiry_date.',
    codeSnippet: 'ORDER BY expiry, session  # zero continuous stitching',
    riskMitigated: 'Prevents backtesting against phantom jump returns across rolls.',
  },
  {
    id: 4,
    title: 'Settlement Price ≠ Executable Fill Price',
    summary: 'Official Bhavcopy close is a volume-weighted settlement print computed during the final 30 minutes, not an executable quote. Trades must cross live bid/ask order book depth.',
    codeSnippet: 'exec_gap = sell_bid_spread if rich else buy_ask_spread',
    riskMitigated: 'Guards against paper profits that evaporate in live limit orders.',
  },
  {
    id: 5,
    title: 'Volume ≠ Market Depth (≥50% OI Liquidity Gate)',
    summary: 'High recorded volume does not guarantee executable market depth. AuRA enforces a 13.0 bps round-trip friction hurdle and gates entries until a contract holds ≥ 50% of symbol Open Interest.',
    codeSnippet: 'if contract.oi < 0.50 * total_oi: step_aside()',
    riskMitigated: 'Prevents executing into wide spreads and illiquid order books.',
  },
  {
    id: 6,
    title: 'GOLDTEN 2025 Listing History Boundary',
    summary: 'GOLDTEN was introduced by MCX in April 2025. Although older gold contracts exist across the full 716-session DuckDB database, relative-value comparisons with GOLDTEN strictly span Apr 2025 – Oct 2026.',
    codeSnippet: 'WHERE session >= \'2025-04-01\' AND symbol = \'GOLDTEN\'',
    riskMitigated: 'Eliminates survivorship and synthetic backfill bias before actual listing.',
  },
];

export const DataHygieneAuditor: React.FC = () => {
  return (
    <TerminalPanel
      title="Track 03 MCX Data Hygiene & Safeguards"
      badge="6 Institutional Safeguards"
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {SAFEGUARDS.map((sg) => (
          <div key={sg.id} className="audit-item">
            <span className="audit-status pass">SAFEGUARD {sg.id}</span>
            <div className="audit-body">
              <div className="audit-title">
                <span>{sg.title}</span>
              </div>
              <div className="audit-desc">
                {sg.summary}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                <span className="audit-code">{sg.codeSnippet}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  &bull; {sg.riskMitigated}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </TerminalPanel>
  );
};

export const McxDataHygieneAuditor = DataHygieneAuditor;
