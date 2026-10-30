import React, { useState } from 'react';
import { TerminalPanel } from './TerminalPanel';
import { useTerminal } from '../store/terminalStore';
import { DepthLevel } from '../types/aura';

interface BookLevel {
  price: number;
  qty: number;
}

interface Sweep {
  avgPrice: number;
  slippageBps: number;
  filledLots: number;
}

/** Walk the recorded book level by level. Returns null if the order is larger than the visible depth. */
const sweep = (lots: number, levels: BookLevel[]): Sweep | null => {
  let remaining = lots;
  let cost = 0;
  for (const lvl of levels) {
    const take = Math.min(remaining, lvl.qty);
    cost += take * lvl.price;
    remaining -= take;
    if (remaining <= 0) break;
  }
  if (remaining > 0 || levels.length === 0) return null;
  const avgPrice = cost / lots;
  return { avgPrice, slippageBps: Math.abs((avgPrice - levels[0].price) / levels[0].price) * 1e4, filledLots: lots };
};

const side = (depth: DepthLevel[], key: 'bid' | 'ask'): BookLevel[] =>
  depth.flatMap((d) => {
    const price = d[key];
    const qty = d[key === 'bid' ? 'bid_qty' : 'ask_qty'];
    return price && qty ? [{ price, qty }] : [];
  });

const money = (v: number | null | undefined): string => (v ? `\u20B9${v.toLocaleString('en-IN')}` : '\u2014');

