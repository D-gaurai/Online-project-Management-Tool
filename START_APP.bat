@echo off
title GeForce Project Management App
cd /d "%~dp0"
echo ==============================================
echo   Starting GeForce Project Management Tool
echo ==============================================
echo.

set DB_USERNAME=root
set JWT_SECRET=thisIsALongRandomSecretKeyAtLeast32CharactersLong

:: Prompt for database password
set /p DB_PASSWORD=Enter your MySQL Password: 

echo.
echo Starting the Server (This may take a minute...)
echo Please wait...
echo.

cd backend
start /min cmd /c "mvn spring-boot:run"

:: Wait for server to start
timeout /t 10 /nobreak > nul

:: Open the browser
echo Opening the app in your browser...
start chrome --incognito http://localhost:8080/index.html
