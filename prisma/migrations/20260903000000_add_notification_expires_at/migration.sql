-- Add optional expiry timestamp to notifications so broadcast banners
-- (e.g. scheduled maintenance) automatically stop showing once elapsed.
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);
