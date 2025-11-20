# 🔴 Fix CORS Error - Edge Function Not Deployed

## The Error You're Seeing

```
Access to fetch at 'https://zyozjzfkmmtuxvjgryhk.supabase.co/functions/v1/generate-thumbnail' 
from origin 'http://192.168.199.227:8082' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: It does not have HTTP ok status.
```

## What This Means

**The Edge Function is NOT deployed yet.** When you try to call it, Supabase returns an error because the function doesn't exist on the server.

## How to Fix (Step-by-Step)

### Step 1: Install Supabase CLI

If you don't have it installed:

```bash
npm install -g supabase
```

Or with Scoop (Windows):
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Step 2: Login to Supabase

```bash
supabase login
```

This will open a browser window. Login with your Supabase account.

### Step 3: Link Your Project

```bash
supabase link --project-ref zyozjzfkmmtuxvjgryhk
```

When prompted for the database password, enter your Supabase database password.

### Step 4: Deploy the Edge Function

```bash
supabase functions deploy generate-thumbnail --no-verify-jwt
```

You should see output like:
```
Deploying function generate-thumbnail...
Function generate-thumbnail deployed successfully!
```

### Step 5: Set Environment Variables

Go to your Supabase Dashboard:
1. Navigate to: **Settings → Edge Functions → Secrets**
2. Click **Add Secret**
3. Add:
   - **Name:** `RAPIDAPI_KEY`
   - **Value:** Your RapidAPI key (get it from https://rapidapi.com/)

### Step 6: Create Storage Bucket

Go to your Supabase Dashboard:
1. Navigate to: **Storage**
2. Click **New Bucket**
3. Name: `thumbnails`
4. **Make it PUBLIC** ✅ (Important!)
5. Click **Create**

### Step 7: Test the Deployment

Run the test script:
```bash
.\test-edge-function.ps1
```

Or test manually with curl:
```bash
curl -X POST https://zyozjzfkmmtuxvjgryhk.supabase.co/functions/v1/generate-thumbnail \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5b3pqemZrbW10dXh2amdyeWhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4ODg5MjUsImV4cCI6MjA3NjQ2NDkyNX0.ROynm9iOj8vvCZtZbuaxT0Jxll-aYU9Vrch7kvb_pPQ" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5b3pqemZrbW10dXh2amdyeWhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4ODg5MjUsImV4cCI6MjA3NjQ2NDkyNX0.ROynm9iOj8vvCZtZbuaxT0Jxll-aYU9Vrch7kvb_pPQ" \
  -d '{"description": "A space adventure with robots"}'
```

### Step 8: Restart Your Dev Server

After deployment, restart your development server:
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 9: Test in Your App

1. Go to the Create page
2. Enter a game prompt
3. Click "Generate Thumbnail"
4. Check the console - you should see `✅` messages instead of CORS errors

## Troubleshooting

### "supabase: command not found"
- Install Supabase CLI (see Step 1)
- Make sure it's in your PATH

### "Project not linked"
- Run: `supabase link --project-ref zyozjzfkmmtuxvjgryhk`

### "Authentication required"
- Run: `supabase login`

### Still getting CORS errors after deployment?
1. Check if function is deployed:
   - Go to Supabase Dashboard → Edge Functions
   - You should see `generate-thumbnail` in the list
2. Check function logs:
   - Click on the function
   - View logs to see if there are errors
3. Verify CORS headers in the function code (already fixed in your code)

### Function deployed but returns 500 error?
- Check if `RAPIDAPI_KEY` is set in Edge Function Secrets
- Check if `thumbnails` bucket exists and is public
- View function logs in Supabase Dashboard

## Quick Verification Checklist

After deployment, verify:

- [ ] Function appears in Supabase Dashboard → Edge Functions
- [ ] `RAPIDAPI_KEY` is set in Edge Function Secrets
- [ ] `thumbnails` bucket exists and is PUBLIC
- [ ] Test script (`.\test-edge-function.ps1`) passes
- [ ] No CORS errors in browser console
- [ ] Thumbnails generate successfully in your app

## Alternative: Deploy via Supabase Dashboard

If CLI doesn't work, you can deploy via the dashboard:

1. Go to Supabase Dashboard → Edge Functions
2. Click **New Function**
3. Name: `generate-thumbnail`
4. Copy-paste the code from `supabase/functions/generate-thumbnail/index.ts`
5. Click **Deploy**

Note: This method requires manual updates each time you change the code.

---

**Once deployed, the CORS error will disappear and thumbnails will generate successfully!**
