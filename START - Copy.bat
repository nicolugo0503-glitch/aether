@echo off
title Aether
color 0A

echo.
echo  ============================================
echo   AETHER -- Autonomous AI Employee Platform
echo  ============================================
echo.

:: --- Check Node.js ---
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js is not installed.
    echo  Download it from: https://nodejs.org
    echo  Install it, then double-click START.bat again.
    echo.
    pause
    exit /b 1
)
echo  [OK] Node.js found.

:: --- Install dependencies ---
if not exist node_modules (
    echo.
    echo  [STEP 1/4] Installing dependencies (first run, ~60 seconds^)...
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo  [ERROR] npm install failed. See error above.
        pause
        exit /b 1
    )
    echo  [OK] Dependencies installed.
) else (
    echo  [OK] Dependencies already installed.
)

:: --- Generate Prisma client ---
echo.
echo  [STEP 2/4] Generating database client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo  [ERROR] prisma generate failed. See error above.
    pause
    exit /b 1
)

:: --- Push DB schema ---
echo.
echo  [STEP 3/4] Setting up database...
call npx prisma db push
if %errorlevel% neq 0 (
    echo  [ERROR] prisma db push failed. See error above.
    pause
    exit /b 1
)

:: --- Seed demo data ---
echo.
echo  [STEP 4/4] Seeding demo account...
call npx tsx prisma/seed.ts
echo  [OK] Demo account: demo@aether.ai / demo1234

:: --- Launch ---
echo.
echo  ============================================
echo   Opening http://localhost:3000 in 3 seconds
echo   Press Ctrl+C to stop the server.
echo  ============================================
echo.
timeout /t 3 /nobreak >nul
start http://localhost:3000

call npm run dev

echo.
echo  Server stopped. Press any key to close.
pause
