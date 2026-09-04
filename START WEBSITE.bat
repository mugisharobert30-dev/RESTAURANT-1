@echo off
title Luwombo Restaurant Server
cd /d "%~dp0"
echo Starting website server...
echo Keep this window OPEN while using the site.
echo Website address: http://localhost:3000
echo.
npm run dev
pause
