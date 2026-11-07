@echo off
title SmartTools India - Neural TTS Companion Engine
color 0A
echo =====================================================================
echo    SMARTTOOLS INDIA - REALISTIC NEURAL TTS ENGINE 2.0 (LOCAL HOST)
echo =====================================================================
echo.
echo Checking Python environment...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH!
    echo Please install Python 3.10+ from https://www.python.org/
    pause
    exit /b 1
)

echo Checking required dependencies...
python -c "import fastapi, uvicorn, edge_tts" >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Installing required packages from requirements.txt...
    pip install -r "%~dp0requirements.txt"
)

echo.
echo [OK] Dependencies verified.
echo Starting local neural companion engine on http://127.0.0.1:8000
echo Leave this terminal open while using the Neural TTS tool on SmartTools India.
echo Press Ctrl+C to stop the engine.
echo.
python "%~dp0tts_server.py"
pause
