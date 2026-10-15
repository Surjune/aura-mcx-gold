@echo off
rem Starts the AuRA live MCX poller in this window. Close the window or press Ctrl+C to stop;
rem the day's session is archived to GitHub on stop, hourly, and at market close.
title AuRA live poller
cd /d "%~dp0"
".venv\Scripts\python.exe" -u -m aura.live
pause
