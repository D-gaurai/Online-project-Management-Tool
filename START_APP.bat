@echo off
title GeForce Project Management App
cd /d "%~dp0"

echo ==============================================
echo   GeForce Project Management - 1-Click Start
echo ==============================================
echo.

:: 1. Clean up any stuck process on port 8080
powershell -NoProfile -Command "$conn = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue; if ($conn) { Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue }"

:: 2. Find backend directory
set "BACKEND_DIR=%~dp0backend"
if not exist "%BACKEND_DIR%" set "BACKEND_DIR=%~dp0ProjectManagement\backend"

:: 3. Launch backend server
echo [1/2] Starting GeForce Backend Server...
pushd "%BACKEND_DIR%"
start "GeForce Backend Server" run_server.bat
popd

:: 4. Dynamically wait until http://localhost:8080 is LIVE
echo [2/2] Waiting for server to initialize...
powershell -NoProfile -Command "for ($i=0; $i -lt 35; $i++) { Start-Sleep -Seconds 2; try { $res = Invoke-WebRequest -Uri 'http://localhost:8080/index.html' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop; if ($res.StatusCode -eq 200) { break } } catch {} }"

:: 5. Open browser
echo.
echo Launching GeForce in browser...
start chrome --incognito http://localhost:8080/index.html
