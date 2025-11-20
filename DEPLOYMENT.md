# Edge Function Deployment Guide

## Generate Thumbnail Function

The `generate-thumbnail` Edge Function has been fixed and is ready for deployment.

### Prerequisites

1. **Supabase CLI** installed
   ```bash
   npm install -g supabase
   ```

2. **Supabase Project** linked
   ```bash
   supabase link --project-ref zyozjzfkmmtuxvjgryhk
   ```

### Environment Variables Required

#### In Supabase Dashboard (Settings > Edge Functions > Secrets):

1. **RAPIDAPI_KEY** - Your RapidAPI key for the Flux image generator
   - Get it from: https://rapidapi.com/
   - Subscribe to: AI Text to Image Generator Flux Free API
   - Example: `69e7e36a00msh58bd9ca52b46bf6p1dcc24jsnf0c0808b2bf2`

2. **SUPABASE_URL** - Your Supabase project URL
   - Value: `https://zyozjzfkmmtuxvjgryhk.supabase.co`
   - (Usually auto-set by Supabase)

3. **SUPABASE_SERVICE_ROLE_KEY** - Your service role key
   - Find in: Supabase Dashboard > Settings > API
   - (Usually auto-set by Supabase)

#### In Your .env File:

1. **VITE_SUPABASE_ANON_KEY** - Your Supabase anon/public key
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5b3pqemZrbW10dXh2amdyeWhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4ODg5MjUsImV4cCI6MjA3NjQ2NDkyNX0.ROynm9iOj8vvCZtZbuaxT0Jxll-aYU9Vrch7kvb_pPQ`
   - ✅ Already set in your .env file

### Storage Bucket Setup

Create a `thumbnails` bucket in Supabase Storage:

1. Go to Storage in Supabase Dashboard
2. Create new bucket named `thumbnails`
3. Set it to **Public** (so URLs are accessible)
4. Enable file uploads

### Deploy Command

```bash
supabase functions deploy generate-thumbnail --no-verify-jwt
```

### Test the Function

After deployment, test with:

```bash
curl -X POST https://zyozjzfkmmtuxvjgryhk.supabase.co/functions/v1/generate-thumbnail \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"description": "A space adventure with robots and lasers"}'
```

### What Was Fixed

1. **Environment Variables** - Changed from hardcoded values to proper `Deno.env.get()` calls
2. **Error Handling** - Improved error messages in the frontend
3. **TypeScript Errors** - Added proper type declarations for Deno

### Troubleshooting

If you see "Using placeholder thumbnail":

1. Check Edge Function logs in Supabase Dashboard
2. Verify all environment variables are set
3. Ensure `thumbnails` bucket exists and is public
4. Check RapidAPI key has credits/quota remaining
5. Verify the API endpoint is accessible

### Frontend Integration

The Create.tsx page now provides specific error messages:
- "RapidAPI key not configured" - Set RAPIDAPI_KEY in Supabase
- "Supabase credentials not configured" - Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
- "Thumbnails storage bucket not found" - Create the bucket
- "Authentication failed" - Check API keys are correct
- "Server error" - Check Edge Function logs for details
