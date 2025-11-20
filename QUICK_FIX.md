# ⚡ Quick Fix - Stop Using Placeholder Thumbnails

## The Problem
Your app shows placeholder thumbnails instead of AI-generated ones.

## The Solution (3 Steps)

### 1️⃣ Get RapidAPI Key
- Go to https://rapidapi.com/
- Subscribe to: **AI Text to Image Generator Flux Free API**
- Copy your API key

### 2️⃣ Deploy & Configure
```bash
# Deploy the Edge Function
supabase functions deploy generate-thumbnail --no-verify-jwt

# Then go to Supabase Dashboard:
# Settings → Edge Functions → Secrets → Add Secret
# Name: RAPIDAPI_KEY
# Value: <paste your key>
```

### 3️⃣ Create Storage Bucket
- Go to Supabase Dashboard → Storage
- Create bucket named: `thumbnails`
- **Make it PUBLIC** ✅

## Test It
```bash
# Restart your dev server
npm run dev

# Then in your app:
# 1. Go to Create page
# 2. Enter a prompt
# 3. Click "Generate Thumbnail"
# 4. Check console for ✅ or ❌ messages
```

## Still Not Working?

Check the error message in the toast notification:

| Error | Fix |
|-------|-----|
| "RapidAPI key not configured" | Add RAPIDAPI_KEY to Supabase Secrets |
| "Authentication failed" | Restart dev server to load .env |
| "Thumbnails storage bucket not found" | Create 'thumbnails' bucket |
| "Permission denied" | Make bucket PUBLIC |

---

**See DEPLOYMENT_CHECKLIST.md for detailed step-by-step instructions.**
