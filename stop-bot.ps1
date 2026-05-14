$ScriptPath = Join-Path $PSScriptRoot "src\index.js"
$ResolvedScriptPath = [System.IO.Path]::GetFullPath($ScriptPath)

$Targets = Get-CimInstance Win32_Process | Where-Object {
  $_.Name -match '^node(\.exe)?$' -and $_.CommandLine -like ('*' + $ResolvedScriptPath + '*')
}

if (-not $Targets) {
  Write-Host "No bot process found for this repo."
  exit 0
}

$Targets | ForEach-Object {
  Stop-Process -Id $_.ProcessId -Force
  Write-Host ("Stopped PID " + $_.ProcessId)
}
