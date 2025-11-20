# 💳 Add Credits to OpenRouter

## Error: 402 Payment Required

You're seeing this error because your OpenRouter account needs credits to generate games.

```
❌ generate-game error: Edge Function returned a non-2xx status code (402)
💳 OpenRouter account needs credits
```

## Solution: Add Credits to OpenRouter

### Step 1: Go to OpenRouter Credits Page

Visit: https://openrouter.ai/credits

### Step 2: Add Credits

1. Click **Add Credits** or **Buy Credits**
2. Choose an amount:
   - **$5** - Good for testing (~35 game generations)
   - **$10** - Recommended for regular use (~70 game generations)
   - **$20+** - For heavy usage

3. Complete payment

### Step 3: Verify Credits

1. Check your balance at https://openrouter.ai/credits
2. Should show your credit balance (e.g., "$10.00")

### Step 4: Test Game Generation

1. Go back to your app
2. Enter a game prompt
3. Click "Generate Game"
4. Should now work without 402 error

## Cost Breakdown

**DeepSeek Chat Model** (used by your app):
- Input: ~$0.14 per 1M tokens
- Output: ~$0.28 per 1M tokens

**Typical Game Generation:**
- Input: ~2,000 tokens (prompt + instructions)
- Output: ~10,000 tokens (game code)
- Cost per game: ~$0.003 (less than 1 cent!)

**With $10 credit:**
- Can generate ~3,000+ games
- Very affordable!

## Alternative: Use Free Models

If you want to test without adding credits, you can modify the Edge Function to use a free model:

### Edit: `supabase/functions/generate-game/index.ts`

Change line ~38 from:
```typescript
model: 'deepseek/deepseek-chat',
```

To a free model:
```typescript
model: 'google/gemini-flash-1.5',
// or
model: 'meta-llama/llama-3.2-3b-instruct:free',
```

Then redeploy:
```bash
npx supabase functions deploy generate-game --project-ref zyozjzfkmmtuxvjgryhk --no-verify-jwt
```

**Note:** Free models may have:
- Lower quality output
- Rate limits
- Slower response times

## Troubleshooting

### Still getting 402 after adding credits?
1. Wait 1-2 minutes for credits to process
2. Check balance at https://openrouter.ai/credits
3. Try generating again

### Credits not showing?
1. Check payment confirmation email
2. Refresh the credits page
3. Contact OpenRouter support if needed

### Want to check usage?
- Go to https://openrouter.ai/activity
- See all API calls and costs

## Current Status

After adding credits, you should see:

✅ **Success:**
```
🎮 Calling generate-game with prompt: ...
✅ Game code generated, length: 15234
```

❌ **Before (402 error):**
```
❌ generate-game error: Edge Function returned a non-2xx status code
💳 OpenRouter account needs credits
```

## Summary

1. **Add credits:** https://openrouter.ai/credits
2. **Recommended:** $10 (enough for thousands of games)
3. **Cost:** ~$0.003 per game generation
4. **Alternative:** Use free models (lower quality)

Once credits are added, game generation will work perfectly!
