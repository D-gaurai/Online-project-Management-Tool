@echo off
title GeForce Backend Server
cd /d "%~dp0"
set DB_USERNAME=root
set DB_PASSWORD=DEEPANSHU
set JWT_SECRET=thisIsALongRandomSecretKeyAtLeast32CharactersLong
echo ==============================================
echo    GeForce Backend Server Starting...
echo ==============================================
mvn spring-boot:run
pause
