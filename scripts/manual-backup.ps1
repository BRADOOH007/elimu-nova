<#
.SYNOPSIS
  Create a one-off custom-format pg_dump backup of the database.
.DESCRIPTION
  Uses pg_dump to create a timestamped backup file. Requires the
  PostgreSQL client tools and a DATABASE_URL environment variable.
.PARAMETER DatabaseUrl
  PostgreSQL connection string. Defaults to $env:DATABASE_URL.
.PARAMETER OutputDir
  Directory to save the backup file. Defaults to ./backups.
.EXAMPLE
  .\scripts\manual-backup.ps1
  .\scripts\manual-backup.ps1 -DatabaseUrl "postgresql://..." -OutputDir "D:\backups"
#>
param(
  [string]$DatabaseUrl = $env:DATABASE_URL,
  [string]$OutputDir = "./backups"
)

if (-not $DatabaseUrl) {
  Write-Error "DATABASE_URL not set. Provide -DatabaseUrl or set env var."
  exit 1
}

if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) {
  Write-Error "pg_dump not found. Install PostgreSQL client tools first."
  exit 1
}

if (-not (Test-Path $OutputDir)) {
  New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyy-MM-ddTHH-mm-ss"
$filename = "elimunova-backup-$timestamp.sql"
$filepath = Join-Path $OutputDir $filename

Write-Host "Backing up database to: $filepath"
pg_dump "$DatabaseUrl" --no-owner --no-acl --format=custom --file="$filepath"

if ($LASTEXITCODE -eq 0) {
  $fileSize = (Get-Item $filepath).Length
  Write-Host "✅ Backup complete: $filepath ($([math]::Round($fileSize / 1MB, 2)) MB)"
} else {
  Write-Error "Backup failed with exit code $LASTEXITCODE"
  exit 1
}
