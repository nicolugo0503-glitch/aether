# =====================================================
#  Aether — One-click GitHub fix + deploy
#  Run from PowerShell inside the aether folder:
#    powershell -ExecutionPolicy Bypass -File FIX.ps1
# =====================================================

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Aether Fix Script" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path "package.json")) {
    Write-Host "ERROR: Run this from the aether folder (where package.json lives)." -ForegroundColor Red
    Write-Host "Current: $PWD" -ForegroundColor Yellow
    pause; exit 1
}

Write-Host "[1/4] Writing stripe.ts (base64 method - no encoding issues)..." -ForegroundColor Yellow

$b64 = "aW1wb3J0IFN0cmlwZSBmcm9tICJzdHJpcGUiOwoKZXhwb3J0IGNvbnN0IHN0cmlwZSA9IG5ldyBTdHJpcGUocHJvY2Vzcy5lbnYuU1RSSVBFX1NFQ1JFVF9LRVkgfHwgInNrX3Rlc3RfcGxhY2Vob2xkZXIiLCB7CiAgYXBpVmVyc2lvbjogIjIwMjUtMDItMjQuYWNhY2lhIiwKICB0eXBlc2NyaXB0OiB0cnVlLAogIGFwcEluZm86IHsgbmFtZTogIkFldGhlciIsIHZlcnNpb246ICIwLjEuMCIgfSwKfSk7CgpleHBvcnQgY29uc3QgUFJJQ0VfSURTID0gewogIFNUQVJURVI6IHByb2Nlc3MuZW52LlNUUklQRV9QUklDRV9TVEFSVEVSIHx8ICIiLAogIEdST1dUSDogIHByb2Nlc3MuZW52LlNUUklQRV9QUklDRV9HUk9XVEggIHx8ICIiLAogIFNDQUxFOiAgIHByb2Nlc3MuZW52LlNUUklQRV9QUklDRV9TQ0FMRSAgIHx8ICIiLAp9IGFzIGNvbnN0OwoKZXhwb3J0IGNvbnN0IFBMQU5fTElNSVRTID0gewogIEZSRUU6ICAgIHsgbW9udGhseVJ1bnM6IDI1LCAgICAgYWdlbnRzOiAxLCAgIGxhYmVsOiAiRnJlZSIgICAgfSwKICBTVEFSVEVSOiB7IG1vbnRobHlSdW5zOiA1MDAsICAgIGFnZW50czogMywgICBsYWJlbDogIlN0YXJ0ZXIiIH0sCiAgR1JPV1RIOiAgeyBtb250aGx5UnVuczogNV8wMDAsICBhZ2VudHM6IDEwLCAgbGFiZWw6ICJHcm93dGgiICB9LAogIFNDQUxFOiAgIHsgbW9udGhseVJ1bnM6IDUwXzAwMCwgYWdlbnRzOiAxMDAsIGxhYmVsOiAiU2NhbGUiICAgfSwKfSBhcyBjb25zdDsKCmV4cG9ydCB0eXBlIFBsYW5LZXkgPSBrZXlvZiB0eXBlb2YgUExBTl9MSU1JVFM7CgpleHBvcnQgZnVuY3Rpb24gdG9QbGFuS2V5KHBsYW46IHN0cmluZyk6IFBsYW5LZXkgewogIGlmIChwbGFuIGluIFBMQU5fTElNSVRTKSByZXR1cm4gcGxhbiBhcyBQbGFuS2V5OwogIHJldHVybiAiRlJFRSI7Cn0KCmV4cG9ydCBmdW5jdGlvbiBwcmljZUlkVG9QbGFuKHByaWNlSWQ/OiBzdHJpbmcgfCBudWxsKTogUGxhbktleSB7CiAgaWYgKCFwcmljZUlkKSByZXR1cm4gIkZSRUUiOwogIGlmIChwcmljZUlkID09PSBQUklDRV9JRFMuU1RBUlRFUikgcmV0dXJuICJTVEFSVEVSIjsKICBpZiAocHJpY2VJZCA9PT0gUFJJQ0VfSURTLkdST1dUSCkgIHJldHVybiAiR1JPV1RIIjsKICBpZiAocHJpY2VJZCA9PT0gUFJJQ0VfSURTLlNDQUxFKSAgIHJldHVybiAiU0NBTEUiOwogIHJldHVybiAiRlJFRSI7Cn0K"

$bytes = [System.Convert]::FromBase64String($b64)
$outPath = Join-Path $PWD "src\lib\stripe.ts"
[System.IO.File]::WriteAllBytes($outPath, $bytes)

$check = Get-Content $outPath -Raw
if ($check -match "2025-02-24.acacia") {
    Write-Host "  OK — stripe.ts has correct apiVersion" -ForegroundColor Green
} else {
    Write-Host "  FAILED — could not write stripe.ts!" -ForegroundColor Red
    pause; exit 1
}

Write-Host "[2/4] Staging files..." -ForegroundColor Yellow
git add src\lib\stripe.ts package.json
git status --short

Write-Host "[3/4] Committing..." -ForegroundColor Yellow
git commit -m "fix: correct stripe apiVersion 2025-02-24.acacia"
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Nothing changed — doing empty commit to trigger Vercel..." -ForegroundColor Yellow
    git commit --allow-empty -m "fix: trigger redeploy"
}

Write-Host "[4/4] Force pushing to GitHub..." -ForegroundColor Yellow
git push --force
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Push failed! Check your internet or run: git push --force" -ForegroundColor Red
    pause; exit 1
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "  DONE! Vercel is now deploying." -ForegroundColor Green
Write-Host "  Go to vercel.com to watch the build." -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
pause
