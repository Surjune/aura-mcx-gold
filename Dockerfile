# Playwright's official image supplies Chromium and the OS libraries needed by the
# fallback MCX browser collector. Production should prefer LIVE_SOURCE=angelone.
FROM mcr.microsoft.com/playwright/python:v1.47.0-jammy

WORKDIR /app
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PLAYWRIGHT_BROWSER=chromium

COPY requirements-worker.txt ./
RUN pip install --no-cache-dir -r requirements-worker.txt

# The worker needs only monitor code plus the published historical model artifact.
COPY aura ./aura
COPY data/results.json ./data/results.json

CMD ["python", "-u", "-m", "aura.worker"]
