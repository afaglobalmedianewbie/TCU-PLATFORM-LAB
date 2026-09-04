@echo off
title TCU-PLATFORM-LAB Launch Engine
echo ==============================================================================
echo              TCU-PLATFORM-LAB: SINGLE-NODE ALL-IN-ONE LAUNCHER
echo ==============================================================================
echo.

if not exist .env (
    echo [!] File .env tidak ditemukan. Menyalin dari .env.example...
    copy .env.example .env
)

echo [*] Memeriksa Docker...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] ERROR: Docker Desktop belum berjalan! Pastikan Docker Desktop aktif di Windows 11.
    pause
    exit /b 1
)

echo [*] Menjalankan Container Stack TCU-PLATFORM-LAB...
docker compose up -d

echo.
echo ==============================================================================
echo [V] TCU-PLATFORM-LAB BERHASIL BERJALAN!
echo ==============================================================================
echo   - Frontend Portal:    http://localhost:3001
echo   - Backend API:        http://localhost:3000
echo   - Grafana NOC:        http://localhost:3002 (User: admin, Pass: tcu_grafana_2026)
echo   - FreeRADIUS:         Listening on UDP 1812, 1813, 3799
echo   - PostgreSQL:         Port 5432
echo ==============================================================================
pause
