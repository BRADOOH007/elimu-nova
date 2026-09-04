$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$prodUrl = "https://elimu-nova-ai.vercel.app"

function Parse-EnvFile([string]$path) {
  $map = @{}
  if (-not (Test-Path $path)) { return $map }
  Get-Content $path | ForEach-Object {
    $line = $_.Trim()
    if ($line -match '^#' -or $line -eq '') { return }
    if ($line -match '^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
      $key = $Matches[1]
      $val = $Matches[2]
      if ($val.Length -ge 2) {
        if (($val[0] -eq '"' -and $val[-1] -eq '"') -or ($val[0] -eq "'" -and $val[-1] -eq "'")) {
          $val = $val.Substring(1, $val.Length - 2)
        }
      }
      $map[$key] = $val
    }
  }
  return $map
}

function Vercel([string]$cmd) {
  # Run via cmd /c so Vercel's stderr writes merge cleanly (no PowerShell NativeCommandError abort)
  $out = & cmd /c $cmd 2>&1
  return ($out | Out-String)
}

$merged = Parse-EnvFile (Join-Path $root '.env')
$local  = Parse-EnvFile (Join-Path $root '.env.local')
foreach ($k in $local.Keys) { $merged[$k] = $local[$k] }

$merged['NEXTAUTH_URL'] = $prodUrl
$skip = @('NEXT_DISABLE_TURBOPACK', 'PINTEREST_API_KEY', 'SKIP_ENV_CHECK', 'NX_DAEMON', 'LOCAL_DATABASE_URL')
foreach ($k in $skip) { $merged.Remove($k) }

$toPush = @()
foreach ($k in ($merged.Keys | Sort-Object)) {
  $v = $merged[$k]
  if ([string]::IsNullOrEmpty($v)) { Write-Host "SKIP  $k (empty)"; continue }
  if ($v -eq 'change-me') { Write-Host "SKIP  $k (placeholder 'change-me')"; continue }
  $toPush += $k
}

Write-Host "=== Will push $($toPush.Count) variables to Vercel PRODUCTION ==="
foreach ($k in $toPush) { Write-Host "  $k" }

$legacy = Vercel "vercel env ls production"
if ($legacy -match '^Gemini_API_Key') {
  Write-Host "Removing wrong-cased legacy var Gemini_API_Key..."
  Write-Host (Vercel "vercel env rm Gemini_API_Key production --yes")
}

foreach ($k in $toPush) {
  $v = $merged[$k]
  Write-Host "Adding $k to production..."
  $file = Join-Path $env:TEMP ("vercel_env_$k.txt")
  [System.IO.File]::WriteAllText($file, $v, [System.Text.UTF8Encoding]::new($false))
  $out = Vercel "cmd /c vercel env add $k production --force --yes < `"$file`""
  Write-Host ($out.Trim())
  Remove-Item $file -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "=== DONE. Verifying ==="
Write-Host (Vercel "vercel env ls production")
