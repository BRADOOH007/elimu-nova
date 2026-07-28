# Script to restore school admin pages from backup

$backupPath = "C:\Users\infin\Desktop\EduGeniusnAI2\EduGeniusnAI\src\app\school-admin"
$currentPath = "src\app\school-admin"

Write-Host "Restoring school admin pages from backup..." -ForegroundColor Green
Write-Host ""

# Get all subdirectories in backup
$folders = Get-ChildItem -Path $backupPath -Directory

foreach ($folder in $folders) {
    $pagePath = Join-Path $folder.FullName "page.tsx"
    
    if (Test-Path $pagePath) {
        $destFolder = Join-Path $currentPath $folder.Name
        $destPath = Join-Path $destFolder "page.tsx"
        
        # Create destination folder if it doesn't exist
        if (-not (Test-Path $destFolder)) {
            New-Item -ItemType Directory -Path $destFolder -Force | Out-Null
        }
        
        # Copy the file
        Copy-Item -Path $pagePath -Destination $destPath -Force
        Write-Host "Restored: $($folder.Name)\page.tsx" -ForegroundColor Green
    }
}

# Also copy layout if it exists
$layoutPath = Join-Path $backupPath "layout.tsx"
if (Test-Path $layoutPath) {
    Copy-Item -Path $layoutPath -Destination (Join-Path $currentPath "layout.tsx") -Force
    Write-Host "Restored: layout.tsx" -ForegroundColor Green
}

Write-Host ""
Write-Host "Restore complete!" -ForegroundColor Cyan
