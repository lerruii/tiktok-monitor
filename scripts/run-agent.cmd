@echo off
setlocal
set "SCRIPT_DIR=%~dp0"
set "PROJECT_DIR=%SCRIPT_DIR%.."
if not exist "%PROJECT_DIR%\logs" mkdir "%PROJECT_DIR%\logs"
echo [%date% %time%] Ejecutando agente TikTok... >> "%PROJECT_DIR%\logs\agent.log"
node "%PROJECT_DIR%\agent\check-tiktok.mjs" >> "%PROJECT_DIR%\logs\agent.log" 2>&1
endlocal
