# 🚀 Add Cloudinary Credentials to Vercel

## ✅ Your Cloudinary Credentials (Ready to Use)

```bash
Cloud Name: df2lyfxgq
API Key: 232983669665276
API Secret: g0T5AD6L8YplB0y3FGmErTOOKjE
```

## 📋 **Step-by-Step: Add to Vercel**

### **1. Go to Vercel Dashboard**
- Visit: [vercel.com/dashboard](https://vercel.com/dashboard)
- Select your **ElimuNova** project
- Click: **Settings** → **Environment Variables**

### **2. Add These 3 Cloudinary Variables**

**Variable 1:**
```
Name: CLOUDINARY_CLOUD_NAME
Value: df2lyfxgq
Environments: ✅ Production ✅ Preview ✅ Development
```

**Variable 2:**
```
Name: CLOUDINARY_API_KEY
Value: 232983669665276
Environments: ✅ Production ✅ Preview ✅ Development
```

**Variable 3:**
```
Name: CLOUDINARY_API_SECRET
Value: g0T5AD6L8YplB0y3FGmErTOOKjE
Environments: ✅ Production ✅ Preview ✅ Development
```

### **3. Add Other Required Variables (If Missing)**

**Core Variables:**
```
Name: OPENAI_API_KEY
Value: REDACTED

Name: DATABASE_URL
Value: postgresql://neondb_owner:npg_4dCrxETYqoX9@ep-steep-feather-ahzjj8zt-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require

Name: NEXTAUTH_URL
Value: https://elimunova.vercel.app

Name: NEXTAUTH_SECRET
Value: 0ba9a025a07af88aad2f33092fd51801
```

**Stripe Variables:**
```
Name: STRIPE_SECRET_KEY
Value: sk_test_51SVTriCnp0eOHDCgA8wFOWRGyn8IfDhCdbkCNRKzzy1xIfNZoTwTig5pFfNi2wJDqTMLPNzrO0NeZmnggTfmzmJ100L6GBa69G

Name: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
Value: pk_test_51SVTriCnp0eOHDCgKhUs5mEufeJZhxz8nfGD6TPh95sI2Vtqu53stta43qq8un4zDjVCOmyGga2R3TAXbjNyX9lu00MxUhgh2u
```

### **4. Redeploy Application**
1. Go to **Deployments** tab in Vercel
2. Click **Redeploy** on latest deployment
3. **Uncheck** "Use existing Build Cache"
4. Wait for deployment to complete

### **5. Test AI Image Generation**
1. Visit: `https://elimunova.vercel.app`
2. Login as teacher
3. Go to: **AI Tools** → **Image Generator**
4. Generate an educational image
5. Verify it displays immediately and permanently

## 🎯 **Expected Results**

After adding variables and redeploying:
- ✅ **No more HTTP 500 errors**
- ✅ **AI images generate successfully**
- ✅ **Images stored permanently in Cloudinary**
- ✅ **Fast loading from global CDN**
- ✅ **Images appear in Cloudinary dashboard**

## 🔍 **Verification**

### **Check Cloudinary Dashboard:**
- Go to: [console.cloudinary.com](https://console.cloudinary.com)
- Navigate to: **Media Library**
- Look for: `elimunova/ai_images/` folder
- You should see uploaded images there

### **Check Your App:**
- Generate multiple images
- Refresh page - images should still be there
- Images should load instantly

---

**Your AI image storage will be completely fixed once you add these variables to Vercel!** 🚀