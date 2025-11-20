# 🎮 Setup AI Game Generation

## Problem: Same Game Generated Every Time

If you're seeing the same generic "Arcade Runner" game regardless of your prompt, it means the AI game generation is falling back to a template because the `generate-game` Edge Function isn't working.

## Root Cause

The `generate-game` Edge Function requires **OPENROUTER_API_KEY** to generate unique games based on your prompts. Without this key, it falls back to a generic template.

## Solution: Add OPENROUTER_API_KEY

### Step 1: Get OpenRouter API Key

1. Go to https://openrouter.ai/
2. Sign up or log in
3. Go to **Keys** section
4. Click **Create Key**
5. Copy your API key (starts with `sk-or-v1-...`)

### Step 2: Add to Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/zyozjzfkmmtuxvjgryhk/settings/functions
2. Find **Edge Function Secrets** section
3. Click **Add Secret**
4. Add:
   - **Name:** `OPENROUTER_API_KEY`
   - **Value:** Your OpenRouter API key (paste it)
5. Click **Save**

### Step 3: Deploy generate-game Function

```bash
npx supabase functions deploy generate-game --project-ref zyozjzfkmmtuxvjgryhk --no-verify-jwt
```

### Step 4: Test

1. Restart your dev server
2. Go to Create page
3. Enter a unique game prompt (e.g., "A puzzle game where you match colored gems")
4. Click "Generate Game"
5. Check console - should see: `✅ Game code generated, length: ...`

## Expected Results

✅ **With OPENROUTER_API_KEY:**
- Each prompt generates a unique game
- Console shows: `✅ Game code generated, length: 15000+`
- Games match your specific prompts
- Different mechanics, visuals, and gameplay

❌ **Without OPENROUTER_API_KEY:**
- Always generates the same "Arcade Runner" template
- Console shows: `❌ OPENROUTER_API_KEY not configured`
- Toast shows: "AI game generation unavailable, using template"

## Current Environment Variables Needed

### For Thumbnail Generation:
- ✅ `RAPIDAPI_KEY` - Already set (thumbnails working)

### For Game Generation:
- ⏳ `OPENROUTER_API_KEY` - **NEEDS TO BE SET**

## Cost Information

**OpenRouter Pricing:**
- Pay-as-you-go model
- DeepSeek Chat model (used by default): ~$0.14 per 1M tokens
- Very affordable for game generation
- Add credits to your OpenRouter account

**Free Alternative:**
- The fallback template is free but generates the same game
- For unique AI-generated games, OpenRouter API key is required

## Verification

After setting up OPENROUTER_API_KEY:

1. **Check Console Logs:**
   ```
   🎮 Calling generate-game with prompt: ...
   ✅ Game code generated, length: 15234
   ```

2. **Check Generated Code:**
   - Should be different for each prompt
   - Should match your game description
   - Should have unique mechanics

3. **Check Supabase Logs:**
   - Go to: https://supabase.com/dashboard/project/zyozjzfkmmtuxvjgryhk/functions/generate-game
   - View logs to see generation process

## Troubleshooting

### Still getting template games?
1. Verify OPENROUTER_API_KEY is set in Supabase
2. Check Edge Function logs for errors
3. Ensure you have credits in OpenRouter account
4. Restart dev server

### "OPENROUTER_API_KEY is not configured" error?
- Add the key in Supabase Dashboard → Edge Functions → Secrets

### Function not deployed?
```bash
npx supabase functions deploy generate-game --project-ref zyozjzfkmmtuxvjgryhk --no-verify-jwt
```

## Summary

**Current Status:**
- ✅ Thumbnails: Working (RAPIDAPI_KEY set)
- ❌ Game Generation: Using template (OPENROUTER_API_KEY not set)

**To Fix:**
1. Get OpenRouter API key from https://openrouter.ai/
2. Add `OPENROUTER_API_KEY` to Supabase Edge Function Secrets
3. Deploy generate-game function
4. Test with different prompts

Once set up, each prompt will generate a completely unique game!
