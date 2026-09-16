@echo off
cd /d "%~dp0"
echo Starting the WarcraftEvents Arena uploader...
node src\server.mjs
if errorlevel 1 pause
