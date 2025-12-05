@echo off
REM ========================================
REM  Create Desktop Shortcut for NGU Fitness
REM ========================================

echo.
echo Creating desktop shortcut...
echo.

REM Get the current directory
set "SCRIPT_DIR=%~dp0"
set "BAT_FILE=%SCRIPT_DIR%START_NGU_FITNESS.bat"

REM Create VBScript to create shortcut
set "VBS_FILE=%TEMP%\create_shortcut.vbs"

echo Set oWS = WScript.CreateObject("WScript.Shell") > "%VBS_FILE%"
echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\NGU Fitness.lnk" >> "%VBS_FILE%"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%VBS_FILE%"
echo oLink.TargetPath = "%BAT_FILE%" >> "%VBS_FILE%"
echo oLink.WorkingDirectory = "%SCRIPT_DIR%" >> "%VBS_FILE%"
echo oLink.Description = "NGU Fitness Membership Management System" >> "%VBS_FILE%"
echo oLink.IconLocation = "%SystemRoot%\System32\shell32.dll,137" >> "%VBS_FILE%"
echo oLink.Save >> "%VBS_FILE%"

REM Run the VBScript
cscript //nologo "%VBS_FILE%"

REM Clean up
del "%VBS_FILE%"

echo.
echo ========================================
echo  Shortcut Created Successfully!
echo ========================================
echo.
echo A shortcut "NGU Fitness" has been created on your Desktop.
echo.
echo Double-click the shortcut to start the application!
echo.
pause
