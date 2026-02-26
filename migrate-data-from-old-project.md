# Data Migration Guide - Old to New Supabase Project

## Overview

We need to migrate:
- ✅ Profiles (users, usernames, avatars, coins, XP)
- ✅ Games (all games with thumbnails, code, metadata)
- ✅ Game Likes
- ✅ Game Comments
- ✅ Follows
- ✅ Direct Messages
- ✅ Coin Purchases
- ✅ Storage files (avatars, thumbnails)

---

## Method 1: Using Supabase CLI (Recommended)

### Step 1: Export Data from Old Project

```bash
# Set old project credentials temporarily
$env:OLD_PROJECT_URL="https://zyozjzfkmmtuxvjgryhk.supabase.co"
$env:OLD_PROJECT_KEY="your_old_anon_key"

# Link to old project temporarily
supabase link --project-ref zyozjzfkmmtuxvjgryhk

# Dump data from old project
supabase db dump --data-only -f old_project_data.sql

# Or dump specific tables
supabase db dump --data-only --table profiles -f profiles_data.sql
supabase db dump --data-only --table games -f games_data.sql
supabase db dump --data-only --table game_likes -f likes_data.sql
supabase db dump --data-only --table game_comments -f comments_data.sql
supabase db dump --data-only --table follows -f follows_data.sql
```

### Step 2: Import Data to New Project

```bash
# Link back to new project
supabase link --project-ref tadxoqrxzzmrksdslthd

# Import data
psql $DATABASE_URL < old_project_data.sql

# Or import specific tables
psql $DATABASE_URL < profiles_data.sql
psql $DATABASE_URL < games_data.sql
psql $DATABASE_URL < likes_data.sql
psql $DATABASE_URL < comments_data.sql
psql $DATABASE_URL < follows_data.sql
```

---

## Method 2: Using Supabase Dashboard (Easier)

### Step 1: Export from Old Project

1. Go to old project: https://supabase.com/dashboard/project/zyozjzfkmmtuxvjgryhk/editor

2. For each table (profiles, games, game_likes, game_comments, follows):
   - Click on the table
   - Click "Export" button (top right)
   - Download as CSV

### Step 2: Import to New Project

1. Go to new project: https://supabase.com/dashboard/project/tadxoqrxzzmrksdslthd/editor

2. For each table:
   - Click on the table
   - Click "Insert" → "Import data from CSV"
   - Upload the CSV file
   - Map columns
   - Import

---

## Method 3: Using SQL Script (Most Control)

I'll create a script that connects to both projects and copies data.

---

## Method 4: Using Supabase Studio (Visual)

### Export Tables:

1. **Old Project Dashboard:**
   - Table Editor → Select table → Export → CSV

2. **Download these tables:**
   - profiles.csv
   - games.csv
   - game_likes.csv
   - game_comments.csv
   - follows.csv
   - direct_messages.csv
   - coin_purchases.csv

### Import Tables:

1. **New Project Dashboard:**
   - Table Editor → Select table → Insert → Import CSV
   - Upload each CSV file

---

## Storage Migration (Avatars & Thumbnails)

### Option A: Manual Download/Upload

1. **Download from old project:**
   - Go to: https://supabase.com/dashboard/project/zyozjzfkmmtuxvjgryhk/storage/buckets
   - Download all files from each bucket

2. **Upload to new project:**
   - Go to: https://supabase.com/dashboard/project/tadxoqrxzzmrksdslthd/storage/buckets
   - Upload files to corresponding buckets

### Option B: Using CLI

```bash
# Export storage from old project
supabase storage ls --project-ref zyozjzfkmmtuxvjgryhk avatars
supabase storage cp --project-ref zyozjzfkmmtuxvjgryhk avatars/* ./backup/avatars/

# Import to new project
supabase storage cp --project-ref tadxoqrxzzmrksdslthd ./backup/avatars/* avatars/
```

---

## Quick Migration Script

I'll create a Node.js script that does this automatically.

---

## Which Method Do You Prefer?

1. **Dashboard CSV Export/Import** (Easiest, visual)
2. **CLI dump/restore** (Fast, automated)
3. **Custom script** (Most control, I'll write it)

Let me know and I'll help you execute it!

---

## Important Notes:

- ⚠️ Make sure to migrate in this order:
  1. Profiles (first - other tables reference it)
  2. Games
  3. Game Likes
  4. Game Comments
  5. Follows
  6. Messages
  7. Purchases

- ⚠️ Storage files need to be migrated separately

- ⚠️ User IDs must match between auth.users and profiles

---

## Need Help?

Tell me which method you want to use and I'll guide you through it step by step!
