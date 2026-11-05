@echo off
title Tangkap Bintang - Game Kamera Web
echo ===================================================
echo   Memulakan Tangkap Bintang (Game Kamera Web)...
echo ===================================================

set PYTHON_PATH="C:\Users\Maui\AppData\Local\Programs\Python\Python311\python.exe"

if exist %PYTHON_PATH% (
    %PYTHON_PATH% server.py
) else (
    python server.py
)

pause

