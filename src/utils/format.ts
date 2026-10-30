/**
 * Display formatting for API figures. A missing value renders as an em dash,
 * never as a stand-in number: the page must only show figures the backend produced.
 */

const DASH = '—';

const isNum = (v: number | null | undefined): v is number => typeof v === 'number' && Number.isFinite(v);

export const num = (v: number | null | undefined, digits = 1): string => (isNum(v) ? v.toFixed(digits) : DASH);

export const bps = (v: number | null | undefined, digits = 1): string =>
  isNum(v) ? `${v >= 0 ? '+' : '\u2212'}${Math.abs(v).toFixed(digits)} bps` : DASH;

export const pct = (share: number | null | undefined, digits = 1): string =>
  isNum(share) ? `${(share * 100).toFixed(digits)}%` : DASH;

export const count = (v: number | null | undefined, unit: string): string =>
  isNum(v) ? `${v.toLocaleString()} ${unit}` : DASH;

export const rupees = (v: number | null | undefined): string =>
  isNum(v) ? `\u20B9${Math.round(v).toLocaleString('en-IN')}` : DASH;

const MONTH_YEAR = new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' });
const DAY_MONTH_YEAR = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

/** ISO date (YYYY-MM-DD) -> "Apr 2025". */
export const monthYear = (iso: string | null | undefined): string => (iso ? MONTH_YEAR.format(new Date(`${iso}T00:00:00Z`)) : DASH);

/** ISO date (YYYY-MM-DD) -> "30 Jan 2026". */
export const dayMonthYear = (iso: string | null | undefined): string =>
  iso ? DAY_MONTH_YEAR.format(new Date(`${iso}T00:00:00Z`)) : DASH;

export const monthRange = (from: string | null | undefined, to: string | null | undefined): string =>
  from && to ? `${monthYear(from)} \u2013 ${monthYear(to)}` : DASH;
