# 🔑 Insert OpenRouter API Key - Step by Step

## Your API Key:
```
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
```

---

## 📋 Method 1: Supabase Dashboard (Easiest - Do This Now!)

### **Step-by-Step Instructions:**

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Login if needed

2. **Select Your Project**
   - Click on your project (the one for this app)

3. **Navigate to Edge Functions**
   - Look in the left sidebar
   - Click **"Edge Functions"**

4. **Go to Secrets Tab**
   - At the top, you'll see tabs: Functions, Secrets, Logs
   - Click **"Secrets"**

5. **Add/Update the API Key**
   
   **If OPENROUTER_API_KEY already exists:**
   - Find `OPENROUTER_API_KEY` in the list
   - Click the **Edit** button (pencil icon)
   - Replace the value with: `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`
   - Click **Save**
   
   **If OPENROUTER_API_KEY doesn't exist:**
   - Click **"New Secret"** button
   - Name: `OPENROUTER_API_KEY`
   - Value: `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`
   - Click **Save**

6. **Redeploy the Function**
   - Go back to **"Functions"** tab
   - Find `generate-game` function
   - Click the **"..."** menu (three dots)
   - Click **"Redeploy"**
   - Wait for deployment to complete (~30 seconds)

7. **Done!** ✅
   - Your function now uses the new API key
   - Grok 4.1 Fast is ready to generate games

---

## 📋 Method 2: Install Supabase CLI (Alternative)

If you want to use CLI in the future:

### **Install Supabase CLI:**

**Windows (PowerShell as Administrator):**
```powershell
# Option 1: Using Scoop
scoop install supabase

# Option 2: Using Chocolatey
choco install supabase

# Option 3: Download directly
# Go to: https://github.com/supabase/cli/releases
# Download supabase_windows_amd64.zip
# Extract and add to PATH
```

### **Set the API Key:**
```bash
# Login to Supabase
supabase login

# Link your project (get project ref from dashboard URL)
supabase link --project-ref YOUR_PROJECT_REF

# Set the secret
supabase secrets set OPENROUTER_API_KEY=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

# Deploy the function
supabase functions deploy generate-game
```

---

## 🧪 Test After Inserting Key

1. **Go to your app:**
   - https://oplusai.vercel.app/create

2. **Generate a game:**
   - Enter prompt: "Create a space shooter game"
   - Click **Generate**

3. **Check browser console (F12):**
   - Should see: `"Using Grok 4.1 Fast with reasoning enabled"`
   - Should see: `"Game generated successfully"`

4. **Verify it works:**
   - Game should generate in 5-15 seconds
   - Should be playable HTML5 game
   - No errors in console

---

## 🔍 Verify API Key is Set

### **In Supabase Dashboard:**
1. Go to Edge Functions → Secrets
2. Look for `OPENROUTER_API_KEY`
3. Should show: `sk-or-v1-***` (masked for security)
4. If you see it, it's set correctly! ✅

### **Test with a Game Generation:**
1. Create a game
2. Check Edge Function logs:
   - Edge Functions → generate-game → Logs
   - Should see: "Using Grok 4.1 Fast with reasoning enabled"
   - Should NOT see: "OPENROUTER_API_KEY is not configured"

---

## ⚠️ Important Notes

### **Security:**
- ✅ Never commit API keys to GitHub
- ✅ Always use Supabase Secrets (environment variables)
- ✅ The key is encrypted in Supabase
- ✅ Only Edge Functions can access it

### **This Key is for:**
- OpenRouter API (https://openrouter.ai)
- Model: Grok 4.1 Fast (FREE tier)
- Used for: Game code generation

### **If Key Doesn't Work:**
1. Check it's copied correctly (no extra spaces)
2. Verify on OpenRouter dashboard: https://openrouter.ai/keys
3. Check if key has credits/quota
4. Try regenerating key on OpenRouter

---

## 📊 What Happens After Inserting Key

```
User clicks "Generate" 
    ↓
Frontend calls Edge Function
    ↓
Edge Function reads OPENROUTER_API_KEY from secrets
    ↓
Calls OpenRouter API with Grok 4.1 Fast
    ↓
Grok uses reasoning to design game
    ↓
Returns complete HTML5 game code
    ↓
Game displayed to user
```

**Cost:** $0.00 (FREE with Grok 4.1 Fast!)

---

## ✅ Quick Checklist

- [ ] Open Supabase Dashboard
- [ ] Go to Edge Functions → Secrets
- [ ] Add/Update OPENROUTER_API_KEY
- [ ] Paste: `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`
- [ ] Save the secret
- [ ] Redeploy generate-game function
- [ ] Test by generating a game
- [ ] Check console for success message
- [ ] Celebrate! 🎉

---

## 🆘 Need Help?

**Can't find Supabase Dashboard?**
- URL: https://supabase.com/dashboard
- Login with your account

**Can't find Edge Functions?**
- Look in left sidebar
- Should be under "Functions" or "Edge Functions"

**Can't find your project?**
- Check you're logged into correct account
- Project name should match your app

**Still stuck?**
- Check Supabase docs: https://supabase.com/docs/guides/functions/secrets
- Or DM me for help!

---

## 🎯 Summary

**What to do RIGHT NOW:**
1. Go to https://supabase.com/dashboard
2. Edge Functions → Secrets
3. Add OPENROUTER_API_KEY = `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`
4. Redeploy generate-game function
5. Test it!

**Time needed:** 2-3 minutes  
**Difficulty:** Easy  
**Result:** Free AI game generation with Grok! 🚀
