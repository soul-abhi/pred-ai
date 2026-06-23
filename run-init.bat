@echo off
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion

:: ============================================================
::  run-init.bat  --  PredAI Windows Setup & Launcher
::  Right-click -> "Run as administrator" the first time.
::  Requirements: Windows 10/11 (winget must be available)
:: ============================================================

title PredAI Setup

echo.
echo ============================================================
echo   PredAI -- Windows Setup ^& Launcher
echo ============================================================
echo.

:: ── Admin check ──────────────────────────────────────────────
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [WARN]  Not running as Administrator.
    echo         Right-click this file and choose "Run as administrator".
    echo.
    pause
    exit /b 1
)
echo [OK]    Running as Administrator

:: ── Script root (project folder) ─────────────────────────────
set "ROOT=%~dp0"
set "ROOT=%ROOT:~0,-1%"
cd /d "%ROOT%"
echo [INFO]  Project root: %ROOT%

:: ── winget check ─────────────────────────────────────────────
where winget >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo [FAIL]  winget (Windows Package Manager) not found.
    echo         Install App Installer from the Microsoft Store, then re-run.
    echo         Store link: ms-windows-store://pdp/?productid=9NBLGGH4NNS1
    pause
    exit /b 1
)

:: ── Track whether anything was freshly installed ──────────────
set "INSTALLED_SOMETHING=0"

echo.
echo ============================================================
echo   Step 1: Prerequisites
echo ============================================================

:: --- Docker Desktop ---
docker --version >nul 2>&1
if %errorLevel% equ 0 (
    echo [OK]    Docker Desktop already installed
) else (
    echo [INFO]  Installing Docker Desktop (this may take a few minutes)...
    winget install -e --id Docker.DockerDesktop --accept-package-agreements --accept-source-agreements --silent
    if !errorLevel! neq 0 (
        echo [FAIL]  Docker Desktop installation failed.
        echo         Download manually: https://www.docker.com/products/docker-desktop
        pause
        exit /b 1
    )
    echo [OK]    Docker Desktop installed
    set "INSTALLED_SOMETHING=1"
)

:: --- Node.js LTS ---
node --version >nul 2>&1
if %errorLevel% equ 0 (
    echo [OK]    Node.js already installed
) else (
    echo [INFO]  Installing Node.js LTS...
    winget install -e --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements --silent
    if !errorLevel! neq 0 (
        echo [FAIL]  Node.js installation failed.
        pause
        exit /b 1
    )
    echo [OK]    Node.js installed
    set "INSTALLED_SOMETHING=1"
)

:: --- Python ---
python --version >nul 2>&1
if %errorLevel% equ 0 (
    echo [OK]    Python already installed
) else (
    echo [INFO]  Installing Python 3.11...
    winget install -e --id Python.Python.3.11 --accept-package-agreements --accept-source-agreements --silent
    if !errorLevel! neq 0 (
        echo [FAIL]  Python installation failed.
        pause
        exit /b 1
    )
    echo [OK]    Python installed
    set "INSTALLED_SOMETHING=1"
)

:: --- If anything was installed, PATH needs a fresh session ───
if "%INSTALLED_SOMETHING%"=="1" (
    echo.
    echo ============================================================
    echo [NOTICE] One or more tools were just installed.
    echo          Close this window, then double-click run-init.bat
    echo          again (Run as administrator) to launch PredAI.
    echo          (Windows needs a new shell session to find the
    echo          newly installed programs.)
    echo ============================================================
    echo.
    pause
    exit /b 0
)

:: ────────────────────────────────────────────────────────────
::  All prerequisites present -- proceed with setup & launch
:: ────────────────────────────────────────────────────────────

:: --- pnpm ---
pnpm --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [INFO]  Installing pnpm...
    npm install -g pnpm
    if !errorLevel! neq 0 (
        echo [FAIL]  pnpm installation failed.
        pause
        exit /b 1
    )
    echo [OK]    pnpm installed
) else (
    echo [OK]    pnpm already installed
)

echo.
echo ============================================================
echo   Step 2: Start Docker Desktop
echo ============================================================

