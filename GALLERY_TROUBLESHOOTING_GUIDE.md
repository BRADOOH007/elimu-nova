# Gallery Troubleshooting Guide

## 🔍 Issue: Not Seeing Saved AI Images

You've successfully generated images (they're in the database and storage), but they're not showing up in the Gallery tab.

## 📋 Troubleshooting Steps

### Step 1: Check Browser Console
1. **Open the Gallery tab** in your browser
2. **Press F12** to open Developer Tools
3. **Go to Console tab**
4. **Look for these log messages:**
   - `🔍 Loading images...`
   - `📡 Making API request to: /api/ai/images?limit=50`
   - `📥 API result: {...}`
   - `✅ Images loaded: X` or `❌ API request failed: ...`

### Step 2: Check Network Tab
1. **In Developer Tools, go to Network tab**
2. **Refresh the Gallery tab**
3. **Look for requests to:**
   - `/api/ai/images` - Should return 200 OK
   - `/api/ai/images/stats` - Should return 200 OK
4. **If you see 401 Unauthorized:**
   - You're not logged in properly
   - Try logging out and back in

### Step 3: Verify Login Status
1. **Make sure you're logged in** as the same user who generated the images
2. **Check if you're on the correct user account**
3. **Try logging out and back in**

### Step 4: Check Database Records
Run this command to verify your images are in the database:
```bash
npx tsx scripts/test-gallery-api.ts
```

### Step 5: Check File Storage
Look in the `public/ai-images/` directory to see if image files exist.

## 🐛 Common Issues & Solutions

### Issue 1: 401 Unauthorized
**Cause:** Not logged in or session expired
**Solution:** Log out and log back in

### Issue 2: Empty Gallery Despite Images in Database
**Cause:** API request failing silently
**Solution:** Check browser console for error messages

### Issue 3: Images Not Loading
**Cause:** Image URLs are incorrect or files don't exist
**Solution:** Check if files exist in `public/ai-images/`

### Issue 4: Gallery Tab Not Visible
**Cause:** Component not properly imported
**Solution:** Check if Gallery tab appears in AI Tools

## 🔧 Quick Fixes

### Fix 1: Clear Browser Cache
1. Press **Ctrl+Shift+R** (or Cmd+Shift+R on Mac) to hard refresh
2. Or clear browser cache completely

### Fix 2: Restart Development Server
```bash
# Stop the server (Ctrl+C)
npm run dev
```

### Fix 3: Check User ID Match
The images are tied to specific user IDs. Make sure you're logged in as the same user who generated the images.

## 📊 Expected Behavior

When working correctly, you should see:
1. **Stats Cards** showing total images, storage used, etc.
2. **Image Grid** with thumbnails of your generated images
3. **Search and Filter** options working
4. **Click to view** full-size images in a modal

## 🆘 If Still Not Working

1. **Check the browser console** for any JavaScript errors
2. **Verify the API endpoints** are responding correctly
3. **Make sure you're logged in** as the correct user
4. **Try generating a new image** and see if it appears immediately

## 📝 Debug Information to Collect

If you need further help, please provide:
1. **Browser console logs** when loading the Gallery
2. **Network tab requests** showing API calls
3. **Your login status** and user role
4. **Any error messages** you see

The images are definitely being saved (we confirmed this), so the issue is likely with the frontend loading or user authentication.