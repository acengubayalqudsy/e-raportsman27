@echo off
setlocal
title E-Raport SMAN 27 Garut - Development
cd /d "%~dp0"
node scripts\start-dev.mjs
if errorlevel 1 (
    echo.
    echo Startup gagal. Periksa pesan di atas.
    pause
    exit /b 1
)