docker info >nul 2>&1
if %errorLevel% equ 0 (
    echo [OK]    Docker daemon is running
) else (
    echo [INFO]  Starting Docker Desktop...
    :: Try common install locations
    if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
        start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    ) else (
        start "" docker
    )
    echo [INFO]  Waiting for Docker to be ready (up to 90 seconds)...
    set "DOCKER_OK=0"
    for /L %%i in (1,1,45) do (
        docker info >nul 2>&1
        if !errorLevel! equ 0 (
            set "DOCKER_OK=1"
            goto :docker_ready
        )
        timeout /t 2 /nobreak >nul
        if %%i==15 echo [INFO]  Still waiting for Docker...
        if %%i==30 echo [INFO]  Almost there...
    )
    echo [FAIL]  Docker did not become ready in 90 seconds.
    echo         Please open Docker Desktop manually, wait for it to start,
    echo         then run this script again.
    pause
    exit /b 1
)
:docker_ready
echo [OK]    Docker is ready

echo.
echo ============================================================
echo   Step 3: PostgreSQL
echo ============================================================

docker ps --filter "name=pred-ai-postgres" --filter "status=running" --format "{{.Names}}" 2>nul | find "pred-ai-postgres" >nul
if %errorLevel% equ 0 (
    echo [OK]    PostgreSQL container already running
) else (
    docker rm pred-ai-postgres >nul 2>&1
    echo [INFO]  Starting PostgreSQL on port 5433...
    docker run -d --name pred-ai-postgres ^
        -e POSTGRES_USER=predai ^
        -e POSTGRES_PASSWORD=predai_dev_password ^
        -e POSTGRES_DB=predai ^
        -p 5433:5432 ^
        postgres:16-alpine >nul
    if !errorLevel! neq 0 (
        echo [FAIL]  Failed to start PostgreSQL container.
        pause
        exit /b 1
    )
    echo [INFO]  Waiting for PostgreSQL to be ready...
    for /L %%i in (1,1,30) do (
        docker exec pred-ai-postgres pg_isready -U predai -d predai >nul 2>&1
        if !errorLevel! equ 0 goto :pg_ready
        timeout /t 1 /nobreak >nul
    )
    echo [FAIL]  PostgreSQL failed to start.
    echo         Run: docker logs pred-ai-postgres
    pause
    exit /b 1
)
:pg_ready
echo [OK]    PostgreSQL ready on localhost:5433

echo.
echo ============================================================
echo   Step 4: Environment file
echo ============================================================

if not exist "%ROOT%\apps\api\.env" (
    echo [INFO]  Creating apps\api\.env with dev defaults...
    :: Generate random 64-char hex secrets using PowerShell
    for /f %%s in ('powershell -NoProfile -Command "[System.BitConverter]::ToString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).Replace('-','').ToLower()"') do set "JWT_SECRET=%%s"
    for /f %%s in ('powershell -NoProfile -Command "[System.BitConverter]::ToString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).Replace('-','').ToLower()"') do set "REFRESH_SECRET=%%s"

    (
        echo DATABASE_URL=postgres://predai:predai_dev_password@localhost:5433/predai
        echo JWT_SECRET=!JWT_SECRET!
        echo REFRESH_TOKEN_SECRET=!REFRESH_SECRET!
        echo ACCESS_TOKEN_EXPIRY=15m
        echo REFRESH_TOKEN_EXPIRY_DAYS=7
        echo ML_SERVICE_URL=http://localhost:8000
        echo WEB_ORIGIN=http://localhost:3000
        echo PORT=4000
        echo NODE_ENV=development
    ) > "%ROOT%\apps\api\.env"
    echo [OK]    .env created with random JWT secrets
) else (
    echo [OK]    apps\api\.env already exists
)

echo.
echo ============================================================
echo   Step 5: Node.js dependencies
echo ============================================================

if not exist "%ROOT%\node_modules" (
    echo [INFO]  Installing root workspace deps...
    call pnpm install
)

if not exist "%ROOT%\apps\api\node_modules" (
    echo [INFO]  Installing API deps...
    cd /d "%ROOT%\apps\api"
    call pnpm install
    cd /d "%ROOT%"
)

if not exist "%ROOT%\apps\web\node_modules" (
    echo [INFO]  Installing web deps...
    cd /d "%ROOT%\apps\web"
    call pnpm install
    cd /d "%ROOT%"
)
echo [OK]    Node.js dependencies ready

echo.
echo ============================================================
echo   Step 6: Database migrations
echo ============================================================

cd /d "%ROOT%\apps\api"
echo [INFO]  Running Drizzle migrations...
call npx drizzle-kit migrate >nul 2>&1
if %errorLevel% neq 0 (
    call pnpm db:migrate
    if !errorLevel! neq 0 (
        echo [FAIL]  Migration failed. Check your DATABASE_URL in apps\api\.env
        cd /d "%ROOT%"
        pause
        exit /b 1
    )
)
echo [OK]    Migrations applied
cd /d "%ROOT%"

