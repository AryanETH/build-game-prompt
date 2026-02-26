# Data Migration Guide

## Step 1: Get Your Old Project Service Role Key

1. Go to your old Supabase project: https://supabase.com/dashboard/project/zyozjzfkmmtuxvjgryhk
2. Go to Settings → API
3. Copy the `service_role` key (NOT the anon key)
4. Paste it in `migrate-data.mjs` replacing `YOUR_OLD_SERVICE_ROLE_KEY`

## Step 2: Run the Migration

```bash
node migrate-data.mjs
```

This will migrate:
- ✅ All user profiles and usernames
- ✅ All games
- ✅ All likes
- ✅ All comments
- ✅ All follows
- ✅ All notifications

## Step 3: Verify the Data

After migration, check your new project dashboard to verify:
- Games appear in the feed
- Usernames are correct
- Like counts are accurate
- Comments are preserved

## Alternative: Manual SQL Export/Import

If the script doesn't work, you can use Supabase's built-in tools:

1. Old project → Database → Backups → Download backup
2. New project → SQL Editor → Run the backup SQL

## Troubleshooting

If you get errors about missing columns, run this first:

```sql
-- Make sure all columns exist in new project
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;
```
