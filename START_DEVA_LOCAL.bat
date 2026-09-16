@echo off
cd /d "%~dp0"
echo ========================================
echo   DEVA - Local Server + QR Rewards

echo ========================================
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Install Node.js LTS first.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Installing required packages...
  call npm install
  if errorlevel 1 pause & exit /b 1
)
for /f "usebackq delims=" %%i in (`powershell -NoProfile -Command "$ip=(Get-NetIPAddress -AddressFamily IPv4 ^| ? {$_.IPAddress -notlike '127.*' -and $_.PrefixOrigin -ne 'WellKnown'} ^| Sort-Object InterfaceMetric ^| Select-Object -First 1 -ExpandProperty IPAddress); if($ip){$ip}else{'localhost'}"`) do set LANIP=%%i
powershell -NoProfile -Command "$p='.env'; $c=Get-Content $p; $c=$c -replace '^PUBLIC_BASE_URL=.*','PUBLIC_BASE_URL=http://%LANIP%:3000'; $c=$c -replace '^ALLOWED_ORIGINS=.*','ALLOWED_ORIGINS=http://localhost:3000,http://%LANIP%:3000'; Set-Content -Encoding UTF8 $p $c"
echo.
echo Computer: http://localhost:3000
echo Phone:    http://%LANIP%:3000
echo.
echo IMPORTANT: phone and computer must use the same Wi-Fi.
echo Keep this window open while testing QR.
echo.
start "" "http://localhost:3000"
call npm run dev
pause
