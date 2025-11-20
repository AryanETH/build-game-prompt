# ⚡ Quick Fix: 402 Error

## The Problem

```
❌ generate-game error: Edge Function returned a non-2xx status code (402)
```

## What 402 Means

**402 = Payment Required**

Your OpenRouter account needs credits to generate games.

## Quick Fix (2 Steps)

### 1. Add Credits to OpenRouter

Go to: https://openrouter.ai/credits

- Add $5-$10 (enough for thousands of games)
- Cost per game: ~$0.003 (less than 1 cent!)

### 2. Test Again

- Wait 1-2 minutes for credits to process
- Try generating a game
- Should work now!

## Alternative: Use Free Model

If you don't want to add credits right now, edit the Edge Function to use a free model:

**File:** `supabase/functions/generate-game/index.ts`

**Change line ~38:**
```typescript
// From:
model: 'deepseek/deepseek-chat',

// To:
model: 'google/gemini-flash-1.5',
```

**Then redeploy:**
```bash
npx supabase functions deploy generate-game --project-ref zyozjzfkmmtuxvjgryhk --no-verify-jwt
```

**Note:** Free models have lower quality and rate limits.

## What I Fixed

Enhanced error handling to show specific messages:

- 💳 402 → "OpenRouter account needs credits"
- 🔑 401 → "API key is invalid"
- ⏱️ 429 → "Rate limit exceeded"

Now you'll know exactly what's wrong!

## Summary

**Option 1 (Recommended):** Add $10 credits → Generate unlimited unique games

**Option 2 (Free):** Use free model → Lower quality but no cost

---

See **ADD_OPENROUTER_CREDITS.md** for detailed instructions.
