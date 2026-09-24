@echo off
cd /d "%~dp0"
title DEVA Admin Reset
echo ========================================
echo       DEVA ADMIN RESET
echo ========================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is not installed.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Installing required packages...
  call npm.cmd install
  if errorlevel 1 pause & exit /b 1
)
echo Resetting admin password, lock and 2FA...
call npm.cmd run reset-admin
if errorlevel 1 (
  echo.
  echo RESET FAILED.
  pause
  exit /b 1
)
echo.
echo ========================================
echo LOGIN READY
echo Email:    admin@devafurniture.com
echo Password: Deva@2026Admin!
echo 2FA:      OFF
echo ========================================
echo.
echo Now run START_DEVA_LOCAL.bat
pause
