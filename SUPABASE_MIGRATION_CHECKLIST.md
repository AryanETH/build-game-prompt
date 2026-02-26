# Supabase Migration Checklist ✅

## Completed Steps

### 1. ✅ Updated `.env` file
- New Project ID: `tadxoqrxzzmrksdslthd`
- New URL: `https://tadxoqrxzzmrksdslthd.supabase.co`
- New Anon Key: Updated
- New Publishable Key: Updated

### 2. ✅ Updated `supabase/config.toml`
- Changed project_id from old to new

### 3. ✅ Fixed Hardcoded URLs in `src/pages/Create.tsx`
- Changed thumbnail generation URL to use environment variable
- Changed game generation URL to use environment variable

### 4. ✅ Verified `src/integrations/supabase/client.ts`
- Already using environment variables (no changes needed)

---

## Required Manual Steps

### 1. 🔄 Update GitHub Secrets
Go to your GitHub repository → Settings → Secrets and variables → Actions

Update these secrets with your new values:

```
SUPABASE_PROJECT_REF=tadxoqrxzzmrksdslthd
SUPABASE_URL=https://tadxoqrxzzmrksdslthd.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZHhvcXJ4enptcmtzZHNsdGhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMDM1ODcsImV4cCI6MjA4Mzg3OTU4N30.8zOnfvmbd1uSV2i44ATmMv-p3FCeP4RnLRGfsCYf3d4
SUPABASE_DB_PASSWORD=<your-new-db-password>
SUPABASE_ACCESS_TOKEN=<your-personal-access-token>
```

### 2. 🔄 Deploy Edge Functions to New Project

Run these commands in your terminal:

```bash
# Login to Supabase CLI
supabase login

# Link to new project
supabase link --project-ref tadxoqrxzzmrksdslthd

# Deploy all functions
supabase functions deploy generate-game
supabase functions deploy analyze-interface
supabase functions deploy generate-interface-image
supabase functions deploy generate-interface
supabase functions deploy generate-music
supabase functions deploy generate-thumbnail
supabase functions deploy send-password-otp
```

### 3. 🔄 Set Function Secrets

```bash
# Set OpenRouter API key (if you have one)
supabase secrets set OPENROUTER_API_KEY=<your-key>

# Set Supabase credentials for functions
supabase secrets set SUPABASE_URL=https://tadxoqrxzzmrksdslthd.supabase.co
supabase secrets set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZHhvcXJ4enptcmtzZHNsdGhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMDM1ODcsImV4cCI6MjA4Mzg3OTU4N30.8zOnfvmbd1uSV2i44ATmMv-p3FCeP4RnLRGfsCYf3d4
```

### 4. 🔄 Restart Your Dev Server

```bash
# Stop current server (Ctrl+C)
# Then restart
npm run dev
```

### 5. ✅ Test Authentication
- Try logging in with existing account
- Try signing up with new account
- Verify OTP emails are working

### 6. ✅ Test Game Creation
- Create a new game
- Verify thumbnail generation works
- Verify game generation works

---

## Database Tables Status

You mentioned you've already created tables in the new project. Verify these exist:

- `profiles`
- `games`
- `game_sessions`
- `leaderboards`
- Any other custom tables

---

## Storage Buckets

If you have storage buckets (for game assets, thumbnails, etc.), you'll need to:

1. Create the same buckets in the new project
2. Set the same policies
3. Optionally migrate existing files

---

## Notes

- All code changes have been made to use environment variables
- No more hardcoded URLs in the codebase
- The migration should be seamless once you restart the dev server
- Make sure to update your production environment variables if deployed

---

## Rollback Plan (if needed)

If something goes wrong, you can rollback by:

1. Reverting `.env` to old credentials
2. Reverting `supabase/config.toml` project_id
3. Restarting dev server

Old Project ID: `zyozjzfkmmtuxvjgryhk`
