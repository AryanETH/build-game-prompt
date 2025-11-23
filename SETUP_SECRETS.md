# 🔐 Setup Supabase Secrets (Recommended)

## ✅ **Two Ways to Deploy:**

### **Option 1: Quick Deploy (Current - Works Immediately)**
- API key is hardcoded in the code
- ✅ Works right after deployment
- ⚠️ Less secure (visible in GitHub)
- Good for: Testing, getting it working fast

### **Option 2: Secure Deploy (Recommended - Best Practice)**
- API key stored in Supabase Secrets
- ✅ More secure (not in GitHub)
- ✅ Easy to rotate keys
- Good for: Production, long-term use

---

## 🚀 **OPTION 1: Quick Deploy (Do This First)**

### **Step 1: Deploy with Hardcoded Key**

The code already has your Groq API key hardcoded:
```typescript
const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY') || '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';
```

**Deploy now:**
1. Go to https://supabase.com/dashboard
2. Edge Functions → generate-game
3. Click "..." → "Redeploy"
4. Wait 60 seconds
5. **Test it - should work!** ✅

---

## 🔐 **OPTION 2: Secure with Secrets (Do This After Testing)**

Once you confirm it's working, move the key to Secrets:

### **Step 1: Add Secret in Supabase Dashboard**

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard
   - Select your project

2. **Navigate to Edge Functions:**
   - Click "Edge Functions" in sidebar
   - Click "Secrets" tab at the top

3. **Add New Secret:**
   - Click "+ New Secret" button
   - **Name:** `GROQ_API_KEY`
   - **Value:** `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`
   - Click "Save"

### **Step 2: Update Code to Remove Hardcoded Key**

After adding the secret, update the code:

```typescript
// BEFORE (hardcoded):
const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY') || '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';

// AFTER (secure):
const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
if (!GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY is not configured');
}
```

### **Step 3: Redeploy**

1. Commit the code change
2. Push to GitHub
3. Redeploy in Supabase Dashboard
4. Test again - should still work!

---

## 📊 **Comparison:**

| Method | Security | Speed | Ease | Best For |
|--------|----------|-------|------|----------|
| **Hardcoded** | ⚠️ Low | ⚡ Fast | ✅ Easy | Testing |
| **Secrets** | ✅ High | ⚡ Fast | ✅ Easy | Production |

---

## 🎯 **Recommended Approach:**

### **Phase 1: Get It Working (Now)**
1. ✅ Deploy with hardcoded key
2. ✅ Test game generation
3. ✅ Confirm it works

### **Phase 2: Make It Secure (Later)**
1. Add secret in Supabase
2. Remove hardcoded key from code
3. Redeploy
4. Test again

---

## 🔧 **Using Supabase CLI (Alternative)**

If you have Supabase CLI installed:

### **Add Secret via CLI:**
```bash
# Set the secret
supabase secrets set GROQ_API_KEY=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

# Verify it's set
supabase secrets list

# Deploy function
supabase functions deploy generate-game
```

---

## 📝 **Step-by-Step: Secrets Method**

### **1. Add Secret in Dashboard**

**Navigate:**
```
Supabase Dashboard
  → Your Project
    → Edge Functions
      → Secrets tab
        → + New Secret
```

**Fill in:**
```
Name: GROQ_API_KEY
Value: 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
```

**Click:** Save

### **2. Verify Secret is Set**

You should see:
```
GROQ_API_KEY = gsk_***************************W23 (masked)
```

### **3. Update Code (Optional)**

Remove the hardcoded fallback:

```typescript
// Remove this part:
|| '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'

// Keep only:
const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
```

### **4. Redeploy**

```
Edge Functions → generate-game → ... → Redeploy
```

---

## ✅ **Current Status:**

**Right Now:**
- ✅ Code has hardcoded key (works immediately)
- ⏳ Need to deploy to Supabase
- ⏳ Can add to Secrets later for security

**After Adding to Secrets:**
- ✅ Key stored securely
- ✅ Not visible in GitHub
- ✅ Easy to rotate
- ✅ Production-ready

---

## 🚨 **Important Notes:**

### **About Hardcoded Keys:**
- ⚠️ Visible in GitHub (anyone can see)
- ⚠️ Can be stolen and used by others
- ⚠️ Hard to rotate (need code change)
- ✅ But works immediately for testing

### **About Secrets:**
- ✅ Encrypted in Supabase
- ✅ Not visible in GitHub
- ✅ Easy to rotate (just update in dashboard)
- ✅ Industry best practice

---

## 🎯 **My Recommendation:**

### **Do This NOW (5 minutes):**

1. **Deploy with hardcoded key** (2 min)
   - Just redeploy in Supabase Dashboard
   - Test that games generate

2. **Add to Secrets** (2 min)
   - Go to Edge Functions → Secrets
   - Add GROQ_API_KEY
   - Save

3. **Remove hardcoded key** (1 min)
   - Update code to remove fallback
   - Commit and push
   - Redeploy

**Total time:** 5 minutes  
**Result:** Secure, production-ready setup

---

## 📋 **Quick Checklist:**

### **Immediate (Do Now):**
- [ ] Deploy function with hardcoded key
- [ ] Test game generation
- [ ] Confirm it works

### **Soon (Within 1 hour):**
- [ ] Add GROQ_API_KEY to Supabase Secrets
- [ ] Verify secret is set
- [ ] Test still works

### **Later (When you have time):**
- [ ] Remove hardcoded key from code
- [ ] Commit and push
- [ ] Redeploy
- [ ] Test again

---

## 💡 **Pro Tips:**

1. **Test First:** Deploy with hardcoded key to confirm everything works
2. **Then Secure:** Move to Secrets once you know it's working
3. **Keep Backup:** Save your API key somewhere safe
4. **Monitor Usage:** Check Groq dashboard for usage stats

---

## 🆘 **If Secrets Don't Work:**

### **Check 1: Secret Name**
- Must be exactly: `GROQ_API_KEY`
- Case-sensitive!

### **Check 2: Secret Value**
- Copy-paste the full key
- No extra spaces
- No quotes

### **Check 3: Redeploy**
- Must redeploy after adding secret
- Secrets only load on deployment

### **Check 4: Code**
- Must use `Deno.env.get('GROQ_API_KEY')`
- Exact name match

---

## 📝 **Summary:**

**Current Setup:**
- ✅ Hardcoded key (works immediately)
- ⏳ Need to deploy
- ⏳ Can add to Secrets later

**Recommended Flow:**
1. Deploy now with hardcoded key (test it works)
2. Add to Secrets (make it secure)
3. Remove hardcoded key (clean up)

**Time:** 5 minutes total  
**Result:** Secure, working game generation! 🎮

---

**Deploy first, secure later. Get it working, then make it perfect!** 🚀
