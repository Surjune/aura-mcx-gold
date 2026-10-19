@echo off
rem Starts the AuRA live MCX poller in this window. It publishes the session to the website
rem every hour and at market close. To stop, press Ctrl+C: that publishes one last time.
rem Closing the window with X skips that final publish.
title AuRA live poller
cd /d "%~dp0"
".venv\Scripts\python.exe" -u -m aura.live
pause
