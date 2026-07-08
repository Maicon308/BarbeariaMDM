@echo off
setlocal
cd /d "%~dp0"

echo [BarbeariaMDM] Subindo Backend em Docker...
cd Backend
docker compose up -d --build
cd ..

echo [BarbeariaMDM] Instalando dependencias do Frontend se necessario...
cd Frontend
if not exist node_modules (
  npm install
)

echo [BarbeariaMDM] Iniciando Frontend em http://localhost:5173
npm run dev -- --host 0.0.0.0

