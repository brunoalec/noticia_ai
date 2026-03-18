@echo off
cd /d C:\Users\Bruno\Desktop\VIBE\NOTICIA_AI
echo Compilando o projeto...
call npm run build
echo Build concluido. Iniciando o servidor...
start http://localhost:3001
npm run start
