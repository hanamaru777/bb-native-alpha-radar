@echo off
setlocal

set "NODE_PATH=C:\Users\hanam\AppData\Local\OpenAI\Codex\bin\node.exe"
if not exist "%NODE_PATH%" set "NODE_PATH=C:\Users\hanam\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

if not exist "%NODE_PATH%" (
  echo Node.js was not found.
  pause
  exit /b 1
)

"%NODE_PATH%" "src/index.js"
