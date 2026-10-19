@echo off
rem Refresh the research data on the public site: pull new MCX sessions, rerun the
rem analysis, check it, publish. Nothing is pushed unless every step succeeds.
title AuRA site update
cd /d "%~dp0"

echo [1/4] Pulling new MCX sessions (only days not already cached)...
".venv\Scripts\python.exe" -m aura.ingest || goto :fail

echo [2/4] Running the analysis...
".venv\Scripts\python.exe" -m aura.report || goto :fail

echo [3/4] Running the tests...
".venv\Scripts\python.exe" -m pytest -q || goto :fail

echo [4/4] Publishing...
git add data/results.json
git diff --cached --quiet && (echo No new data to publish. & goto :done)
git commit -m "Data refresh %date%" || goto :fail
git push || goto :fail
echo Published. Vercel redeploys in about a minute.

:done
pause
exit /b 0

:fail
echo Update stopped before publishing. The public site is unchanged.
pause
exit /b 1
