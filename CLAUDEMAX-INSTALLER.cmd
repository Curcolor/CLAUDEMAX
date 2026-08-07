@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul
title CLAUDEMAX — Instalador
cd /d "%~dp0"

echo.
echo   CLAUDEMAX — Instalador
echo   ============================================================
echo   Prepara tu workspace: ahorro de tokens, skills de UI/UX,
echo   cerebro RAG y herramientas de analisis para Claude Code.
echo   No hace falta saber nada tecnico: solo sigue las preguntas
echo   que te vaya haciendo el asistente.
echo.

call :asegurar_node
if errorlevel 1 goto :fin_error

call :asegurar_bash
if errorlevel 1 goto :fin_error

echo.
echo   Arrancando el asistente de instalacion...
echo.
"%NODE_BIN%" "%~dp0bin\wizard\wizard.mjs" %*
set "WIZARD_EXIT=%ERRORLEVEL%"

echo.
if "%WIZARD_EXIT%"=="0" (
    echo   [OK] La instalacion termino sin errores.
) else (
    echo   [ERROR] La instalacion no se completo — revisa los mensajes de arriba.
)
pause
exit /b %WIZARD_EXIT%

:fin_error
echo.
echo   [ERROR] No se pudo preparar el equipo para instalar CLAUDEMAX.
pause
exit /b 1

rem ================================================================
rem  Node.js — lo instala si falta, sin rendirse.
rem ================================================================
:asegurar_node
set "NODE_BIN=node"
where node >nul 2>nul
if not errorlevel 1 exit /b 0

echo.
echo   [AVISO] No se encontro Node.js en el PATH.
echo   CLAUDEMAX necesita Node.js version 18 o superior.
echo.

where winget >nul 2>nul
if errorlevel 1 (
    echo   winget no esta disponible en este equipo.
    echo   Descarga e instala Node.js manualmente desde: https://nodejs.org/
    echo   Vuelve a ejecutar este instalador cuando termines.
    exit /b 1
)

choice /C SN /N /M "  ¿Instalar Node.js LTS ahora mediante winget? (S/N): "
if errorlevel 2 (
    echo   De acuerdo. Instala Node.js manualmente desde https://nodejs.org/ y vuelve a intentarlo.
    exit /b 1
)

echo.
echo   Instalando Node.js LTS con winget — esto puede tardar unos minutos...
winget install -e --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
echo.

where node >nul 2>nul
if not errorlevel 1 (
    set "NODE_BIN=node"
    exit /b 0
)
if exist "%ProgramFiles%\nodejs\node.exe" (
    set "NODE_BIN=%ProgramFiles%\nodejs\node.exe"
    exit /b 0
)
if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" (
    set "NODE_BIN=%LOCALAPPDATA%\Programs\nodejs\node.exe"
    exit /b 0
)

echo   [AVISO] Node.js se instalo, pero esta ventana no ve el PATH actualizado todavia.
echo   Cierra esta ventana y vuelve a ejecutar CLAUDEMAX-INSTALLER.cmd — el PATH ya
echo   estara actualizado en la siguiente ventana.
exit /b 1

rem ================================================================
rem  Git Bash — el wizard lo necesita para lanzar install.sh.
rem  IMPORTANTE: nunca se usa "where bash" como prueba de existencia, porque en
rem  equipos con WSL instalado el PATH puede resolver a su bash, que no sirve
rem  (monta el disco en /mnt/c en vez de /c). Se comprueban las rutas propias
rem  de Git for Windows, igual que bin/wizard/detect.mjs.
rem ================================================================
:asegurar_bash
if exist "%ProgramFiles%\Git\bin\bash.exe" exit /b 0
if exist "%LOCALAPPDATA%\Programs\Git\bin\bash.exe" exit /b 0

echo.
echo   [AVISO] No se encontro Git Bash instalado.
echo   CLAUDEMAX necesita Git for Windows (trae Git Bash) para ejecutar install.sh.
echo.

where winget >nul 2>nul
if errorlevel 1 (
    echo   winget no esta disponible en este equipo.
    echo   Descarga e instala Git for Windows manualmente desde: https://git-scm.com/download/win
    echo   Vuelve a ejecutar este instalador cuando termines.
    exit /b 1
)

choice /C SN /N /M "  ¿Instalar Git for Windows ahora mediante winget? (S/N): "
if errorlevel 2 (
    echo   De acuerdo. Instala Git for Windows manualmente desde https://git-scm.com/download/win y vuelve a intentarlo.
    exit /b 1
)

echo.
echo   Instalando Git for Windows con winget — esto puede tardar unos minutos...
winget install -e --id Git.Git --accept-package-agreements --accept-source-agreements
echo.

if exist "%ProgramFiles%\Git\bin\bash.exe" exit /b 0
if exist "%LOCALAPPDATA%\Programs\Git\bin\bash.exe" exit /b 0

echo   [AVISO] Git se instalo, pero esta ventana no ve los cambios todavia.
echo   Cierra esta ventana y vuelve a ejecutar CLAUDEMAX-INSTALLER.cmd — el PATH ya
echo   estara actualizado en la siguiente ventana.
exit /b 1
