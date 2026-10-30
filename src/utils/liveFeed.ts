/**
 * Live feed state helpers.
 * The backend's `/api/live` status is the single source of truth: a snapshot's own
 * `market_open` flag only says whether MCX was open when it was recorded, so an
 * archived snapshot from a trading session must never be presented as live.
 */

import { LiveApiResponse } from '../types/aura';

export type FeedState = LiveApiResponse['status'] | 'loading';

export interface FeedDescription {
  state: FeedState;
  isLive: boolean;
  marketLabel: string;
  headerLabel: string;
  stateTag: string;
  pillClass: 'market-state' | 'closed-state' | 'watch-state';
  dotColor: string;
}

const MUTED_DOT = '#94A3B8';

const FEED_STATES: Record<FeedState, Omit<FeedDescription, 'state' | 'isLive'>> = {
  live: { marketLabel: 'MCX Market Open', headerLabel: 'Live', stateTag: 'LIVE', pillClass: 'market-state', dotColor: 'var(--semantic-emerald)' },
  closed: { marketLabel: 'MCX Market Closed', headerLabel: 'MCX Closed', stateTag: 'MARKET CLOSED', pillClass: 'closed-state', dotColor: MUTED_DOT },
  delayed: { marketLabel: 'Feed Delayed', headerLabel: 'Delayed', stateTag: 'DELAYED', pillClass: 'watch-state', dotColor: 'var(--semantic-amber)' },
  replay: { marketLabel: 'Not Live', headerLabel: 'Replay', stateTag: 'ARCHIVE REPLAY', pillClass: 'watch-state', dotColor: MUTED_DOT },
  offline: { marketLabel: 'Feed Offline', headerLabel: 'Offline', stateTag: 'OFFLINE', pillClass: 'closed-state', dotColor: MUTED_DOT },
  loading: { marketLabel: 'Connecting', headerLabel: 'Connecting', stateTag: 'CONNECTING', pillClass: 'closed-state', dotColor: MUTED_DOT },
};

export const describeFeed = (live: LiveApiResponse | null): FeedDescription => {
  const state: FeedState = live?.status ?? 'loading';
  return { state, isLive: state === 'live', ...FEED_STATES[state] };
};

const SOURCE_LABELS: Record<string, string> = {
  upstash: 'Live Feed',
  local: 'Local Poller',
  'session archive': 'Session Archive',
};

export const sourceLabel = (source: string | null): string =>
  source ? SOURCE_LABELS[source] ?? source : 'No Source';

export const formatAge = (seconds?: number): string | null => {
  if (seconds === undefined || !Number.isFinite(seconds)) return null;
  const units: [number, string][] = [[86400, 'day'], [3600, 'hour'], [60, 'min']];
  for (const [size, name] of units) {
    if (seconds >= size) {
      const n = Math.floor(seconds / size);
      return `${n} ${name}${n === 1 || name === 'min' ? '' : 's'} ago`;
    }
  }
  return `${Math.max(0, Math.round(seconds))} s ago`;
};

const IST_TIME = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kolkata',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

/** Epoch seconds -> HH:MM:SS in IST, whatever the viewer's own time zone. */
export const formatIstTime = (epochSeconds: number): string => IST_TIME.format(new Date(epochSeconds * 1000));

export const signedBps = (value: number): string => `${value >= 0 ? '+' : ''}${value.toFixed(1)} bps`;
