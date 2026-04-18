@echo off
REM ─────────────────────────────────────────────────────────────
REM GigShield — Local Dev Startup (Windows)
REM Run from the root GigShield folder: start.bat
REM ─────────────────────────────────────────────────────────────

set ROOT=%~dp0

echo.
echo  GigShield Local Dev Launcher (Windows)
echo  =======================================
echo.

REM Create logs dir
if not exist "%ROOT%logs" mkdir "%ROOT%logs"

REM ── Python venv + ML Engine ──
echo [1/4] Setting up ML Engine...
cd /d "%ROOT%DEVTrails-ml-engine"
if not exist ".venv" (
    python -m venv .venv
)
call .venv\Scripts\activate.bat
pip install -q --upgrade pip
pip install -q -r requirements.txt
call .venv\Scripts\deactivate.bat
echo  ML Engine deps ready.

REM ── Node deps ──
echo [2/4] Installing backend dependencies...
cd /d "%ROOT%neema-backend"
call npm install --silent

echo [3/4] Installing trigger engine dependencies...
cd /d "%ROOT%DEVTrails-api_core_logic\api_core_logic"
call npm install --silent

echo [4/4] Installing frontend dependencies...
cd /d "%ROOT%gigshield-frontend"
call npm install --legacy-peer-deps --silent

echo.
echo  Starting services in separate windows...
echo.

REM ── Launch each service in a new window ──
cd /d "%ROOT%DEVTrails-ml-engine"
start "ML Engine :8000" cmd /k ".venv\Scripts\activate && set PORT=8000 && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 2 /nobreak >nul

cd /d "%ROOT%neema-backend"
start "Backend :3001" cmd /k "set DATABASE_URL=postgresql://postgres:neema@localhost:5432/postgres && set PORT=3001 && set ML_ENGINE_URL=http://localhost:8000 && node server.js"

timeout /t 2 /nobreak >nul

cd /d "%ROOT%DEVTrails-api_core_logic\api_core_logic"
start "Trigger Engine :3002" cmd /k "set USERS_API_URL=http://localhost:3001/api/users/active && set WEBHOOK_URL=http://localhost:3001/api/claims/trigger && set FLAGGED_URL=http://localhost:3001/api/claims/flagged && set ML_ENGINE_URL=http://localhost:8000/api/v1/premium/fraud-check && set TEST_MODE=false && node index.js"

timeout /t 2 /nobreak >nul

cd /d "%ROOT%gigshield-frontend"
start "Frontend :5173" cmd /k "set VITE_BACKEND_URL=http://localhost:3001 && set VITE_ML_URL=http://localhost:8000 && npm run dev -- --host"

echo.
echo  =======================================
echo   All services launching in new windows
echo.
echo   Frontend  -^> http://localhost:5173
echo   Backend   -^> http://localhost:3001
echo   ML Engine -^> http://localhost:8000/docs
echo   Trigger   -^> http://localhost:3002
echo  =======================================
echo.
echo  Close the individual windows to stop each service.
pause
