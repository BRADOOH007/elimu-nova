param(
  [string]$EnvFile = "$PSScriptRoot\backup-connection.env"
)

$logDir = "$PSScriptRoot\..\backup-logs"
New-Item -ItemType Directory -Path $logDir -Force | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$logFile = Join-Path $logDir "backup-$stamp.log"

function Load-Env($path) {
  if (-not (Test-Path $path)) {
    throw "Missing env file: $path"
  }
  Get-Content $path | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith('#') -and $line.Contains('=')) {
      $idx = $line.IndexOf('=')
      $key = $line.Substring(0, $idx).Trim()
      $val = $line.Substring($idx + 1).Trim()
      [Environment]::SetEnvironmentVariable($key, $val)
    }
  }
}

$tsx = Join-Path $PSScriptRoot '..\node_modules\.bin\tsx.cmd'
if (-not (Test-Path $tsx)) {
  throw "tsx not found at $tsx"
}

try {
  Load-Env $EnvFile
  & $tsx "$PSScriptRoot\backup-run.ts" *>&1 | Tee-Object -FilePath $logFile
  $exit = $LASTEXITCODE
  Write-Output "Log: $logFile"
  if ($exit -ne 0) {
    Write-Output "Backup exited with code $exit"
    exit $exit
  }
  exit 0
} catch {
  Write-Output "ERROR: $_"
  exit 1
}
