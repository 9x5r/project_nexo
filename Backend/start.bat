@echo off
title Project Galaxy Backend

if not exist "node_modules\" (
    echo node_modules not found. Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo Failed to install dependencies. Please check your internet connection or npm installation.
        pause
        exit
    )
)

:start
node --max-old-space-size=2048 --optimize-for-size index.js
if %errorlevel% equ 1 (
    echo Backend stopped manually.
    pause
    exit
)
echo Restarting backend...
goto start
