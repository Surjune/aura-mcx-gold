/**
 * AuRA Institutional Quantitative Terminal — Typed API Client Layer
 * Handles asynchronous communication with FastAPI backend endpoints, error handling,
 * and 15-second polling for live MCX order book snapshots.
 */

import {
  SummaryResponse,
  LifecyclePhase,
  SpreadSignal,
  BacktestResponse,
  SeriesResponse,
  LiveApiResponse,
} from '../types/aura';

class ApiClient {
  private baseUrl = '';

  private async fetchJson<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText} on ${endpoint}`);
      }

      return (await response.json()) as T;
    } catch (err) {
      console.error(`[AuRA API Error] failed to fetch ${endpoint}:`, err);
      throw err;
    }
  }

  public async getSummary(): Promise<SummaryResponse> {
    return this.fetchJson<SummaryResponse>('/api/summary');
  }

  public async getContracts(): Promise<LifecyclePhase[]> {
    return this.fetchJson<LifecyclePhase[]>('/api/contracts');
  }

  public async getSignals(): Promise<SpreadSignal[]> {
    return this.fetchJson<SpreadSignal[]>('/api/signals');
  }

  public async getBacktest(): Promise<BacktestResponse> {
    return this.fetchJson<BacktestResponse>('/api/backtest');
  }

  public async getSeries(): Promise<SeriesResponse> {
    return this.fetchJson<SeriesResponse>('/api/series');
  }

  public async getLive(): Promise<LiveApiResponse> {
    return this.fetchJson<LiveApiResponse>('/api/live');
  }

  /**
   * Starts a resilient 15-second polling cycle for live order book snapshots.
   * Returns an unsubscribe function to gracefully clear the interval on unmount.
   */
  public subscribeLivePolling(
    onTick: (data: LiveApiResponse) => void,
    onError?: (err: unknown) => void,
    intervalMs = 15000
  ): () => void {
    let active = true;

    const poll = async () => {
      if (!active) return;
      try {
        const data = await this.getLive();
        if (active) onTick(data);
      } catch (err) {
        if (active && onError) onError(err);
      }
    };

    // Initial immediate poll
    poll();
    const timerId = setInterval(poll, intervalMs);

    return () => {
      active = false;
      clearInterval(timerId);
    };
  }
}

export const apiClient = new ApiClient();
