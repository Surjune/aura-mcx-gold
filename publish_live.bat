@echo off
rem Publishes the latest live session to the website right away, without waiting for the
rem hourly save. Run it while (or after) start_live.bat has been collecting data today.
title AuRA publish live session
cd /d "%~dp0"
".venv\Scripts\python.exe" -c "from aura.live import save_session; save_session('manual')"
echo Done. The website updates once Vercel redeploys (usually 1 to 10 minutes).
pause
