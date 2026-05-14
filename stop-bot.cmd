@echo off
setlocal

set "POWERSHELL=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
"%POWERSHELL%" -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop-bot.ps1"
