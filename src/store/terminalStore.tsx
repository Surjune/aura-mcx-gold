/**
 * AuRA Institutional Quantitative Terminal — Reactive State Store
 * Manages active workspaces, keyboard routing (1-6), API cache,
 * live 15s order book polling, trace toggles, and hedge calculator state.
 */

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  WorkspaceTabId,
  SummaryResponse,
  LifecyclePhase,
  SpreadSignal,
  BacktestResponse,
  SeriesResponse,
  LiveApiResponse,
} from '../types/aura';
import { apiClient } from '../services/apiClient';

export interface TerminalContextType {
  // Navigation & Routing
  activeWorkspace: WorkspaceTabId;
  setActiveWorkspace: (id: WorkspaceTabId) => void;

  // Workspace 2 State
  traceFilter: 'ALL' | 'NAIVE' | 'PURITY' | 'CARRY';
  setTraceFilter: (filter: 'ALL' | 'NAIVE' | 'PURITY' | 'CARRY') => void;

  // Workspace 3 State
  inspectCrashOutlier: boolean;
  setInspectCrashOutlier: (inspect: boolean | ((prev: boolean) => boolean)) => void;

  // Workspace 5 State
  slippageLots: number;
  setSlippageLots: (lots: number) => void;

  // API Data Stores
  summary: SummaryResponse | null;
  contracts: LifecyclePhase[] | null;
  signals: SpreadSignal[] | null;
  backtest: BacktestResponse | null;
  series: SeriesResponse | null;
  live: LiveApiResponse | null;
  isLoading: boolean;
  error: string | null;
  isRefreshingLive: boolean;
  liveError: string | null;

  // Telemetry Ribbon Derived State
  telemetry: {
    anchorFineGrams: number;
    goldmCarryAdjBps: number;
    petalPremBps: number;
    guineaPremBps: number;
    rtHurdleBps: number;
    signalGateStatus: 'QUIET' | 'ALERT';
    liveSource: string | null;
    isPollerActive: boolean;
  };

  // Actions
  refreshAll: () => Promise<void>;
  refreshLive: () => Promise<void>;
}

const TerminalContext = createContext<TerminalContextType | null>(null);

