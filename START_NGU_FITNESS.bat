@echo off
REM ========================================
REM  NGU Fitness - One-Click Startup
REM ========================================

title NGU Fitness - Starting Application...

echo.
echo ========================================
echo  NGU Fitness Membership Management
echo ========================================
echo.
echo Starting application...
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Navigate to backend directory
cd /d "%~dp0backend"

REM Check if node_modules exists
if not exist "node_modules" (
    echo First time setup detected...
    echo Installing dependencies...
    echo.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo ERROR: Failed to install dependencies!
        echo.
        pause
        exit /b 1
    )
    echo.
    echo Dependencies installed successfully!
    echo.
)

REM Start the backend server
echo Starting server...
echo.
start "NGU Fitness Server" cmd /k "title NGU Fitness Server && npm start"

REM Wait for server to start
timeout /t 5 /nobreak >nul

REM Open the application in default browser
echo Opening application in browser...
start http://localhost:3000

echo.
echo ========================================
echo  Application Started Successfully!
echo ========================================
echo.
echo Application URL: http://localhost:3000
echo.
echo The server is running in a separate window.
echo.
echo To stop the application:
echo   - Close the "NGU Fitness Server" window
echo   - Or press Ctrl+C in that window
echo.
echo This window will close in 5 seconds...
timeout /t 5 /nobreak >nul
