# 🚀 Quick Deployment Guide - ElimuNova AI

## 5-Minute Deployment to Vercel

### Step 1: Get a Database (Choose One)

**Option A: Vercel Postgres** (Easiest)
- Go to Vercel Dashboard → Storage → Create Database → Postgres
- Copy connection string

**Option B: Neon** (Free Tier)
- Sign up at https://neon.tech
- Create project → Copy connection string

**Option C: Supabase** (Free Tier)
- Sign up at https://supabase.com
- Create project → Settings → Database → Copy connection pooling URL

---

### Step 2: Deploy to Vercel

1. **Push code to GitHub** (if not already)
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to https://vercel.com/new
   - Import your repository
   - Click "Deploy"

3. **Add Environment Variables**
   In Vercel dashboard, add these:
   ```
   DATABASE_URL=your_database_connection_string
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXTAUTH_SECRET=run_this_command_to_generate
   OPENAI_API_KEY=sk-or-v1-...your-key-here...
   ```

   Generate NEXTAUTH_SECRET:
   ```bash
   openssl rand -base64 32
   ```

4. **Redeploy** after adding environment variables

---

### Step 3: Setup Database

```bash
# Set your production database URL
export DATABASE_URL="your_production_database_url"

# Run migrations
npx prisma migrate deploy

# Setup initial data (creates admin, packages, etc.)
npx ts-node scripts/setup-vercel-production.ts
```

Follow the prompts to create your admin account.

---

### Step 4: Test Your Deployment

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Login with admin credentials you created
3. Test creating a school, teacher, and student

---

## Environment Variables Checklist

```env
# Required
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your_generated_secret

# AI Features (Required)
OPENAI_API_KEY=sk-or-v1-...

# Image Generation (Optional)
OPENAI_DALLE_API_KEY=sk-proj-...
STABILITY_API_KEY=sk-...
REPLICATE_API_TOKEN=r8_...
```

---

## Common Issues & Fixes

### Build Fails
```bash
# Add to package.json scripts:
"postinstall": "prisma generate"
```

### Database Connection Error
- Ensure `?sslmode=require` is in connection string
- Check database allows external connections
- Verify credentials are correct

### Prisma Client Error
```bash
# Redeploy with this build command in Vercel:
prisma generate && next build
```

---

## Quick Commands

```bash
# View deployment logs
vercel logs

# Deploy to production
vercel --prod

# Rollback deployment
vercel rollback

# Open Prisma Studio (production)
DATABASE_URL="prod_url" npx prisma studio
```

---

## Database Providers Comparison

| Provider | Free Tier | Storage | Best For |
|----------|-----------|---------|----------|
| Vercel Postgres | No | - | Vercel users |
| Neon | Yes | 0.5GB | Small projects |
| Supabase | Yes | 500MB | Full-stack apps |
| Railway | Trial | 1GB | Quick setup |

---

## Post-Deployment Checklist

- [ ] Application loads successfully
- [ ] Can login with admin account
- [ ] Can create school
- [ ] Can create teacher
- [ ] Can create student
- [ ] AI features work
- [ ] Image generation works (if enabled)
- [ ] Custom domain configured (optional)

---

## Need More Details?

See `VERCEL_DEPLOYMENT_GUIDE.md` for comprehensive instructions.

---

## Support

- Vercel: https://vercel.com/docs
- Prisma: https://www.prisma.io/docs
- Database issues: Check provider documentation

---

**Ready to deploy?** Start with Step 1! 🎉
