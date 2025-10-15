@echo off
setlocal ENABLEDELAYEDEXPANSION

REM ===== Simple one-click starter (ASCII only) =====
REM This script installs deps, starts server on PORT, and opens browser.

set ROOT_DIR=%~dp0
set SERVER_DIR=%ROOT_DIR%server
set PORT=3000

title Website Starter - One Click
echo [INFO] Initializing...

REM Check Node.js
where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js not found. Opening download page...
  start "" "https://nodejs.org/"
  pause
  exit /b 1
)

REM Enter server directory
cd /d "%SERVER_DIR%"
if errorlevel 1 (
  echo [ERROR] Cannot enter server directory: %SERVER_DIR%
  pause
  exit /b 1
)

REM Install dependencies
echo [INFO] Installing dependencies (npm install)...
call npm install
if errorlevel 1 (
  echo [ERROR] npm install failed.
  pause
  exit /b 1
)

REM Start server in a new window
echo [INFO] Starting server on PORT %PORT%...
start "Website Dev Server" cmd /c "set PORT=%PORT% && npm start"

REM Wait a moment
timeout /t 3 /nobreak >nul

REM Open default browser
set URL=http://localhost:%PORT%/index.html
echo [INFO] Opening browser: %URL%
start "" "%URL%"

echo [DONE] If browser didn't open, manually visit: %URL%
pause