# Vercel Deployment Guide for ElimuNova AI

## Prerequisites
- Vercel account (sign up at https://vercel.com)
- GitHub/GitLab/Bitbucket repository with your code
- Production PostgreSQL database (options below)

---

## Step 1: Choose a Production Database

### Option A: Vercel Postgres (Recommended - Easiest)
1. Go to your Vercel dashboard
2. Select your project (or create new)
3. Go to "Storage" tab
4. Click "Create Database" → Select "Postgres"
5. Copy the connection string provided

### Option B: Neon (Free Tier Available)
1. Sign up at https://neon.tech
2. Create a new project
3. Copy the connection string
4. Format: `postgresql://user:password@host/database?sslmode=require`

### Option C: Supabase (Free Tier Available)
1. Sign up at https://supabase.com
2. Create a new project
3. Go to Settings → Database
4. Copy the "Connection string" (URI format)
5. Use the "Connection pooling" URL for better performance

### Option D: Railway (Free Trial)
1. Sign up at https://railway.app
2. Create new project → Add PostgreSQL
3. Copy the connection string from the database settings

### Option E: AWS RDS / DigitalOcean / Other
- Set up PostgreSQL instance
- Ensure it's publicly accessible or configure VPC
- Get connection string

---

## Step 2: Prepare Your Repository

### 1. Update package.json
Ensure you have the build script:
```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate"
  }
}
```

### 2. Create vercel.json (Optional but Recommended)
```json
{
  "buildCommand": "prisma generate && prisma migrate deploy && next build",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

### 3. Update .gitignore
Make sure these are ignored:
```
.env
.env.local
.env.production
node_modules/
.next/
```

---

## Step 3: Deploy to Vercel

### Method 1: Via Vercel Dashboard (Easiest)

1. **Connect Repository**
   - Go to https://vercel.com/new
   - Import your Git repository
   - Select the repository

2. **Configure Project**
   - Framework Preset: Next.js
   - Root Directory: `./` (or your project root)
   - Build Command: `prisma generate && next build`
   - Output Directory: `.next`

3. **Add Environment Variables**
   Click "Environment Variables" and add:

   ```
   DATABASE_URL=your_production_database_url
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXTAUTH_SECRET=generate_new_secret_here
    OPENAI_API_KEY=sk-or-v1-...your-key-here...
   OPENAI_DALLE_API_KEY=your_openai_key
   STABILITY_API_KEY=your_stability_key
   REPLICATE_API_TOKEN=your_replicate_token
   ```

   **Generate NEXTAUTH_SECRET:**
   ```bash
   openssl rand -base64 32
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete

### Method 2: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts to configure
```

---

## Step 4: Set Up Production Database

### Run Migrations

**Option A: Using Vercel CLI (Recommended)**
```bash
# Set production database URL temporarily
export DATABASE_URL="your_production_database_url"

# Run migrations
npx prisma migrate deploy

# Seed database (if needed)
npx prisma db seed
```

**Option B: Using Prisma Studio**
```bash
# Connect to production database
DATABASE_URL="your_production_database_url" npx prisma studio
```

**Option C: Create a Deployment Script**
Create `scripts/deploy-production.sh`:
```bash
#!/bin/bash
echo "Deploying to production..."

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Optional: Seed initial data
# npx ts-node scripts/seed-production.ts

echo "Deployment complete!"
```

---

## Step 5: Initial Data Setup

### Create Super Admin User

Create `scripts/create-super-admin.ts`:
```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('YourSecurePassword123!', 10)

  const user = await prisma.user.create({
    data: {
      email: 'admin@elimunova.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
      superAdmin: {
        create: {}
      }
    }
  })

  console.log('Super Admin created:', user.email)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

Run it:
```bash
DATABASE_URL="your_production_url" npx ts-node scripts/create-super-admin.ts
```

---

## Step 6: Configure Custom Domain (Optional)

1. Go to your Vercel project settings
2. Click "Domains"
3. Add your custom domain
4. Update DNS records as instructed
5. Update `NEXTAUTH_URL` environment variable to your custom domain

---

## Step 7: Post-Deployment Checklist

- [ ] Database migrations applied successfully
- [ ] Super admin user created
- [ ] Environment variables set correctly
- [ ] Application loads without errors
- [ ] Login functionality works
- [ ] AI features work (OpenRouter API)
- [ ] Image generation works (if enabled)
- [ ] Database connections are stable
- [ ] SSL certificate is active (automatic with Vercel)

---

## Troubleshooting

### Build Fails with Prisma Error
```bash
# Add to vercel.json
{
  "buildCommand": "prisma generate && prisma migrate deploy && next build"
}
```

### Database Connection Issues
- Ensure DATABASE_URL includes `?sslmode=require` for most cloud databases
- Check if database allows connections from Vercel IPs
- Verify connection string format

### Environment Variables Not Working
- Make sure they're added in Vercel dashboard
- Redeploy after adding new variables
- Check variable names match exactly (case-sensitive)

### Prisma Client Not Generated
Add to package.json:
```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

---

## Monitoring & Maintenance

### View Logs
```bash
vercel logs your-deployment-url
```

### Database Backups
- Vercel Postgres: Automatic backups
- Neon: Automatic backups on paid plans
- Supabase: Automatic daily backups
- Manual: Use `pg_dump` for custom backups

### Performance Monitoring
- Use Vercel Analytics (built-in)
- Monitor database connection pool
- Set up error tracking (Sentry, etc.)

---

## Security Best Practices

1. **Never commit .env files**
2. **Use strong NEXTAUTH_SECRET** (32+ characters)
3. **Enable database SSL** (most providers do this by default)
4. **Rotate API keys** regularly
5. **Set up database connection pooling**
6. **Enable Vercel's security headers**
7. **Use environment-specific secrets**

---

## Cost Optimization

### Vercel
- Free tier: 100GB bandwidth, unlimited deployments
- Pro: $20/month for team features

### Database Options
- **Neon**: Free tier with 0.5GB storage
- **Supabase**: Free tier with 500MB storage
- **Vercel Postgres**: Starts at $20/month
- **Railway**: $5/month after trial

---

## Quick Commands Reference

```bash
# Deploy to production
vercel --prod

# View deployment logs
vercel logs

# Run migrations on production
DATABASE_URL="prod_url" npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Open Prisma Studio for production
DATABASE_URL="prod_url" npx prisma studio

# Rollback deployment
vercel rollback

# List deployments
vercel ls
```

---

## Support & Resources

- Vercel Docs: https://vercel.com/docs
- Prisma Docs: https://www.prisma.io/docs
- Next.js Docs: https://nextjs.org/docs
- NextAuth.js Docs: https://next-auth.js.org

---

## Next Steps After Deployment

1. Test all features thoroughly
2. Set up monitoring and alerts
3. Configure automated backups
4. Set up CI/CD pipeline (optional)
5. Add custom domain
6. Enable analytics
7. Set up error tracking
8. Create user documentation
9. Plan for scaling
10. Set up staging environment

---

**Need Help?** Check the troubleshooting section or Vercel's support documentation.
