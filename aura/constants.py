"""Small runtime constants shared by research and live-monitor modules.

This module must stay dependency-free: Vercel imports it while serving the lightweight
poll endpoint, whereas pandas and DuckDB are needed only for local research workflows.
"""

MIN_DTE = 7  # Delivery-window contracts are never used as the live reference leg.

USER_AGENT = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) "
              "Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0")
