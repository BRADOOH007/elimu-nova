#!/bin/bash
# Zero-downtime database migration script
# Usage: ./scripts/migrate.sh [environment]
# Environments: local, staging, production

set -euo pipefail

ENVIRONMENT="${1:-local}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🚀 Starting database migration for environment: $ENVIRONMENT"

# Load environment variables
if [[ -f "$PROJECT_ROOT/.env.$ENVIRONMENT" ]]; then
    export $(cat "$PROJECT_ROOT/.env.$ENVIRONMENT" | grep -v '^#' | xargs)
    echo "✅ Loaded environment from .env.$ENVIRONMENT"
elif [[ -f "$PROJECT_ROOT/.env" ]]; then
    export $(cat "$PROJECT_ROOT/.env" | grep -v '^#' | xargs)
    echo "✅ Loaded environment from .env"
else
    echo "❌ No environment file found"
    exit 1
fi

# Validate required variables
if [[ -z "${DATABASE_URL:-}" ]]; then
    echo "❌ DATABASE_URL is not set"
    exit 1
fi

echo "📊 Database URL configured: ${DATABASE_URL:0:30}..."

# Step 1: Generate Prisma Client
echo "📦 Generating Prisma Client..."
cd "$PROJECT_ROOT"
npx prisma generate

# Step 2: Check migration status
echo "📋 Checking migration status..."
npx prisma migrate status

# Step 3: Create backup (production only)
if [[ "$ENVIRONMENT" == "production" ]]; then
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    echo "💾 Creating database backup: $BACKUP_FILE"
    pg_dump "$DATABASE_URL" > "$BACKUP_FILE"
    echo "✅ Backup created: $BACKUP_FILE"
fi

# Step 4: Apply migrations
echo "⬆️ Applying pending migrations..."
npx prisma migrate deploy

# Step 4.5: Generate Prisma Client again after migrations
npx prisma generate

# Step 5: Verify migration
echo "✅ Verifying migration status..."
npx prisma migrate status

# Step 6: Seed database (optional - only for local/staging)
if [[ "$ENVIRONMENT" != "production" ]]; then
    echo "🌱 Seeding database..."
    npx prisma db seed || echo "⚠️ Seed script not found or failed (non-critical)"
fi

echo "🎉 Migration completed successfully!"
echo "📝 Summary:"
echo "   Environment: $ENVIRONMENT"
echo "   Migrations applied: $(npx prisma migrate status --json | jq -r '.applied')"
echo "   Database: ${DATABASE_URL:0:30}..."