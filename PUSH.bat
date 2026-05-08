@echo off
echo ==========================================
echo   Pushing Aether BUG FIX to GitHub
echo ==========================================
cd /d "%~dp0"
git push origin main --force
echo.
if %ERRORLEVEL% EQU 0 (
  echo SUCCESS - Vercel deploying now (~60s)
) else (
  echo FAILED - Check credentials
)
pause
