@echo off
title EBDCS Server
color 0A

echo.
echo  ==========================================
echo   EBDCS: Emergency Blood Donation
echo   Coordination System
echo  ==========================================
echo.

:: Kill anything running on port 5000
echo  Stopping any existing server on port 5000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 2^>nul') do (
    taskkill /PID %%a /F >nul 2>&1
)

:: Add Node.js to PATH
set PATH=%PATH%;C:\Program Files\nodejs

:: Go to backend folder
cd "C:\Users\Sai nikitha\.kiro\blood-coordination-system\backend"

echo  Starting server...
echo.
echo  ==========================================
echo   App running at: http://localhost:5000
echo  ==========================================
echo.
echo  Admin Login:
echo    Email:    admin@bloodbank.com
echo    Password: Admin@123456
echo.
echo  Press Ctrl+C to stop the server
echo.

:: Start server
node server.js

pause
