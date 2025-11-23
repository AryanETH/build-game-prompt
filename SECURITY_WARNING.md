# ⚠️ SECURITY WARNING: API Key Hardcoded

## 🚨 CRITICAL SECURITY ISSUE

You have hardcoded your OpenRouter API key in the code:
```
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
```

### **Why This is Dangerous:**

1. ❌ **Public on GitHub** - Anyone can see and steal your key
2. ❌ **Unlimited Usage** - Others can use your key and you'll be charged
3. ❌ **Can't Rotate** - If compromised, you need to change code everywhere
4. ❌ **Security Best Practice Violation** - Never commit secrets to version control

---

## 🔒 RECOMMENDED: Remove Key from Code

### **Step 1: Remove the Hardcoded Key**

Edit `supabase/functions/generate-game/index.ts`:

```typescript
// REMOVE THIS LINE:
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY') || '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';

// REPLACE WITH:
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
```

### **Step 2: Set Key in Supabase Dashboard**

1. Go to https://supabase.com/dashboard
2. Select your project
3. Edge Functions → Secrets
4. Add: `OPENROUTER_API_KEY` = `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`
5. Save

### **Step 3: Redeploy**

```bash
supabase functions deploy generate-game
```

---

## 🛡️ Why Environment Variables are Better

### **With Hardcoded Key (Current - BAD):**
```typescript
const KEY = 'sk-or-v1-abc123...'; // ❌ Visible in GitHub
```

**Problems:**
- Anyone with GitHub access can steal it
- Key is in version history forever
- Can't change without code update
- Different keys for dev/prod is hard

### **With Environment Variables (Recommended - GOOD):**
```typescript
const KEY = Deno.env.get('OPENROUTER_API_KEY'); // ✅ Secure
```

**Benefits:**
- Key stored securely in Supabase
- Not in version control
- Easy to rotate
- Different keys per environment
- Industry standard

---

## 🔄 How to Fix This NOW

### **Option 1: Quick Fix (Keep Hardcoded for Now)**

If you need it working immediately:
1. ✅ Code already updated with hardcoded key
2. ✅ Will work immediately after deployment
3. ⚠️ But plan to move to environment variables soon

### **Option 2: Proper Fix (Recommended)**

1. **Remove hardcoded key from code:**
   ```typescript
   const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
   ```

2. **Add to Supabase Secrets:**
   - Dashboard → Edge Functions → Secrets
   - Name: `OPENROUTER_API_KEY`
   - Value: `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`

3. **Deploy:**
   ```bash
   supabase functions deploy generate-game
   ```

---

## 📊 Security Comparison

| Method | Security | Ease | Best Practice |
|--------|----------|------|---------------|
| **Hardcoded in Code** | ❌ Very Low | ✅ Easy | ❌ No |
| **Environment Variables** | ✅ High | ✅ Easy | ✅ Yes |
| **.env file (gitignored)** | ⚠️ Medium | ✅ Easy | ⚠️ OK for local |
| **Secrets Manager** | ✅ Very High | ⚠️ Complex | ✅ Yes |

---

## 🚨 What Could Go Wrong

### **Scenario 1: Key Theft**
```
Attacker finds key on GitHub
    ↓
Uses your key for their projects
    ↓
You get charged for their usage
    ↓
Your OpenRouter account gets banned
```

### **Scenario 2: Rate Limits**
```
Multiple people use your key
    ↓
Hit rate limits quickly
    ↓
Your app stops working
    ↓
Users can't generate games
```

### **Scenario 3: Quota Exhaustion**
```
Someone uses your key heavily
    ↓
Exhausts your free quota
    ↓
You start getting charged
    ↓
Unexpected bills
```

---

## ✅ Action Plan

### **Immediate (Do Now):**
- [x] Key hardcoded (working but insecure)
- [ ] Deploy to test it works
- [ ] Monitor OpenRouter usage dashboard

### **Short Term (This Week):**
- [ ] Move key to Supabase Secrets
- [ ] Remove hardcoded key from code
- [ ] Redeploy with environment variable
- [ ] Test everything still works

### **Long Term (Best Practice):**
- [ ] Add rate limiting to your Edge Function
- [ ] Monitor API usage
- [ ] Set up alerts for unusual activity
- [ ] Rotate keys periodically

---

## 🔍 How to Check if Key is Compromised

1. **OpenRouter Dashboard:**
   - Go to https://openrouter.ai/activity
   - Check for unusual usage patterns
   - Look for requests you didn't make

2. **Supabase Logs:**
   - Edge Functions → generate-game → Logs
   - Check request frequency
   - Look for suspicious IPs

3. **GitHub:**
   - Check who has access to your repo
   - Review commit history
   - Check if repo is public or private

---

## 🆘 If Key is Compromised

1. **Immediately:**
   - Go to https://openrouter.ai/keys
   - Delete the compromised key
   - Generate a new key

2. **Update:**
   - Add new key to Supabase Secrets
   - Redeploy Edge Function
   - Test everything works

3. **Prevent:**
   - Remove key from code
   - Use environment variables only
   - Add `.env` to `.gitignore`

---

## 📝 Summary

**Current Status:**
- ✅ Key is hardcoded (will work)
- ⚠️ Security risk (anyone can steal it)
- 🎯 Need to move to environment variables

**What You Should Do:**
1. Test that it works now
2. Plan to move to Supabase Secrets
3. Remove hardcoded key ASAP
4. Monitor usage regularly

**Remember:**
> "Secrets in code are not secrets at all."

---

## 🎯 Quick Commands

**Deploy with hardcoded key:**
```bash
git add supabase/functions/generate-game/index.ts
git commit -m "Add: Hardcoded API key (temporary)"
git push
# Then redeploy in Supabase Dashboard
```

**Remove hardcoded key later:**
```bash
# Edit file to remove hardcoded key
git add supabase/functions/generate-game/index.ts
git commit -m "Security: Remove hardcoded API key"
git push
# Add to Supabase Secrets instead
```

---

**Your key is now in the code and will work, but please move it to environment variables soon for security!** 🔒
