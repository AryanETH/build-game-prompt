# 🚀 Deploy Imagine Function

## ⚠️ Current Status

The **Imagine Game Concept** button is not working because the `imagine-game` Edge Function hasn't been deployed yet.

---

## 📋 Quick Fix Options

### Option 1: Use Manual Description (Immediate)

**No deployment needed!** The app now works without the Imagine function:

1. **Enter your game idea** in the "Game Prompt" field
2. **Write a detailed description** in the "Description" field manually
3. **Click "Generate Game"** - it will work!

**Example:**
- Prompt: `space shooter`
- Description: `A top-down space shooter with neon graphics, parallax backgrounds, multiple enemy types, power-ups, and wave-based progression. Player controls a spaceship that can shoot lasers and dodge asteroids.`

---

### Option 2: Deploy the Function (Recommended)

Deploy the `imagine-game` function to enable AI-powered game design expansion.

#### Method A: Supabase Dashboard (Easiest)

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Edge Functions**
   - Click **Edge Functions** in sidebar
   - Click **Deploy new function** or **Create function**

3. **Upload the Function**
   - Name: `imagine-game`
   - Upload file: `supabase/functions/imagine-game/index.ts`
   - Or copy/paste the code from the file

4. **Deploy**
   - Click **Deploy**
   - Wait for deployment (10-30 seconds)

5. **Verify**
   - Function should show "Deployed" status
   - Test by clicking "Imagine" button in your app

#### Method B: Supabase CLI

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_ID

# Deploy the function
supabase functions deploy imagine-game

# Verify deployment
supabase functions list
```

---

## ✅ Verification

### Test the Imagine Button:

1. Go to Create page
2. Enter: `space shooter with power-ups`
3. Click **"✨ Imagine Game Concept"**
4. Should see: "AI is imagining your game..."
5. After 5-10 seconds: Description field fills with detailed game design
6. Click **"Generate Game"** to create the game

### If It Works:
- ✅ Description field auto-fills with detailed game design
- ✅ Toast shows: "Game concept imagined!"
- ✅ You can review and edit before generating

### If It Doesn't Work:
- ❌ Error: "Imagine function not deployed yet!"
- ❌ Solution: Deploy the function (see above)
- ✅ Fallback: Write description manually

---

## 🔧 Troubleshooting

### Error: "Failed to imagine game"

**Cause:** Function not deployed

**Solution:**
1. Deploy `imagine-game` function (see Option 2 above)
2. OR use manual description (see Option 1 above)

### Error: "GROQ_API_KEY is not configured"

**Cause:** API key not set in Supabase Secrets

**Solution:**
1. Go to Supabase Dashboard → Edge Functions → Secrets
2. Ensure `GROQ_API_KEY` is set
3. Value: `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`
4. Redeploy the function

### Error: "404 Not Found"

**Cause:** Function doesn't exist or wrong URL

**Solution:**
1. Check function is deployed in Supabase Dashboard
2. Verify function name is exactly `imagine-game`
3. Check project URL matches in code

---

## 📊 Function Details

### imagine-game Edge Function

**Purpose:** Expands short game ideas into detailed game design documents

**Input:**
```json
{
  "shortIdea": "space shooter with power-ups"
}
```

**Output:**
```json
{
  "gameDescription": "Detailed game design document...",
  "suggestedTitle": "Space Shooter",
  "success": true
}
```

**Model:** Groq Llama 3.3 70B  
**Temperature:** 0.9 (creative)  
**Max Tokens:** 4000  
**Time:** 5-10 seconds  

---

## 🎯 Summary

### Current Situation:
- ✅ Code is ready and pushed to GitHub
- ✅ Function file exists: `supabase/functions/imagine-game/index.ts`
- ❌ Function not deployed to Supabase yet
- ✅ Fallback mode works (manual description)

### What You Need to Do:

**Quick Fix (Now):**
- Write descriptions manually in the Description field

**Proper Fix (5 minutes):**
- Deploy `imagine-game` function via Supabase Dashboard
- Then Imagine button will work automatically

---

## 🚀 After Deployment

Once deployed, the workflow becomes:

1. **User enters:** "space shooter"
2. **Clicks:** "✨ Imagine Game Concept"
3. **AI generates:** Full game design (mechanics, art, audio, levels)
4. **User reviews:** Can edit the description
5. **Clicks:** "Generate Game"
6. **Result:** Professional quality game!

**Much better than:** User enters "space shooter" → AI guesses → Basic game

---

## 📞 Need Help?

- Check Supabase Dashboard for deployment status
- View Edge Function logs for errors
- Ensure GROQ_API_KEY is set in Secrets
- Test with simple prompts first

**The app works without the function, but it's much better with it!** 🎉
