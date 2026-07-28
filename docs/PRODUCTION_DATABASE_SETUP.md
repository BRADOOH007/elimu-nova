# Production Database Setup Guide

## Option 1: Neon (Recommended)

### Steps:
1. Go to https://neon.tech
2. Sign up for a free account
3. Create a new project
4. Copy the connection string
5. Update `.env.production` with the connection string

### Connection String Format:
```
DATABASE_URL="postgresql://username:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"
```

### Advantages:
- Free tier: 0.5 GB storage, 10 GB data transfer
- Serverless (scales to zero)
- Fast cold starts
- Built-in connection pooling

---

## Option 2: Supabase

### Steps:
1. Go to https://supabase.com
2. Create a new project
3. Go to Settings > Database
4. Copy the "Connection string" (URI format)
5. Update `.env.production`

### Connection String Format:
```
DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
```

### Advantages:
- Free tier: 500 MB database, 1 GB file storage
- Additional features (Auth, Storage, Realtime)
- Good dashboard and tools

---

## Option 3: Railway

### Steps:
1. Go to https://railway.app
2. Create a new project
3. Add PostgreSQL service
4. Copy the DATABASE_URL from variables
5. Update `.env.production`

### Advantages:
- Simple setup
- $5 free credit
- Easy deployment integration

---

## Option 4: Vercel Postgres

### Steps:
1. Go to your Vercel dashboard
2. Select your project
3. Go to Storage > Create Database > Postgres
4. Copy the connection string
5. Update `.env.production`

### Advantages:
- Integrated with Vercel deployments
- Automatic environment variable sync
- Good for Vercel-hosted apps

---

## After Setting Up Database

### 1. Update .env.production
Replace the DATABASE_URL with your production database URL

### 2. Generate Production Secret
Run this command to generate a secure secret:
```bash
openssl rand -base64 32
```
Update NEXTAUTH_SECRET in `.env.production`

### 3. Run Migrations
```bash
# Set production database URL temporarily
$env:DATABASE_URL="your-production-database-url"

# Run migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

### 4. Seed Initial Data (Optional)
```bash
npx prisma db seed
```

### 5. Test Connection
```bash
npx prisma studio
```

---

## Security Checklist

- [ ] Use strong, unique passwords
- [ ] Enable SSL/TLS connections
- [ ] Set up connection pooling for production
- [ ] Use environment variables (never commit .env.production)
- [ ] Set up database backups
- [ ] Monitor database usage and performance
- [ ] Restrict database access by IP (if possible)

---

## Connection Pooling (Recommended for Production)

For better performance, use connection pooling:

### Using Prisma Accelerate:
```
DATABASE_URL="prisma://accelerate.prisma-data.net/?api_key=your-api-key"
```

### Using PgBouncer (Neon/Supabase):
Add `?pgbouncer=true` to your connection string

---

## Troubleshooting

### Connection Timeout
- Check if your IP is whitelisted
- Verify SSL mode is correct
- Check connection limits

### Migration Errors
- Ensure database is empty or run `prisma db push` instead
- Check for schema conflicts

### Performance Issues
- Enable connection pooling
- Monitor query performance
- Add database indexes if needed
