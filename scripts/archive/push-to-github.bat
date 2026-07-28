@echo off
echo ========================================
echo GitHub Push Helper
echo ========================================
echo.
echo This will help you push your code to GitHub.
echo.
echo You have 3 options:
echo.
echo 1. Use GitHub Desktop (EASIEST - Recommended)
echo    Download: https://desktop.github.com/
echo.
echo 2. Use Personal Access Token
echo    Create token: https://github.com/settings/tokens
echo.
echo 3. Manual push (if already authenticated)
echo.
set /p choice="Enter your choice (1, 2, or 3): "

if "%choice%"=="1" (
    echo.
    echo Opening GitHub Desktop download page...
    start https://desktop.github.com/
    echo.
    echo After installing GitHub Desktop:
    echo 1. Sign in with your GitHub account
    echo 2. File -^> Add Local Repository
    echo 3. Select this folder
    echo 4. Click "Publish repository"
    echo.
    pause
    exit
)

if "%choice%"=="2" (
    echo.
    echo Opening GitHub token creation page...
    start https://github.com/settings/tokens
    echo.
    echo Steps:
    echo 1. Click "Generate new token (classic)"
    echo 2. Give it a name: ElimuNova-Deploy
    echo 3. Select scope: repo (full control)
    echo 4. Generate and COPY the token
    echo.
    set /p token="Paste your token here: "
    
    if "%token%"=="" (
        echo Error: No token provided
        pause
        exit
    )
    
    echo.
    echo Updating remote URL with token...
    git remote set-url origin https://%token%@github.com/J0SE-CEO/ElimuNova.git
    
    echo.
    echo Pushing to GitHub...
    git push -u origin main
    
    if %errorlevel% equ 0 (
        echo.
        echo ========================================
        echo SUCCESS! Code pushed to GitHub
        echo ========================================
        echo.
        echo View your repository:
        echo https://github.com/J0SE-CEO/ElimuNova
        echo.
        echo Next: Deploy to Vercel
        echo https://vercel.com/new
        echo.
    ) else (
        echo.
        echo ========================================
        echo FAILED! Please check your token
        echo ========================================
        echo.
    )
    
    pause
    exit
)

if "%choice%"=="3" (
    echo.
    echo Attempting to push...
    git push -u origin main
    
    if %errorlevel% equ 0 (
        echo.
        echo ========================================
        echo SUCCESS! Code pushed to GitHub
        echo ========================================
        echo.
    ) else (
        echo.
        echo ========================================
        echo FAILED! You need to authenticate
        echo ========================================
        echo.
        echo Please run this script again and choose option 1 or 2
        echo.
    )
    
    pause
    exit
)

echo Invalid choice. Please run the script again.
pause
