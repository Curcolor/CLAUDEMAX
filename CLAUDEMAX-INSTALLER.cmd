@echo off
setlocal
chcp 65001 >nul

where node >nul 2>nul
if errorlevel 1 (
    echo.
    echo [ERROR] No se encontro Node.js en el PATH.
    echo.
    echo CLAUDEMAX necesita Node.js version 18 o superior.
    echo Descargalo desde: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

node "%~dp0bin\wizard\wizard.mjs" %*

pause
