# Set Supabase Secrets

Your Edge Functions need these API keys. Run these commands one by one:

## Required Secrets

### 1. GROQ API Key (for AI game generation)
```bash
supabase secrets set GROQ_API_KEY=your_groq_api_key_here
```
Get it from: https://console.groq.com/keys

### 2. RAPIDAPI Key (for thumbnail generation)
```bash
supabase secrets set RAPIDAPI_KEY=your_rapidapi_key_here
```
Get it from: https://rapidapi.com/

### 3. BREVO API Key (for OTP emails)
```bash
supabase secrets set BREVO_API_KEY=your_brevo_api_key_here
```
Get it from: https://app.brevo.com/settings/keys/api

### 4. OPENROUTER API Key (for interface analysis)
```bash
supabase secrets set OPENROUTER_API_KEY=your_openrouter_key_here
```
Get it from: https://openrouter.ai/keys

### 5. RESEND API Key (for coin credit emails - optional)
```bash
supabase secrets set RESEND_API_KEY=your_resend_key_here
```
Get it from: https://resend.com/api-keys

### 6. CLERK Public Key (already in .env, but set for functions)
```bash
supabase secrets set CLERK_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAohIBo2Co+L66+FL7v0L3
+otXywXxCjYHBamtG9mDKwYOZoLzV4DyfVRb/MmIWal4SpOVXaPekRG3x0JmFKht
+3LueC7fXJjPWEvXxQeQNLPCfqypH4foOGkeymIJhPjUk+i1ZGp6uhFcKWnnfhyE
l61S+8fmhjrL+Dr5aTSnT4VfgGzt/RPREr448IxbjWkX/1d65YrKnv1ZYGS2XFXP
9OqIrRtMiw4i3a0Ye4H0jNN4GLw2RkL9FNec1uHwzgSVBb2fJOGeLGVyOyHiBa+m
s9Kehww+eswiR/mCQ4RprePwfY2GPqJ4EssZeeMUbvxh2BePxhvq/5uNEOkq0vOk
dQIDAQAB
-----END PUBLIC KEY-----"
```

## Auto-provided by Supabase (no need to set):
- `SUPABASE_URL` - Automatically available
- `SUPABASE_SERVICE_ROLE_KEY` - Automatically available
- `SUPABASE_ANON_KEY` - Automatically available

## Check Current Secrets
```bash
supabase secrets list
```

## Notes
- You only need to set the secrets for the features you're using
- If you don't have a key, that feature won't work but others will
- The most important ones are GROQ_API_KEY and BREVO_API_KEY
