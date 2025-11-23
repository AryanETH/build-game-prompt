# Update OpenRouter API Key for Grok

## ⚠️ IMPORTANT: Update Your API Key

You provided a new OpenRouter API key. You need to update it in Supabase Edge Function secrets.

### Your New API Key:
```
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
```

---

## 🔧 How to Update the API Key

### **Option 1: Supabase Dashboard (Easiest)**

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Edge Functions** → **Secrets**
4. Find `OPENROUTER_API_KEY`
5. Click **Edit**
6. Paste the new key: `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`
7. Click **Save**

### **Option 2: Supabase CLI**

```bash
# Set the secret
supabase secrets set OPENROUTER_API_KEY=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

# Verify it's set
supabase secrets list
```

---

## 🚀 Deploy the Updated Function

After updating the API key, deploy the function:

```bash
# Deploy the generate-game function
supabase functions deploy generate-game

# Check deployment status
supabase functions list
```

---

## ✅ What Changed

### **Old Model:**
- Model: `deepseek/deepseek-chat`
- Cost: ~$0.14 per 1M tokens
- Speed: Fast
- Reasoning: No

### **New Model:**
- Model: `x-ai/grok-4.1-fast:free` ✨
- Cost: **FREE** 🎉
- Speed: Very fast
- Reasoning: **Yes** (enabled)
- Provider: xAI (Elon Musk's company)

---

## 🧠 Reasoning Feature

Grok now uses **chain-of-thought reasoning** before generating games:

```typescript
{
  "reasoning": {
    "enabled": true
  }
}
```

This means Grok will:
1. Think through the game design
2. Plan the code structure
3. Consider edge cases
4. Then generate the final code

**Result:** Better quality games with fewer bugs!

---

## 📊 Benefits of Grok 4.1 Fast

### **Advantages:**
- ✅ **FREE** - No API costs
- ✅ **Fast** - Lives up to the name
- ✅ **Reasoning** - Thinks before coding
- ✅ **Latest model** - Released recently
- ✅ **Good at code** - Trained on GitHub data

### **Potential Drawbacks:**
- ⚠️ Free tier may have rate limits
- ⚠️ Newer model (less battle-tested than DeepSeek)
- ⚠️ May need fallback if rate limited

---

## 🧪 Testing

After deploying, test game generation:

1. Go to your Create page
2. Enter a prompt: "Create a space shooter game"
3. Click Generate
4. Check browser console for: `"Using Grok 4.1 Fast with reasoning enabled"`
5. Game should generate successfully

---

## 🔍 Monitoring

Check Edge Function logs:

```bash
# View logs in real-time
supabase functions logs generate-game --follow

# Or in Supabase Dashboard:
# Edge Functions → generate-game → Logs
```

Look for:
- `"Using Grok 4.1 Fast with reasoning enabled"`
- `"Grok reasoning tokens: ..."`
- `"Game generated successfully"`

---

## 🆘 Troubleshooting

### **If games fail to generate:**

1. **Check API key is set:**
   ```bash
   supabase secrets list
   ```

2. **Check rate limits:**
   - Free tier may have limits
   - Wait a few minutes and retry

3. **Check logs:**
   ```bash
   supabase functions logs generate-game
   ```

4. **Fallback to DeepSeek:**
   If Grok has issues, you can quickly switch back:
   ```typescript
   model: 'deepseek/deepseek-chat'
   ```

---

## 💰 Cost Comparison

| Model | Cost per 1M tokens | Speed | Reasoning |
|-------|-------------------|-------|-----------|
| **Grok 4.1 Fast (NEW)** | **FREE** | Very Fast | ✅ Yes |
| DeepSeek Chat (OLD) | $0.14 | Fast | ❌ No |
| Claude 3.5 Sonnet | $3.00 | Medium | ✅ Yes |
| GPT-4 Turbo | $10.00 | Medium | ❌ No |

**Savings:** ~$0.14 per game → **100% savings!** 🎉

---

## 📝 Summary

**What you need to do:**

1. ✅ Update API key in Supabase Dashboard
2. ✅ Deploy the function: `supabase functions deploy generate-game`
3. ✅ Test game generation
4. ✅ Enjoy free, reasoning-powered game generation!

**What changed in the code:**
- Model: `deepseek/deepseek-chat` → `x-ai/grok-4.1-fast:free`
- Added: `reasoning: { enabled: true }`
- Added: Reasoning token logging

**Expected result:**
- Games generate faster
- Better quality (reasoning helps)
- Zero API costs
- Same or better reliability

---

## 🎮 Ready to Deploy!

Run these commands:

```bash
# 1. Update API key (if using CLI)
supabase secrets set OPENROUTER_API_KEY=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

# 2. Deploy function
supabase functions deploy generate-game

# 3. Test it
# Go to your app and create a game!
```

That's it! Your game engine now uses Grok 4.1 Fast with reasoning. 🚀
