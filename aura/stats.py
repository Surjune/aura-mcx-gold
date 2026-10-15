"""Performance statistics: Sharpe, drawdown, block bootstrap, deflated Sharpe ratio."""
import math
from statistics import NormalDist

import numpy as np

TRADING_DAYS = 252
EULER_GAMMA = 0.5772156649
SEED = 26  # fixed so every re-run reports identical bootstrap numbers


def sharpe(daily: np.ndarray) -> float:
    sd = daily.std(ddof=1)
    return float(daily.mean() / sd * math.sqrt(TRADING_DAYS)) if sd > 0 else 0.0


def max_drawdown(daily: np.ndarray) -> float:
    equity = np.cumsum(daily)
    return float((equity - np.maximum.accumulate(np.concatenate([[0.0], equity]))[1:]).min()) if len(daily) else 0.0


def bootstrap_pvalue(daily: np.ndarray, block: int = 10, n: int = 5000) -> float:
    """Circular block bootstrap of mean daily P&L under a zero-mean null; one-sided p-value."""
    if len(daily) < block * 2:
        return float("nan")
    rng = np.random.default_rng(SEED)
    centred = daily - daily.mean()
    observed, T = daily.mean(), len(daily)
    starts = rng.integers(0, T, size=(n, math.ceil(T / block)))
    idx = (starts[:, :, None] + np.arange(block)[None, None, :]).reshape(n, -1)[:, :T] % T
    means = centred[idx].mean(axis=1)
    return float((means >= observed).mean())


def deflated_sharpe(daily: np.ndarray, trial_sharpes: list[float]) -> float:
    """Probability the true Sharpe exceeds what the best of N trials would show by luck.

    Bailey & Lopez de Prado (2014). Sharpes are per period (daily), not annualised.
    """
    T = len(daily)
    sd = daily.std(ddof=1)
    if T < 3 or sd == 0:
        return float("nan")
    sr = daily.mean() / sd
    z = (daily - daily.mean()) / sd
    skew, kurt = float((z ** 3).mean()), float((z ** 4).mean())
    n_trials = max(len(trial_sharpes), 1)
    var_trials = float(np.var(trial_sharpes, ddof=1)) if n_trials > 1 else 0.0
    nd = NormalDist()
    sr0 = math.sqrt(var_trials) * ((1 - EULER_GAMMA) * nd.inv_cdf(1 - 1 / n_trials)
                                   + EULER_GAMMA * nd.inv_cdf(1 - 1 / (n_trials * math.e))) if n_trials > 1 else 0.0
    denom = math.sqrt(max(1 - skew * sr + (kurt - 1) / 4 * sr ** 2, 1e-12))
    return float(nd.cdf((sr - sr0) * math.sqrt(T - 1) / denom))
