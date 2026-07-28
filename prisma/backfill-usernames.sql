-- Backfill usernames for existing users based on firstname.lastname
-- Run this in your Neon SQL editor or via psql

-- First pass: set username = firstname.lastname for users that don't conflict
UPDATE users
SET username = LOWER(REGEXP_REPLACE(first_name, '[^a-z0-9]', '', 'g') || '.' || REGEXP_REPLACE(last_name, '[^a-z0-9]', '', 'g'))
WHERE username IS NULL;

-- Second pass: resolve conflicts by appending a suffix
-- (This approach updates conflicting rows with a unique suffix)
UPDATE users u
SET username = u.username || '.' || SUBSTRING(MD5(u.id::text) FROM 1 FOR 6)
WHERE username IS NULL
   OR EXISTS (SELECT 1 FROM users u2 WHERE u2.username = u.username AND u2.id <> u.id);
