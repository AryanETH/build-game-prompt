# 🔐 Secure API Key Setup Guide

## ⚠️ IMPORTANT: Never Commit API Keys to Git!

Your Groq API key was exposed in the repository, which is why it was revoked. Follow this guide to set it up securely.

---

## 🔑 Your New Groq API Key

```
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
```

**⚠️ DO NOT commit this key to Git! Store it in Supabase Secrets only.**

---

## 📋 Step-by-Step Setup

### Option 1: Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Edge Functions**
   - Click **Edge Functions** in the left sidebar
   - Click **Secrets** tab

3. **Add/Update the Secret**
   - If `GROQ_API_KEY` exists:
     - Click **Edit** (pencil icon)
     - Replace with: `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`
     - Click **Save**
   
   - If it doesn't exist:
     - Click **+ New Secret**
     - Name: `GROQ_API_KEY`
     - Value: `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`
     - Click **Save**

4. **Redeploy the Function**
   ```bash
   supabase functions deploy generate-game
   ```

---

### Option 2: Supabase CLI

```bash
# Set the secret
supabase secrets set GROQ_API_KEY=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

# Verify it's set
supabase secrets list

# Deploy the function
supabase functions deploy generate-game
```

---

## ✅ Verification

1. **Check Secrets List**
   ```bash
   supabase secrets list
   ```
   
   You should see:
   ```
   GROQ_API_KEY = gsk_***************************ogBM (masked)
   ```

2. **Test Game Generation**
   - Go to your app
   - Try creating a game
   - Check browser console for: "Using Groq Llama 3.3 70B (FREE, ultra-fast)"

---

## 🛡️ Security Best Practices

### ✅ DO:
- ✅ Store API keys in Supabase Edge Function Secrets
- ✅ Use environment variables (`Deno.env.get()`)
- ✅ Add `.env` to `.gitignore`
- ✅ Use different keys for development and production
- ✅ Rotate keys periodically
- ✅ Monitor API usage

### ❌ DON'T:
- ❌ Hardcode API keys in source code
- ❌ Commit API keys to Git
- ❌ Share API keys in documentation
- ❌ Store keys in frontend code
- ❌ Use the same key across multiple projects

---

## 📝 .gitignore Configuration

Make sure your `.gitignore` includes:

```gitignore
# Environment variables
.env
.env.local
.env.*.local

# API keys and secrets
**/secrets.json
**/*_secret*
**/*_key*

# Supabase
.supabase/
```

---

## 🔄 If Your Key Gets Exposed Again

1. **Immediately revoke the exposed key** at https://console.groq.com/keys
2. **Generate a new key**
3. **Update Supabase Secrets** (never commit to code)
4. **Redeploy the function**
5. **Review your Git history** to ensure no keys are committed

---

## 🧪 Testing

After setup, test with:

```bash
# Test the Edge Function
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/generate-game \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"prompt": "A simple space shooter game"}'
```

---

## 📞 Support

If you encounter issues:
- Check Supabase Edge Function logs
- Verify the secret is set: `supabase secrets list`
- Ensure the function is deployed: `supabase functions list`
- Contact Groq support: support@groq.com

---

## ✨ Summary

1. ✅ API key removed from source code
2. ✅ Store key in Supabase Secrets only
3. ✅ Deploy the updated function
4. ✅ Test game generation
5. ✅ Never commit keys to Git again!
