$NodePath = "C:\Users\hanam\AppData\Local\OpenAI\Codex\bin\node.exe"
$ScriptPath = Join-Path $PSScriptRoot "src\index.js"

if (-not (Test-Path $NodePath)) {
  $NodePath = "C:\Users\hanam\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
}

if (-not (Test-Path $NodePath)) {
  Write-Error "Node.js was not found."
  exit 1
}

& $NodePath $ScriptPath