export const TerminalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Determine initial workspace from URL or root attribute
  const getInitialWorkspace = (): WorkspaceTabId => {
    if (typeof window === 'undefined') return 1;
    const rootEl = document.getElementById('root');
    const attr = rootEl?.getAttribute('data-initial-workspace');
    if (attr === '5' || window.location.pathname.includes('/live')) {
      return 5;
    }
    const hash = window.location.hash.replace('#', '');
    const num = parseInt(hash, 10);
    if (num >= 1 && num <= 6) return num as WorkspaceTabId;
    return 1;
  };

  const [activeWorkspace, setActiveWorkspaceState] = useState<WorkspaceTabId>(getInitialWorkspace);
  const [traceFilter, setTraceFilter] = useState<'ALL' | 'NAIVE' | 'PURITY' | 'CARRY'>('ALL');
  const [inspectCrashOutlier, setInspectCrashOutlier] = useState<boolean>(false);
  const [slippageLots, setSlippageLots] = useState<number>(1);

  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [contracts, setContracts] = useState<LifecyclePhase[] | null>(null);
  const [signals, setSignals] = useState<SpreadSignal[] | null>(null);
  const [backtest, setBacktest] = useState<BacktestResponse | null>(null);
  const [series, setSeries] = useState<SeriesResponse | null>(null);
  const [live, setLive] = useState<LiveApiResponse | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshingLive, setIsRefreshingLive] = useState<boolean>(false);
  const [liveError, setLiveError] = useState<string | null>(null);

  const setActiveWorkspace = useCallback((id: WorkspaceTabId) => {
    setActiveWorkspaceState(id);
    if (typeof window !== 'undefined') {
      window.location.hash = `#${id}`;
      if (id === 5) {
        window.history.replaceState(null, '', '/live');
      } else {
        window.history.replaceState(null, '', `/#${id}`);
      }
    }
  }, []);

  // Keyboard shortcut listener (Keys 1 - 6)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (['1', '2', '3', '4', '5', '6'].includes(e.key)) {
        e.preventDefault();
        setActiveWorkspace(parseInt(e.key, 10) as WorkspaceTabId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveWorkspace]);

  // Initial data loading
  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sumRes, conRes, sigRes, btestRes, serRes, liveRes] = await Promise.all([
        apiClient.getSummary().catch(e => { console.warn('summary err', e); return null; }),
        apiClient.getContracts().catch(e => { console.warn('contracts err', e); return null; }),
        apiClient.getSignals().catch(e => { console.warn('signals err', e); return null; }),
        apiClient.getBacktest().catch(e => { console.warn('backtest err', e); return null; }),
        apiClient.getSeries().catch(e => { console.warn('series err', e); return null; }),
        apiClient.getLive().catch(e => { console.warn('live err', e); return null; }),
      ]);

      if (sumRes) setSummary(sumRes);
      if (conRes) setContracts(conRes);
      if (sigRes) setSignals(sigRes);
      if (btestRes) setBacktest(btestRes);
      if (serRes) setSeries(serRes);
      if (liveRes) setLive(liveRes);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terminal API Connection Failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const onLiveError = useCallback((err: unknown) => {
    console.warn('[AuRA Live Poll Warning]', err);
    setLiveError(err instanceof Error ? err.message : 'Live feed request failed');
  }, []);

  const onLiveData = useCallback((data: LiveApiResponse) => {
    setLive(data);
    setLiveError(null);
  }, []);

  const refreshLive = useCallback(async () => {
    setIsRefreshingLive(true);
    try {
      onLiveData(await apiClient.getLive());
    } catch (err: unknown) {
      onLiveError(err);
    } finally {
      setIsRefreshingLive(false);
    }
  }, [onLiveData, onLiveError]);

  // Live order book 15-second polling subscription
  useEffect(() => {
    const unsubscribe = apiClient.subscribeLivePolling(onLiveData, onLiveError, 15000);

    return () => unsubscribe();
  }, [onLiveData, onLiveError]);

  // Compute live telemetry for the Tier-1 ribbon
  const telemetry = useMemo(() => {
    let anchorFineGrams = 14550.55;
    let goldmCarryAdjBps = 7.1;
    let petalPremBps = 68.8;
    let guineaPremBps = 50.8;
    let rtHurdleBps = summary?.hurdle_bps ?? 13.0762;
    let signalGateStatus: 'QUIET' | 'ALERT' = 'QUIET';
    let liveSource = live?.source ?? null;
    let isPollerActive = live?.status === 'live';

    if (live?.snapshot) {
      const ten = live.snapshot.contracts.find(c => c.symbol === 'GOLDTEN');
      if (ten?.fine) anchorFineGrams = ten.fine;

      const pPetal = live.snapshot.pairs.find(p => p.pair.includes('GOLDPETAL'));
      if (pPetal) petalPremBps = pPetal.premium_bps;

      const pGuinea = live.snapshot.pairs.find(p => p.pair.includes('GOLDGUINEA'));
      if (pGuinea) guineaPremBps = pGuinea.premium_bps;

      const pM = live.snapshot.pairs.find(p => p.pair.includes('GOLDM'));
      if (pM) goldmCarryAdjBps = pM.premium_bps;

      if (live.snapshot.hurdle_bps) rtHurdleBps = live.snapshot.hurdle_bps;

      // Check if any pair triggered flagged status
      const hasFlagged = live.snapshot.pairs.some(p => p.status === 'flagged');
      if (hasFlagged && isPollerActive) signalGateStatus = 'ALERT';
    } else if (series) {
      const n = series.session.length;
      if (n > 0) {
        anchorFineGrams = series.ten_fine[n - 1] ?? anchorFineGrams;
        goldmCarryAdjBps = series.m_carry[n - 1] ?? goldmCarryAdjBps;
        petalPremBps = series.prem_petal[n - 1] ?? petalPremBps;
        guineaPremBps = series.prem_guinea[n - 1] ?? guineaPremBps;
      }
    }

    return {
      anchorFineGrams,
      goldmCarryAdjBps,
      petalPremBps,
      guineaPremBps,
      rtHurdleBps,
      signalGateStatus,
      liveSource,
      isPollerActive,
    };
  }, [summary, live, series]);

  return (
    <TerminalContext.Provider
      value={{
        activeWorkspace,
        setActiveWorkspace,
        traceFilter,
        setTraceFilter,
        inspectCrashOutlier,
        setInspectCrashOutlier,
        slippageLots,
        setSlippageLots,
        summary,
        contracts,
        signals,
        backtest,
        series,
        live,
        isLoading,
        error,
        isRefreshingLive,
        liveError,
        telemetry,
        refreshAll,
        refreshLive,
      }}
    >
      {children}
    </TerminalContext.Provider>
  );
};

export const useTerminal = (): TerminalContextType => {
  const context = useContext(TerminalContext);
  if (!context) {
    throw new Error('useTerminal must be used within a TerminalProvider');
  }
  return context;
};
