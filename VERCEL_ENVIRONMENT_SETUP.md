# 🚀 Vercel Environment Variables Setup Guide

## 🎯 **CRITICAL: AI Tools Fix**

Your AI Tools are failing because environment variables are missing in Vercel production. Here's the complete fix:

## 📋 **Step-by-Step Instructions**

### **1. Access Vercel Dashboard**
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Find and click on your **ElimuNova** project
3. Navigate to **Settings** → **Environment Variables**

### **2. Add These EXACT Environment Variables**

Copy and paste each variable exactly as shown:

#### **🔑 Core Authentication & Database**
```bash
DATABASE_URL
postgresql://neondb_owner:YOUR_NEON_DB_PASSWORD@ep-steep-feather-ahzjj8zt-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require

NEXTAUTH_URL
https://elimunova.vercel.app

NEXTAUTH_SECRET
YOUR_NEXTAUTH_SECRET
```

#### **🤖 AI Services (MOST IMPORTANT)**
```bash
OPENAI_API_KEY
sk-proj-YOUR_OPENAI_API_KEY
```

#### **💳 Stripe Billing**
```bash
STRIPE_SECRET_KEY
sk_test_YOUR_STRIPE_SECRET_KEY

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
pk_test_YOUR_STRIPE_PUBLISHABLE_KEY

STRIPE_WEBHOOK_SECRET
whsec_your_webhook_secret_here
```

### **3. Environment Selection**
For each variable, select:
- ✅ **Production** (CRITICAL)
- ✅ **Preview** (Recommended)
- ✅ **Development** (Optional)

### **4. Trigger Redeployment**
After adding all variables:

**Option A: Git Push**
```bash
git add .
git commit -m "Update environment variables"
git push origin main
```

**Option B: Manual Redeploy**
1. Go to **Deployments** tab in Vercel
2. Click **Redeploy** on the latest deployment
3. Select **Use existing Build Cache: No**

## 🔍 **Verification Steps**

### **Test AI Tools After Deployment:**
1. Visit your live site: `https://elimunova.vercel.app`
2. Login as a teacher
3. Go to **AI Tools** section
4. Try generating:
   - ✅ Lesson Plan
   - ✅ Presentation
   - ✅ Educational Image
   - ✅ Rubric

### **Expected Results:**
- ❌ **Before Fix:** "Failed to generate..." errors
- ✅ **After Fix:** AI content generates successfully

## 🚨 **Common Issues & Solutions**

### **Issue 1: Variables Not Taking Effect**
**Solution:** Force a fresh deployment:
- Uncheck "Use existing Build Cache" when redeploying

### **Issue 2: NEXTAUTH_URL Mismatch**
**Solution:** Ensure it matches your exact Vercel domain:
```bash
NEXTAUTH_URL=https://your-actual-vercel-url.vercel.app
```

### **Issue 3: Database Connection Fails**
**Solution:** Verify the DATABASE_URL is exactly as provided (including SSL mode)

## 🎯 **Why This Fixes AI Tools**

The AI Tools were failing because:
1. **Missing OPENAI_API_KEY** → Can't call OpenAI API
2. **Missing DATABASE_URL** → Can't save generated content
3. **Missing NEXTAUTH_SECRET** → Can't verify user sessions

## ✅ **Success Indicators**

You'll know it's working when:
- AI Tools generate content without errors
- Images display properly in presentations
- Lesson plans save successfully
- No "Failed to generate..." messages

## 📞 **Need Help?**

If you encounter issues:
1. Check Vercel Function logs in the dashboard
2. Verify all environment variables are set correctly
3. Ensure the deployment used the new variables (fresh build)

---

**🎉 Once complete, your AI Tools will work perfectly in production!**