export const LiveOrderBookLadder: React.FC = () => {
  const { live, slippageLots, setSlippageLots } = useTerminal();
  const [selectedContractIdx, setSelectedContractIdx] = useState<number>(0);

  const snapshot = live?.snapshot;
  const contracts = snapshot?.contracts ?? [];
  const activeContract = contracts[selectedContractIdx] ?? contracts[0];
  const depth = activeContract?.depth ?? [];
  const bids = side(depth, 'bid');
  const asks = side(depth, 'ask');
  const hasDepth = bids.length > 0 || asks.length > 0;
  const maxQty = Math.max(1, ...bids.map((b) => b.qty), ...asks.map((a) => a.qty));

  const buy = sweep(slippageLots, asks);
  const sell = sweep(slippageLots, bids);
  const visibleAsk = asks.reduce((s, a) => s + a.qty, 0);
  const visibleBid = bids.reduce((s, b) => s + b.qty, 0);

  const spread = activeContract?.bid && activeContract?.ask ? activeContract.ask - activeContract.bid : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <TerminalPanel
        title={`MCX 5-Level Order Book: ${activeContract?.symbol ?? '\u2014'} (${activeContract?.expiry ?? '\u2014'})`}
        badge={snapshot?.polled_ist ? `Recorded ${snapshot.polled_ist} IST` : 'No snapshot'}
        controls={
          contracts.map((c, idx) => (
            <button
              key={c.symbol + c.expiry}
              className={`btn-terminal ${selectedContractIdx === idx ? 'active' : ''}`}
              onClick={() => setSelectedContractIdx(idx)}
              title={`${c.symbol} expiring ${c.expiry}`}
            >
              {c.symbol} {c.expiry.slice(5)}
            </button>
          ))
        }
      >
        {!activeContract ? (
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No live snapshot is available.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px 16px',
                padding: '12px 16px',
                backgroundColor: 'var(--bg-surface-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                fontSize: '13px',
              }}
            >
              <span>
                <span style={{ color: 'var(--text-secondary)' }}>LTP: </span>
                <strong className="font-mono">{money(activeContract.ltp)}</strong>
                {activeContract.change_pct !== null && activeContract.change_pct !== undefined && (
                  <span
                    className="font-mono"
                    style={{
                      marginLeft: '8px',
                      fontWeight: 600,
                      color: activeContract.change_pct >= 0 ? 'var(--semantic-emerald)' : 'var(--semantic-crimson)',
                    }}
                  >
                    {activeContract.change_pct >= 0 ? '+' : ''}{activeContract.change_pct.toFixed(2)}%
                  </span>
                )}
              </span>
              <span>
                <span style={{ color: 'var(--text-secondary)' }}>Bid-Ask Spread: </span>
                <strong className="font-mono">
                  {spread !== null ? `\u20B9${spread.toFixed(1)}` : '\u2014'}
                  {activeContract.spread_bps ? ` (${activeContract.spread_bps.toFixed(1)} bps)` : ''}
                </strong>
              </span>
              <span>
                <span style={{ color: 'var(--text-secondary)' }}>Volume / OI: </span>
                <strong className="font-mono">
                  {activeContract.volume?.toLocaleString() ?? '\u2014'} / {activeContract.oi?.toLocaleString() ?? '\u2014'}
                </strong>
              </span>
            </div>

            {hasDepth ? (
              <div className="orderbook-ladder">
                <div className="orderbook-side bid">
                  <div className="orderbook-row" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    <span>QTY (LOTS)</span>
                    <span style={{ textAlign: 'right' }}>BID (₹)</span>
                  </div>
                  {bids.map((b, i) => (
                    <div key={`bid-${i}`} className="orderbook-row">
                      <div className="orderbook-depth-bar" style={{ width: `${(b.qty / maxQty) * 100}%` }} />
                      <span className="orderbook-cell">{b.qty.toLocaleString()}</span>
                      <span className="orderbook-cell" style={{ textAlign: 'right', color: 'var(--semantic-emerald)', fontWeight: 600 }}>
                        {b.price.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="orderbook-side ask">
                  <div className="orderbook-row" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    <span>ASK (₹)</span>
                    <span style={{ textAlign: 'right' }}>QTY (LOTS)</span>
                  </div>
                  {asks.map((a, i) => (
                    <div key={`ask-${i}`} className="orderbook-row">
                      <div className="orderbook-depth-bar" style={{ width: `${(a.qty / maxQty) * 100}%` }} />
                      <span className="orderbook-cell" style={{ color: 'var(--semantic-crimson)', fontWeight: 600 }}>
                        {a.price.toLocaleString('en-IN')}
                      </span>
                      <span className="orderbook-cell" style={{ textAlign: 'right' }}>{a.qty.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="terminal-callout" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                This snapshot does not include order-book depth (it was recorded before depth capture, or MCX sent an
                empty book). Best bid: <strong className="font-mono">{money(activeContract.bid)}</strong>, best ask:{' '}
                <strong className="font-mono">{money(activeContract.ask)}</strong>. The ladder fills in once the poller publishes
                a snapshot with depth.
              </div>
            )}
          </div>
        )}
      </TerminalPanel>

      <TerminalPanel title="Market Impact & Slippage Simulator" badge={hasDepth ? 'Sweeps the recorded book' : 'Needs depth'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ width: '200px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                Order Size (Lots to Sweep)
              </label>
              <input
                type="number"
                min={1}
                max={10000}
                className="terminal-input"
                value={slippageLots}
                onChange={(e) => setSlippageLots(Math.max(1, parseInt(e.target.value || '1', 10)))}
                style={{ marginTop: '4px' }}
              />
            </div>
            <div style={{ flex: 1, minWidth: '220px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              Walks the recorded MCX order book level by level. Anything beyond the visible 5 levels is not
              estimated, because the price of hidden liquidity is unknown.
            </div>
          </div>

          <div className="split-grid-even" style={{ gap: '12px' }}>
            {([
              ['BUY SWEEP (LIFTING ASKS)', buy, visibleAsk, asks[0]?.price, 'ask'],
              ['SELL SWEEP (HITTING BIDS)', sell, visibleBid, bids[0]?.price, 'bid'],
            ] as const).map(([label, result, visible, best, sideName]) => (
              <div
                key={label}
                style={{ padding: '16px', backgroundColor: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}
              >
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</div>
                <div className="font-mono" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {result ? `Avg: \u20B9${result.avgPrice.toFixed(2)} (+${result.slippageBps.toFixed(2)} bps)` : '\u2014'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {!hasDepth
                    ? 'No recorded depth for this snapshot.'
                    : result
                    ? `Best ${sideName} ${money(best)} \u2022 slippage vs best level`
                    : `Order exceeds the ${visible.toLocaleString()} lots visible on the ${sideName} side.`}
                </div>
              </div>
            ))}
          </div>
        </div>
      </TerminalPanel>
    </div>
  );
};
