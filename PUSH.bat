@echo off
echo ==========================================
echo   Aether Final Deploy
echo ==========================================
echo.

cd /d "%~dp0"

echo [1/1] Pushing commits to GitHub...
git push origin main
if %errorlevel% neq 0 (
  echo.
  echo ERROR: git push failed. Trying force-with-lease...
  git push origin main --force-with-lease
  if %errorlevel% neq 0 (
    echo.
    echo FAILED: Check your GitHub credentials and try again.
    pause
    exit /b 1
  )
)

echo.
echo ==========================================
echo   Done! Vercel is auto-deploying now.
echo ==========================================
echo.
echo Deployments: https://vercel.com/nicolugo0503-4213s-projects/aether/deployments
echo Live site:   https://www.useaether.net
echo.
pause
