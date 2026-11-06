@echo off
setlocal
cd /d "%~dp0"

set "REPO=https://github.com/lordbyaku/trisnait.git"
set "BRANCH=main"

where git >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Git belum terpasang. Install dulu: winget install --id Git.Git -e
  pause
  exit /b 1
)

if not exist ".git" (
  echo [INFO] Inisialisasi repo baru...
  git init -b %BRANCH% || goto :fail
)

git remote get-url origin >nul 2>nul
if errorlevel 1 (
  git remote add origin %REPO% || goto :fail
) else (
  git remote set-url origin %REPO%
)

git add -A || goto :fail

if "%~1"=="" (
  set "MSG=sync %date% %time:~0,8%"
) else (
  set "MSG=%~1"
)

git diff --cached --quiet
if errorlevel 1 (
  git commit -m "%MSG%" || goto :fail
) else (
  echo [INFO] Tidak ada perubahan baru untuk di-commit.
)

git push -u origin %BRANCH% || goto :fail

echo.
echo [OK] Sync selesai: %REPO%
pause
exit /b 0

:fail
echo.
echo [ERROR] Sync gagal. Cek pesan di atas.
pause
exit /b 1
