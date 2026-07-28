<#
.SYNOPSIS
  Restore a custom-format pg_dump backup to a target database.
.DESCRIPTION
  Restores a .sql backup file created by pg_dump (custom format) to a
  PostgreSQL database. Includes a dry-run mode and confirmation prompt.
.PARAMETER BackupFile
  Path to the .sql backup file to restore.
.PARAMETER TargetDatabaseUrl
  PostgreSQL connection string for the target database.
.PARAMETER DryRun
  If set, only shows what would be done without actually restoring.
.EXAMPLE
  .\scripts\restore-backup.ps1 -BackupFile backup.sql -TargetDatabaseUrl $env:DATABASE_URL
  .\scripts\restore-backup.ps1 -BackupFile backup.sql -TargetDatabaseUrl "postgresql://..." -DryRun
#>
param(
  [Parameter(Mandatory=$true)]
  [string]$BackupFile,
  [Parameter(Mandatory=$true)]
  [string]$TargetDatabaseUrl,
  [switch]$DryRun
)

if (-not (Get-Command pg_restore -ErrorAction SilentlyContinue)) {
  Write-Error "pg_restore not found. Install PostgreSQL client tools first."
  exit 1
}

if (-not (Test-Path $BackupFile)) {
  Write-Error "Backup file not found: $BackupFile"
  exit 1
}

$fileSize = (Get-Item $BackupFile).Length
Write-Host "Backup file: $BackupFile ($([math]::Round($fileSize / 1MB, 2)) MB)"

if ($DryRun) {
  Write-Host "[DRY RUN] Would run: pg_restore --no-owner --no-acl --verbose -d <target> $BackupFile"
  exit 0
}

$confirm = Read-Host "This will OVERWRITE the target database. Are you sure? (yes/no)"
if ($confirm -ne "yes") {
  Write-Host "Aborted."
  exit 1
}

Write-Host "Restoring backup... (this may take several minutes)"
pg_restore --no-owner --no-acl --verbose -d "$TargetDatabaseUrl" "$BackupFile"

if ($LASTEXITCODE -eq 0) {
  Write-Host "✅ Restore completed successfully."
} else {
  Write-Error "Restore failed with exit code $LASTEXITCODE"
  exit 1
}
