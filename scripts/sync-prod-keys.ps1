# sync-prod-keys.ps1
# One-shot helper: merge AI provider keys (copied from the Vercel dashboard)
# into the local .env file. Preserves everything already in .env (e.g. the
# local DATABASE_URL) and only updates the AI keys.
#
# Why manual: Vercel marks these as "sensitive", so `vercel env pull` returns
# empty strings and the REST API refuses to return them. Values must be copied
# from the Vercel dashboard by hand.
#
# Usage:  powershell -ExecutionPolicy Bypass -File scripts/sync-prod-keys.ps1

$ErrorActionPreference = 'Stop'

$secretKeys = @(
  'OPENAI_API_KEY', 'GEMINI_API_KEY', 'GROQ_API_KEY', 'CEREBRAS_API_KEY',
  'DEEPSEEK_API_KEY', 'OPENROUTER_API_KEY', 'OPENAI_DALLE_API_KEY',
  'STABILITY_API_KEY'
)

$plainKeys = @('PREMIUM_OPENAI_MODEL', 'PREMIUM_GEMINI_MODEL')

$envPath = Join-Path (Split-Path $PSScriptRoot -Parent) '.env'
$dashUrl = 'https://vercel.com/polaristech/elimu-nova-ai/settings/environment-variables'

if (-not (Test-Path -LiteralPath $envPath)) {
  Write-Host "ERROR: .env not found at $envPath" -ForegroundColor Red
  exit 1
}

Write-Host "Opening Vercel dashboard in your browser..." -ForegroundColor Cyan
Start-Process $dashUrl
Write-Host ""

function Read-Secret([string]$prompt) {
  $secure = Read-Host -Prompt $prompt -AsSecureString
  if (-not $secure) { return '' }
  $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try { return [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr) }
  finally { [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
}

$updates = @{}

Write-Host "Paste each value from the Vercel dashboard (blank = skip)." -ForegroundColor Yellow
Write-Host "Secrets are not echoed." -ForegroundColor Yellow
Write-Host ""

foreach ($k in $secretKeys) {
  $val = Read-Secret "$k"
  if ($val.Trim() -ne '') { $updates[$k] = $val.Trim() }
}

foreach ($k in $plainKeys) {
  $val = Read-Host "$k"
  if ($val.Trim() -ne '') { $updates[$k] = $val.Trim() }
}

if ($updates.Count -eq 0) {
  Write-Host "Nothing entered - no changes made." -ForegroundColor Yellow
  exit 0
}

$lines = Get-Content -LiteralPath $envPath
$seen = @{}
$newLines = @()

foreach ($line in $lines) {
  $trim = $line.Trim()
  if ($trim -eq '' -or $trim.StartsWith('#')) {
    $newLines += $line
    continue
  }
  $key = ($trim -split '=', 2)[0].Trim()
  if ($updates.ContainsKey($key)) {
    $newLines += "$key=$($updates[$key])"
    $seen[$key] = $true
  } else {
    $newLines += $line
  }
}

foreach ($k in ($secretKeys + $plainKeys)) {
  if ($updates.ContainsKey($k) -and -not $seen.ContainsKey($k)) {
    $newLines += "$k=$($updates[$k])"
  }
}

Set-Content -LiteralPath $envPath -Value $newLines -Encoding utf8

Write-Host ""
Write-Host "Updated $($updates.Count) key(s) in .env" -ForegroundColor Green
Write-Host "Restart the dev server for the changes to take effect." -ForegroundColor Green
