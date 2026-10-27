@echo off
title GeForce Project Management App
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start_server.ps1"
if %errorlevel% neq 0 (
    echo.
    echo Something went wrong. Press any key to exit.
    pause > nul
)
