@echo off
title NoxOS - PROBANDO BACKEND RENDER
color 0B

echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║      NoxOS - MODO PRODUCCIÓN (RENDER)        ║
echo  ║   Usando Backend en la nube (Render)         ║
echo  ╚══════════════════════════════════════════════╝
echo.

set EXPO_PUBLIC_API_URL=https://noxos-movil-backend.onrender.com/api

echo  [*] URL Backend: %EXPO_PUBLIC_API_URL%
echo  [*] Iniciando Expo Go...
echo.

cd /d %~dp0
npx expo start

pause
