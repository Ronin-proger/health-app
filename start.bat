@echo off
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js не найден. Установите его с https://nodejs.org и запустите этот файл снова.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Устанавливаю зависимости...
  call npm install
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
echo Открываю Здоровье на http://localhost:5174
call npm start
