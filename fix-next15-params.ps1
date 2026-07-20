# Fix Next.js 15+ route handler params type annotations
# Changes `{ params }: { params: { id: string } }` -> `{ params }: { params: Promise<{ id: string }> }`

$ErrorActionPreference = "Stop"
$root = "C:\Users\Home\Desktop\Elimu Nova\EduGeniusnAI"

# Find all route.ts files that still have the old non-Promise params type
Get-ChildItem -Path "$root\src" -Recurse -Filter "route.ts" | ForEach-Object {
    $path = $_.FullName
    $content = Get-Content -Path $path -Raw
    
    $changed = $false
    
    # Match: `{ params }: { params: { id: string } }` or `{ params }: { params: { lessonId: string } }`
    # Use a [regex] object for proper backreference handling
    $regex = [regex]'\{\s*params\s*\}\s*:\s*\{\s*params\s*:\s*\{\s*([a-zA-Z]+)\s*:\s*string\s*\}\s*\}'
    $newContent = $regex.Replace($content, '{ params }: { params: Promise<{ $1: string }> }')
    
    if ($newContent -ne $content) {
        $content = $newContent
        $changed = $true
    }
    
    if ($changed) {
        Write-Host "FIXED: $($_.FullName.Replace($root,''))"
        Set-Content -Path $path -Value $content -NoNewline
    }
}

Write-Host "Done fixing params types."
