# ✅ Vercel Environment Variables Checklist

## 🎯 **Goal: Fix AI Tools in Production**

### **Step 1: Access Vercel Dashboard**
- [ ] Go to [vercel.com/dashboard](https://vercel.com/dashboard)
- [ ] Find your **ElimuNova** project
- [ ] Click **Settings** → **Environment Variables**

### **Step 2: Add Environment Variables**

Copy these EXACT values into Vercel:

#### **Core Variables (CRITICAL for AI Tools)**
- [ ] `OPENAI_API_KEY` = `REDACTED`

#### **Database & Auth**
- [ ] `DATABASE_URL` = `postgresql://neondb_owner:npg_4dCrxETYqoX9@ep-steep-feather-ahzjj8zt-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require`
- [ ] `NEXTAUTH_URL` = `https://elimunova.vercel.app` (or your actual domain)
- [ ] `NEXTAUTH_SECRET` = `0ba9a025a07af88aad2f33092fd51801`

#### **Stripe Billing**
- [ ] `STRIPE_SECRET_KEY` = `sk_test_51SVTriCnp0eOHDCgA8wFOWRGyn8IfDhCdbkCNRKzzy1xIfNZoTwTig5pFfNi2wJDqTMLPNzrO0NeZmnggTfmzmJ100L6GBa69G`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_test_51SVTriCnp0eOHDCgKhUs5mEufeJZhxz8nfGD6TPh95sI2Vtqu53stta43qq8un4zDjVCOmyGga2R3TAXbjNyX9lu00MxUhgh2u`

### **Step 3: Environment Selection**
For each variable, check:
- [ ] **Production** ✅ (MOST IMPORTANT)
- [ ] **Preview** ✅ (Recommended)
- [ ] **Development** ✅ (Optional)

### **Step 4: Redeploy**
- [ ] Go to **Deployments** tab
- [ ] Click **Redeploy** on latest deployment
- [ ] Uncheck "Use existing Build Cache"
- [ ] Wait for deployment to complete

### **Step 5: Test AI Tools**
- [ ] Visit your live site
- [ ] Login as teacher
- [ ] Go to **AI Tools**
- [ ] Test generating:
  - [ ] Lesson Plan
  - [ ] Presentation  
  - [ ] Educational Image
  - [ ] Rubric

### **✅ Success Indicators**
- [ ] No "Failed to generate..." errors
- [ ] AI content generates successfully
- [ ] Images display in presentations
- [ ] Content saves to database

---

## 🚨 **If Issues Persist**

1. **Check Function Logs**: Vercel Dashboard → Functions → View logs
2. **Verify Variables**: Ensure no typos in variable names/values
3. **Fresh Deploy**: Force new build without cache
4. **Domain Match**: Ensure NEXTAUTH_URL matches your exact Vercel URL

---

**🎉 Once complete, your AI Tools will work perfectly!**