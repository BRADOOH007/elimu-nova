# 🚨 Production Database Issues - Diagnosis & Solutions

## ❌ **Problem: All Dashboards Not Fetching Data in Production**

If ALL dashboards are showing "Loading..." or errors in production but work locally, this indicates a fundamental infrastructure issue, not a code issue.

## 🔍 **Most Likely Causes**

### **1. Database Connection Issues (90% probability)**
- **Missing DATABASE_URL**: Environment variable not set in Vercel
- **Wrong DATABASE_URL**: Incorrect connection string format
- **Database Access**: Neon database not accessible from Vercel
- **Connection Limits**: Database connection pool exhausted

### **2. Environment Variables (80% probability)**
- **NEXTAUTH_SECRET**: Missing or incorrect
- **NEXTAUTH_URL**: Wrong production URL
- **NODE_ENV**: Not set to 'production'

### **3. Prisma Client Issues (70% probability)**
- **Schema Mismatch**: Production client not updated with latest schema
- **Generation Failed**: Prisma client not properly generated in production
- **Migration Issues**: Database schema not migrated

### **4. Authentication Issues (60% probability)**
- **Session Problems**: NextAuth not working in production
- **Cookie Issues**: Secure cookie settings for production
- **Domain Mismatch**: NEXTAUTH_URL doesn't match actual domain

## 🛠️ **Immediate Diagnostic Steps**

### **Step 1: Check Vercel Environment Variables**
Go to Vercel Dashboard → Your Project → Settings → Environment Variables

**Required Variables:**
```
DATABASE_URL=postgresql://username:password@host:5432/database?sslmode=require
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=https://your-vercel-domain.vercel.app
```

### **Step 2: Test Database Connection**
Visit your production site: `https://your-domain.vercel.app/api/health`

**Expected Response:**
```json
{
  "status": "healthy",
  "database": {
    "connected": true,
    "responseTime": "50ms",
    "userCount": 10,
    "schoolCount": 2
  }
}
```

**If Unhealthy:**
```json
{
  "status": "unhealthy",
  "database": {
    "connected": false
  },
  "error": {
    "message": "Connection error details"
  }
}
```

### **Step 3: Check Vercel Function Logs**
1. Go to Vercel Dashboard
2. Navigate to your project
3. Click "Functions" tab
4. Look for API route errors
5. Check for database connection failures

### **Step 4: Test Authentication**
Visit: `https://your-domain.vercel.app/api/auth/session`

**Expected Response (if logged in):**
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "role": "SCHOOL_ADMIN"
  }
}
```

## 🔧 **Common Fixes**

### **Fix 1: Database URL Format**
Ensure your DATABASE_URL is properly formatted for Neon:
```
postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/database?sslmode=require
```

### **Fix 2: NEXTAUTH_URL**
Must match your exact Vercel domain:
```
NEXTAUTH_URL=https://your-project-name.vercel.app
```

### **Fix 3: Prisma Schema Migration**
In Vercel, ensure the build process runs:
```bash
prisma generate
prisma db push  # or prisma migrate deploy
```

### **Fix 4: Connection Pool Settings**
Add to your DATABASE_URL:
```
?sslmode=require&connection_limit=5&pool_timeout=20
```

## 🚨 **Emergency Fixes**

### **Quick Fix 1: Force Prisma Regeneration**
Add to your `package.json` build script:
```json
{
  "scripts": {
    "build": "prisma generate && prisma db push && next build"
  }
}
```

### **Quick Fix 2: Add Database Retry Logic**
Update `src/lib/prisma.ts`:
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### **Quick Fix 3: Add Connection Test**
Add this to your API routes:
```typescript
// Test database connection before queries
try {
  await prisma.$queryRaw`SELECT 1`
} catch (error) {
  console.error('Database connection failed:', error)
  return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
}
```

## 🔍 **Debugging Commands**

### **Check Vercel Logs**
```bash
vercel logs your-project-name
```

### **Test Production APIs**
```bash
curl https://your-domain.vercel.app/api/health
curl https://your-domain.vercel.app/api/debug/database
```

### **Check Environment Variables**
```bash
vercel env ls
```

## 📊 **Expected Behavior After Fix**

### **Working Dashboards Should Show:**
- ✅ **School Admin**: Teacher/student counts, subscription info
- ✅ **Teacher**: Class stats, student lists, subscription status
- ✅ **Student**: Assignment counts, teacher info, progress
- ✅ **Super Admin**: Revenue metrics, system statistics

### **API Health Indicators:**
- ✅ `/api/health` returns 200 with database connection
- ✅ Dashboard APIs return 200 with data (when authenticated)
- ✅ No 500 errors in Vercel function logs
- ✅ Database queries complete in <1000ms

## 🎯 **Most Likely Solution**

**90% of production database issues are caused by:**
1. **Missing DATABASE_URL** in Vercel environment variables
2. **Incorrect NEXTAUTH_URL** not matching production domain
3. **Prisma client not regenerated** with latest schema

**Check these three things first!**

## 🚀 **Next Steps**

1. **Verify Environment Variables** in Vercel dashboard
2. **Test Health Endpoint** to confirm database connectivity
3. **Check Vercel Function Logs** for specific error messages
4. **Test Authentication** to ensure sessions work
5. **Force Redeploy** if environment variables were updated

**🔧 Once the database connection is restored, all dashboard data should load correctly!**