# Database Migration Strategy

## Overview
This document outlines the zero-downtime database migration strategy for ElimuNova AI.

## Migration Principles

1. **Backward Compatibility**: Migrations must be backward compatible with existing application code
2. **Reversibility**: All migrations must be reversible (down migration)
3. **Idempotency**: Migrations should be safely re-runnable
4. **Zero Downtime**: No application downtime during migrations

## Migration Process

### 1. Development Phase
```bash
# Create migration
npx prisma migrate dev --name descriptive_name

# This creates:
# - prisma/migrations/YYYYMMDDHHMMSS_descriptive_name/migration.sql
# - Updates prisma/schema.prisma
```

### 2. Review Phase
- Review generated SQL in `prisma/migrations/`
- Ensure backward compatibility
- Add any data migration logic if needed
- Test locally with `npm run db:migrate`

### 3. Staging Deployment
```bash
# Deploy to staging
npm run db:migrate:staging

# Verify
npx prisma migrate status
```

### 4. Production Deployment
```bash
# Run with zero-downtime script
./scripts/migrate.sh production
```

## Zero-Downtime Patterns

### Adding Columns
```sql
-- ✅ Safe: Add nullable column with default
ALTER TABLE users ADD COLUMN phone VARCHAR(20);

-- ❌ Unsafe: Add NOT NULL column without default
ALTER TABLE users ADD COLUMN phone VARCHAR(20) NOT NULL;
```

### Renaming Columns
```sql
-- Phase 1: Add new column
ALTER TABLE users ADD COLUMN full_name VARCHAR(100);

-- Phase 2: Backfill data
UPDATE users SET full_name = CONCAT(first_name, ' ', last_name);

-- Phase 3: Switch application code to use full_name

-- Phase 4: Remove old columns (separate migration)
ALTER TABLE users DROP COLUMN first_name, DROP COLUMN last_name;
```

### Adding Indexes
```sql
-- ✅ Safe: Create index CONCURRENTLY (PostgreSQL)
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);

-- ❌ Unsafe: Creates lock
CREATE INDEX idx_users_email ON users(email);
```

### Removing Columns
```sql
-- Phase 1: Make column nullable in app code
-- Phase 2: Drop column (separate migration)
ALTER TABLE users DROP COLUMN deprecated_column;
```

## Data Migration Patterns

### Backfilling Data
```sql
-- Use batch processing for large tables
DO $$
DECLARE
    batch_size INTEGER := 1000;
    total_rows BIGINT;
    processed BIGINT := 0;
BEGIN
    SELECT COUNT(*) INTO total_rows FROM users WHERE full_name IS NULL;
    
    WHILE processed < total_rows LOOP
        UPDATE users 
        SET full_name = CONCAT(first_name, ' ', last_name)
        WHERE full_name IS NULL
        LIMIT batch_size;
        
        GET DIAGNOSTICS processed = ROW_COUNT;
        COMMIT;
    END LOOP;
END $$;
```

## Rollback Procedures

### Automatic Rollback (Prisma)
```bash
# Rollback last migration
npx prisma migrate resolve --rolled-back "migration_name"

# Or rollback to specific version
npx prisma migrate resolve --rolled-back "20240101000000_initial"
```

### Manual Rollback
```sql
-- For data migrations, create explicit down migration
-- Example: Remove full_name column
ALTER TABLE users DROP COLUMN IF EXISTS full_name;
```

## Monitoring & Alerts

### Pre-migration Checks
- [ ] All tests pass
- [ ] Migration is backward compatible
- [ ] Rollback plan documented
- [ ] Staging validation complete
- [ ] Backup created (production)

### Post-migration Verification
- [ ] Application starts without errors
- [ ] Critical user flows work
- [ ] Performance metrics normal
- [ ] No new errors in logs

### Rollback Triggers
- Application crash rate > 1%
- Error rate > 5%
- Performance degradation > 50%
- Data integrity issues

## Emergency Procedures

### Quick Rollback
```bash
# 1. Identify last successful migration
npx prisma migrate status

# 2. Rollback
npx prisma migrate resolve --rolled-back "migration_name"

# 3. Restart application
vercel redeploy --prod
```

### Data Recovery
```bash
# From backup
psql "$DATABASE_URL" < backup_20240115_143000.sql
```

## Migration Checklist Template

```markdown
## Migration: [Name]
- [ ] Description: 
- [ ] Backward compatible: Yes/No
- [ ] Rollback tested: Yes/No
- [ ] Data migration needed: Yes/No
- [ ] Performance impact: Low/Medium/High
- [ ] Staging tested: Yes/No
- [ ] Backup created: Yes/No
- [ ] Rollback plan: Documented
```

## Tools

- **Prisma Migrate**: Primary migration tool
- **pg_dump/pg_restore**: Backup/restore
- **pg_stat_statements**: Query performance monitoring
- **Vercel**: Deployment and preview deployments