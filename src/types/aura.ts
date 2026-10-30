/**
 * AuRA Institutional Quantitative Terminal — TypeScript Data Contracts
 * Strictly bound to FastAPI response payloads and MCX exchange mechanics.
 */

export interface ContractSpec {
  symbol: 'GOLDM' | 'GOLDTEN' | 'GOLDGUINEA' | 'GOLDPETAL';
  lot_g: number;
  quote_g: number;
  purity: number;
  expiry_window: string;
  description?: string;
}

export interface NormalisedQuote {
  symbol: string;
  expiry: string;
  ltp: number;
  bid: number | null;
  ask: number | null;
  prev_close: number;
  change_pct: number;
  volume: number;
  oi: number;
  as_on: number;
  spread_bps: number | null;
  fine: number;
  /** Up to 5 order-book levels; absent on snapshots recorded before depth was captured. */
  depth?: DepthLevel[];
}

export interface DepthLevel {
  bid: number | null;
  bid_qty: number | null;
  ask: number | null;
  ask_qty: number | null;
}

export interface SpreadSignal {
  pair: string;
  session: string;
  expiry: string;
  premium_bps: number;
  mean_bps: number;
  z: number;
  gap_bps: number;
  dte: number;
  action: 'normal' | 'watch' | 'flagged' | string;
  why: string;
  validated: string;
}

export interface CarryDecompositionSeries {
  session: string[];
  ten_fine: number[];
  petal_fine: number[];
  guinea_fine: number[];
  m_fine: number[];
  prem_petal: number[];
  prem_guinea: number[];
  m_naive: number[];
  m_purity: number[];
  m_carry: number[];
  carry_pa: number[];
  equity: {
    GOLDPETAL: number[];
    GOLDGUINEA: number[];
  };
}

export interface PerformanceWindowMetrics {
  from: string;
  to: string;
  sessions: number;
  trades: number;
  win_rate: number | null;
  gross_rs: number;
  costs_rs: number;
  net_rs: number;
  gross_bps_per_trade: number | null;
  cost_bps_per_trade: number | null;
  net_bps_per_trade: number | null;
  avg_hold: number | null;
  best_trade_share: number | null;
  net_bps_ex_best: number | null;
  sharpe: number;
  max_dd_rs: number;
  corr_gold: number;
  beta_rs_per_1pct_gold: number;
  bootstrap_p: number;
  deflated_sharpe_prob: number | null;
}

export interface WalkForwardGridItem {
  window: number;
  z_in: number;
  dev_sharpe: number;
}

export interface WalkForwardSymbolConfig {
  window: number;
  z_in: number;
  z_out: number;
  max_hold: number;
  entry_dte: number;
  exit_dte: number;
}

export interface WalkForwardMetrics {
  symbol: string;
  chosen: WalkForwardSymbolConfig;
  holdout_from: string;
  grid: WalkForwardGridItem[];
  development: PerformanceWindowMetrics;
  holdout: PerformanceWindowMetrics;
  full: PerformanceWindowMetrics;
}

export interface TradeRecord {
  entry: string;
  exit: string;
  side: 'long X' | 'short X' | string;
  held: number;
  gross: number;
  costs: number;
  net: number;
  notional: number;
}

export interface LifecyclePhase {
  symbol: string;
  expiry: string;
  first_traded: string;
  listed_before_data: boolean;
  became_liquid: string;
  sessions_to_liquid: number;
  peak_oi_lots: number;
  delivery_window_from: string;
  last_traded: string;
}

export interface OrderBookLevel {
  BidPrice?: number | null;
  BidQty?: number | null;
  AskPrice?: number | null;
  AskQty?: number | null;
}

export interface LivePairClassification {
  pair: string;
  premium_bps: number;
  exec_sell_bps: number | null;
  exec_buy_bps: number | null;
  mean_bps: number;
  sd_bps: number;
  window: number;
  z: number;
  gap_bps: number;
  exec_gap_bps: number | null;
  status: 'normal' | 'watch' | 'flagged';
  why: string;
}

export interface LiveOrderBookSnapshot {
  as_on: number;
  as_on_ist: string;
  published: number;
  polled_ist: string;
  poll_s: number;
  market_open: boolean;
  contracts: NormalisedQuote[];
  pairs: LivePairClassification[];
  carry_pa: number;
  hurdle_bps: number;
  verdict: {
    edge: boolean;
    reason: string;
  };
}

export interface LiveTick {
  t: number;
  p0: number;
  p1: number;
  p2: number;
  e0: number | null;
  e1: number | null;
  e2: number | null;
}

export interface LiveApiResponse {
  status: 'live' | 'closed' | 'delayed' | 'replay' | 'offline';
  age_s?: number;
  source: string | null;
  snapshot?: LiveOrderBookSnapshot;
  ticks: LiveTick[];
}

export interface SummaryDataHeader {
  from: string;
  to: string;
  sessions: number;
  rows: number;
  contracts: number;
}

export interface PremiumStats {
  n: number;
  mean: number;
  sd: number;
  median: number;
  p05: number;
  p95: number;
  min: number;
  max: number;
  share_positive: number;
  half_life?: number;
}

export interface CarryStats {
  n: number;
  mean: number;
  sd: number;
  median: number;
  p05: number;
  p95: number;
  min: number;
  max: number;
  share_positive: number;
}

export interface RollSplitStats {
  days: number;
  var_total: number;
  var_roll: number;
  var_shift: number;
  mean_roll_bps: number;
  mean_shift_bps: number;
  share_abs_move_from_roll: number;
}

export interface SummaryResponse {
  data: SummaryDataHeader;
  premiums: Record<string, PremiumStats>;
  carry_pa: CarryStats;
  roll_split: RollSplitStats;
  hurdle_bps: number;
  verdict: {
    edge: boolean;
    reason: string;
  };
}

export interface BacktestResponse {
  summary: Record<string, WalkForwardMetrics>;
  trades: Record<string, TradeRecord[]>;
}

export interface SeriesResponse {
  session: string[];
  ten_fine: number[];
  petal_fine: number[];
  guinea_fine: number[];
  m_fine: number[];
  prem_petal: number[];
  prem_guinea: number[];
  m_naive: number[];
  m_purity: number[];
  m_carry: number[];
  carry_pa: number[];
  equity: {
    GOLDPETAL: number[];
    GOLDGUINEA: number[];
  };
}

// Global Terminal State Interfaces
export type WorkspaceTabId = 1 | 2 | 3 | 4 | 5 | 6;

export interface TelemetryRibbonState {
  anchorFineGrams: number;
  goldmCarryAdjBps: number;
  petalPremBps: number;
  guineaPremBps: number;
  rtHurdleBps: number;
  signalGateStatus: 'QUIET' | 'ALERT';
}
