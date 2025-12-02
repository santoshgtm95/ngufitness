@echo off
echo ========================================
echo  NGU Fitness Membership Management System
echo ========================================
echo.
echo Starting servers...
echo.

REM Start backend server
start "Backend Server - Port 3000" cmd /k "cd backend && npm start"

REM Wait 3 seconds for backend to initialize
timeout /t 3 /nobreak > nul

REM Start frontend server (tries Python first, then npx)
start "Frontend Server - Port 8080" cmd /k "python -m http.server 8080 || npx http-server -p 8080"

REM Wait 2 seconds for frontend to start
timeout /t 2 /nobreak > nul

echo.
echo ========================================
echo  Servers Started Successfully!
echo ========================================
echo.
echo Backend API: http://localhost:3000
echo Frontend:    http://localhost:8080
echo.
echo Opening application in your browser...
echo.

REM Open the application in default browser
start http://localhost:8080

echo.
echo ========================================
echo  Application is now running!
echo ========================================
echo.
echo To stop the servers:
echo 1. Close the Backend Server window
echo 2. Close the Frontend Server window
echo.
echo Or press Ctrl+C in each window
echo.
echo Press any key to exit this window...
pause > nul
