@echo off
title E-Raport SMAN 27 Garut - Starter
echo ========================================================
echo   E-Raport SMAN 27 Garut - Development Server
echo ========================================================
echo.

:: 1. Cek apakah MySQL di port 3306 sudah berjalan
netstat -ano | findstr ":3306" | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo [OK] MySQL/MariaDB XAMPP port 3306 sudah aktif.
) else (
    echo [..] Menyalakan MySQL XAMPP...
    start /b "" "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone
    timeout /t 2 /nobreak >nul
    netstat -ano | findstr ":3306" | findstr "LISTENING" >nul
    if %errorlevel% equ 0 (
        echo [OK] MySQL XAMPP port 3306 berhasil dinyalakan!
    ) else (
        echo [PERINGATAN] Silakan nyalakan MySQL melalui XAMPP Control Panel.
    )
)
echo.

:: 2. Jalankan Laravel Backend di background window terpisah
echo [..] Menjalankan Laravel Backend (http://127.0.0.1:8000)...
start "Laravel Backend (Port 8000)" cmd /k "cd /d %~dp0backend && php artisan serve"

:: 3. Jalankan Frontend Vite
echo [..] Menjalankan Vite Frontend (http://localhost:5173)...
start "Frontend Vite (Port 5173)" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ========================================================
echo   Semua layanan berhasil dijalankan!
echo   - Web App: http://localhost:5173
echo   - Backend: http://127.0.0.1:8000
echo   - Database: Port 3306 (Default XAMPP)
echo ========================================================
timeout /t 5
