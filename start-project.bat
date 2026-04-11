@echo off
setlocal

REM Resolve script directory so this works from anywhere
set "ROOT=%~dp0"

echo Starting KrishiMitra backend and frontend...

start "KrishiMitra Backend" cmd /k "cd /d "%ROOT%backend" && npm run dev"
start "KrishiMitra Frontend" cmd /k "cd /d "%ROOT%frontend" && npm run dev"
start "KrishiMitra AI" cmd /k "cd /d "%ROOT%" && .\.venv\Scripts\python.exe -m uvicorn API.main:app --app-dir .\AI --host 0.0.0.0 --port 8000 --reload"

echo Both services launched in separate windows.
echo Close this window or press any key to exit.
pause >nul