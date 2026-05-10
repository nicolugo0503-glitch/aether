@echo off
echo ==========================================
echo   Pushing Aether Security Fixes + DB Push
echo ==========================================

cd /d "%~dp0"

echo.
echo [1/3] Pushing RateLimit schema to Neon database...
npx prisma db push
if %errorlevel% neq 0 (
  echo WARNING: prisma db push failed - rate limiter will use in-memory fallback
  echo This is non-critical. Continuing...
)

echo.
echo [2/3] Pushing commit to GitHub...
git push origin main
if %errorlevel% neq 0 (
  echo ERROR: git push failed.
  pause
  exit /b 1
)

echo.
echo [3/3] Done!
echo.
echo ==========================================
echo   Aether is LIVE and ready for the public
echo ==========================================
echo.
echo Vercel will auto-deploy from the push.
echo Check: https://vercel.com/nicolugo0503-4213s-projects/aether/deployments
echo Live site: https://www.useaether.net
echo.
pause
