@echo off
echo 🚀 Deploying PowerPoint System Updates to Vercel
echo ========================================================

echo.
echo 📋 Adding all changes to git...
git add .

echo.
echo 💾 Committing changes...
git commit -m "🚀 Major PowerPoint System Update

- ✅ Fixed authentication (added credentials to all API calls)
- ✅ Added image generation system with new API endpoint  
- ✅ Enhanced PowerPoint generation with automatic images 
- ✅ Verified CRUD operations for presentations
- ✅ Fixed meetings API syntax errors
- ✅ Complete presentation system now working with images 

Features: Authentication, Image Generation, CRUD, Error Fixes"

echo.
echo 🌐 Pushing to GitHub...
git push origin main

echo.
echo ✅ DEPLOYMENT COMPLETE!
echo.
echo 🎯 What happens next:
echo 1. Vercel will automatically detect the changes
echo 2. Deployment will start in 1-2 minutes
echo 3. Check your Vercel dashboard for status
echo 4. Verify environment variables are set
echo.
echo 📋 Required Vercel Environment Variables:
echo • OPENROUTER_API_KEY=sk-or-v1-...
echo • STABILITY_API_KEY=sk-zAdfNrf3e2wPDpSjSmXQSjk8JiF424F1ddNUYX2mdfjwvJBR
echo • NEXTAUTH_SECRET=your-secret-key
echo • DATABASE_URL=your-database-url
echo • NEXTAUTH_URL=https://your-vercel-domain.vercel.app
echo.
echo 🚀 Your PowerPoint system with images should be live soon!
pause