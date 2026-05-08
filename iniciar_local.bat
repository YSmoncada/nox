@echo off
title NoxOS - Modo Local (Expo Go + FastAPI)
color 0A

echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║       NoxOS - INICIANDO MODO LOCAL           ║
echo  ║   Backend FastAPI + Frontend Expo Go         ║
echo  ╚══════════════════════════════════════════════╝
echo.

REM ── Detectar IP local automáticamente ──
set IP=
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4" ^| findstr /V "192.168.56."') do (
    set IP=%%a
)
REM Limpiar espacios
set IP=%IP: =%

if "%IP%"=="" (
    echo [!] No se detecto IP automaticamente.
    set /p IP="Por favor, ingresa tu IP de Wi-Fi (ej: 10.157.25.137): "
)

echo  [*] Tu IP configurada: %IP%
echo  [*] Backend:  http://%IP%:8000/api
echo  [*] Frontend: Expo Go (escanea el QR)

echo.

REM ── Configurar variable de entorno para Expo ──
set EXPO_PUBLIC_API_URL=http://%IP%:8000/api

REM ── Iniciar el Backend FastAPI en otra ventana ──
echo  [1/2] Iniciando Backend FastAPI...
start "NoxOS Backend" cmd /k "cd /d c:\Users\ANGELA\Desktop\mandala\MANDALA-NUEVO\MANDALA_FASTAPI && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

REM Esperar 3 segundos para que el backend arranque
timeout /t 3 /nobreak > nul

REM ── Iniciar Expo Go en otra ventana ──
echo  [2/2] Iniciando Expo Go...
echo.
echo  ════════════════════════════════════════════════
echo    Escanea el QR con Expo Go en tu celular
echo    Asegurate de estar en la MISMA red WiFi
echo  ════════════════════════════════════════════════
echo.

cd /d c:\Users\ANGELA\Desktop\mandala\MANDALA-NUEVO\mandala-frontend-mobile
start "NoxOS Frontend" cmd /k "npx expo start"

