# 🚀 Deployment Checklist - Generate Thumbnail Function

Follow these steps in order to get AI-generated thumbnails working:

## ✅ Step 1: Verify Local Environment

- [x] `.env` file has `VITE_SUPABASE_ANON_KEY` set
- [x] Edge Function code uses `Deno.env.get("RAPIDAPI_KEY")` (not hardcoded)
- [x] Edge Function code uses `Deno.env.get("SUPABASE_URL")` (not hardcoded)
- [x] Edge Function code uses `Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")` (not hardcoded)

## ✅ Step 2: Get RapidAPI Key

1. Go to https://rapidapi.com/
2. Sign up or log in
3. Subscribe to: **AI Text to Image Generator Flux Free API**
4. Copy your API key (looks like: `69e7e36a00msh...`)

## ✅ Step 3: Deploy Edge Function

```bash
# Make sure Supabase CLI is installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref zyozjzfkmmtuxvjgryhk

# Deploy the function
supabase functions deploy generate-thumbnail --no-verify-jwt
```

## ✅ Step 4: Set Environment Variables in Supabase

Go to: **Supabase Dashboard → Settings → Edge Functions → Secrets**

Add this secret:
- **Name:** `RAPIDAPI_KEY`
- **Value:** Your RapidAPI key from Step 2

(SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-set by Supabase)

## ✅ Step 5: Create Storage Bucket

Go to: **Supabase Dashboard → Storage**

1. Click **New Bucket**
2. Name: `thumbnails`
3. **Make it Public** ✅ (Important!)
4. Click Create

## ✅ Step 6: Restart Your Dev Server

```bash
# Stop your current dev server (Ctrl+C)
# Then restart it to load the new .env variables
npm run dev
```

## ✅ Step 7: Test

1. Go to the Create page in your app
2. Enter a game prompt (e.g., "A space adventure with robots")
3. Click **Generate Thumbnail**
4. Watch the console for detailed logs

### Expected Results:

✅ **Success:**
- Console shows: `✅ Thumbnail URL received: https://...`
- Toast shows: "Thumbnail generated successfully!"
- You see an AI-generated image (not a placeholder)

❌ **If you see errors:**

| Error Message | Solution |
|--------------|----------|
| "RapidAPI key not configured" | Add RAPIDAPI_KEY to Supabase Edge Function Secrets |
| "Authentication failed - ANON KEY issue" | Check VITE_SUPABASE_ANON_KEY in .env |
| "Thumbnails storage bucket not found" | Create 'thumbnails' bucket in Supabase Storage |
| "Permission denied" | Make sure 'thumbnails' bucket is PUBLIC |
| "Image generation API failed" | Check RapidAPI quota/credits |

## 🔍 Debugging

If it's still using placeholders:

1. **Check Browser Console** - Look for `❌` error messages
2. **Check Supabase Logs** - Dashboard → Edge Functions → generate-thumbnail → Logs
3. **Verify Environment Variables:**
   ```bash
   # In your terminal
   echo $VITE_SUPABASE_ANON_KEY
   ```
4. **Test Edge Function Directly:**
   ```bash
   curl -X POST https://zyozjzfkmmtuxvjgryhk.supabase.co/functions/v1/generate-thumbnail \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -d '{"description": "A space adventure"}'
   ```

## 📝 Notes

- The anon key in .env is: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- Edge Function URL: `https://zyozjzfkmmtuxvjgryhk.supabase.co/functions/v1/generate-thumbnail`
- Storage bucket must be PUBLIC for URLs to work
- RapidAPI free tier has rate limits - check your quota

## ✨ Success Indicators

When everything is working correctly:

1. ✅ No placeholder thumbnails
2. ✅ Console shows detailed success logs
3. ✅ Toast shows "Thumbnail generated successfully!"
4. ✅ You see unique AI-generated images for each prompt
5. ✅ Images are stored in Supabase Storage under `thumbnails/public/`

---

**Need help?** Check the detailed error messages in the browser console - they now include step-by-step instructions for fixing each issue.