echo.
echo ============================================================
echo   Step 7: Python (ML service)
echo ============================================================

cd /d "%ROOT%\apps\ml-service"
if not exist ".venv" (
    echo [INFO]  Creating Python virtualenv...
    python -m venv .venv
    echo [INFO]  Installing ML dependencies (scikit-learn, xgboost, etc.)...
    .venv\Scripts\pip install -r requirements.txt --quiet
    if !errorLevel! neq 0 (
        echo [FAIL]  pip install failed.
        cd /d "%ROOT%"
        pause
        exit /b 1
    )
    echo [OK]    Python dependencies installed
) else (
    echo [OK]    Python virtualenv already exists
)
cd /d "%ROOT%"

echo.
echo ============================================================
echo   Step 8: Launch services
echo ============================================================

:: Kill anything already on these ports (ignore errors)
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":8000 "') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":4000 "') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":3000 "') do taskkill /F /PID %%a >nul 2>&1

:: ML Service
echo [INFO]  Starting ML service on :8000...
start "PredAI - ML Service" cmd /k "cd /d "%ROOT%\apps\ml-service" && set MODEL_DIR=./models && set DATA_DIR=./data && .venv\Scripts\uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo [INFO]  Waiting for ML service to be ready...
for /L %%i in (1,1,30) do (
    curl -sf http://localhost:8000/health >nul 2>&1
    if !errorLevel! equ 0 goto :ml_ready
    timeout /t 2 /nobreak >nul
)
echo [FAIL]  ML service did not start. Check the "PredAI - ML Service" window.
pause
exit /b 1
:ml_ready
echo [OK]    ML service ready

:: Seed model if not loaded
curl -sf http://localhost:8000/health 2>nul | find "true" >nul
if %errorLevel% neq 0 (
    echo [INFO]  Training model on synthetic data...
    curl -sf -X POST http://localhost:8000/train -H "Content-Type: application/json" -d "{\"use_synthetic\":true}" >nul
    echo [OK]    Model trained
) else (
    echo [OK]    Model already loaded
)

:: API
echo [INFO]  Starting API on :4000...
start "PredAI - API" cmd /k "cd /d "%ROOT%\apps\api" && pnpm dev"

echo [INFO]  Waiting for API to be ready...
for /L %%i in (1,1,40) do (
    curl -sf http://localhost:4000/api/health >nul 2>&1
    if !errorLevel! equ 0 goto :api_ready
    timeout /t 2 /nobreak >nul
)
echo [FAIL]  API did not start. Check the "PredAI - API" window.
pause
exit /b 1
:api_ready
echo [OK]    API ready

:: Web frontend
echo [INFO]  Starting Next.js on :3000 (first compile takes ~15s)...
start "PredAI - Web" cmd /k "cd /d "%ROOT%\apps\web" && pnpm dev"

echo [INFO]  Waiting for Next.js...
for /L %%i in (1,1,45) do (
    curl -sf http://localhost:3000 >nul 2>&1
    if !errorLevel! equ 0 goto :web_ready
    timeout /t 2 /nobreak >nul
    if %%i==20 echo [INFO]  Still compiling Next.js...
)
echo [FAIL]  Web frontend did not start. Check the "PredAI - Web" window.
pause
exit /b 1
:web_ready
echo [OK]    Web frontend ready

:: ── All done ─────────────────────────────────────────────────
echo.
echo ============================================================
echo   PredAI is running!
echo ============================================================
echo.
echo   Frontend  --^>  http://localhost:3000
echo   API       --^>  http://localhost:4000
echo   ML        --^>  http://localhost:8000
echo.
echo   Sign up:  http://localhost:3000/signup
echo.
echo   Three terminal windows have been opened for the services.
echo   Close those windows to stop each service.
echo.

:: Open browser
start http://localhost:3000/signup

echo   Press any key to stop PostgreSQL and exit this launcher.
echo   (Service windows will stay open — close them manually.)
echo.
pause >nul

:: Stop postgres container on exit
echo [INFO]  Stopping PostgreSQL container...
docker stop pred-ai-postgres >nul 2>&1
echo [OK]    PostgreSQL stopped. Goodbye!
timeout /t 2 /nobreak >nul
exit /b 0
