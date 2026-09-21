@echo off
setlocal
echo ===================================================
echo   Vyoma ScanServe - Android APK Installer
echo ===================================================

node "%~dp0scripts\install-apk.cjs" %*
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Press any key to exit...
    pause >nul
)
