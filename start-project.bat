@echo off
setlocal

REM Resolve script directory so this works from anywhere
set "ROOT=%~dp0"

echo Starting KrishiMitra backend and frontend...

start "KrishiMitra Backend" cmd /k "cd /d "%ROOT%backend" && npm run dev"
start "KrishiMitra Frontend" cmd /k "cd /d "%ROOT%frontend" && npm run dev"

echo Both services launched in separate windows.
echo Close this window or press any key to exit.
pause >nul
