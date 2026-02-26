# 🚨 Fix Signup Issue - Step by Step

## Step 1: Disable Email Confirmation (MOST IMPORTANT)

1. Go to: https://supabase.com/dashboard/project/tadxoqrxzzmrksdslthd/auth/providers

2. Click on **Email** provider

3. **UNCHECK** "Confirm email" checkbox

4. Click **Save**

This is the #1 reason signup doesn't work - Supabase requires email confirmation by default!

---

## Step 2: Set Site URL

1. Go to: https://supabase.com/dashboard/project/tadxoqrxzzmrksdslthd/auth/url-configuration

2. Set **Site URL** to: `http://localhost:5173`

3. Add to **Redirect URLs**:
   ```
   http://localhost:5173/**
   http://localhost:5173/auth/callback
   ```

4. Click **Save**

---

## Step 3: Test with Test File

1. Open `test-signup.html` in your browser

2. Click "1. Test Connection" - Should show ✅

3. Click "2. Test Signup" - Should create account

4. Check the result - if it works here, the issue is in your React app

---

## Step 4: Check Browser Console

1. Open your app: http://localhost:5173/auth?mode=signup

2. Open DevTools (F12) → Console tab

3. Try to signup

4. Look for errors:
   - **"Email not confirmed"** → Go back to Step 1
   - **"Invalid API key"** → Check .env file
   - **"User already registered"** → Try different email
   - **Network error** → Check internet

---

## Step 5: Clear Everything

```bash
# Stop dev server (Ctrl+C)

# Clear browser data:
# - Open DevTools (F12)
# - Application tab → Storage → Clear site data
# - Close browser completely

# Restart dev server
npm run dev

# Try signup again in fresh browser window
```

---

## Step 6: Verify .env File

Check your `.env` file has:

```env
VITE_SUPABASE_URL="https://tadxoqrxzzmrksdslthd.supabase.co"
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZHhvcXJ4enptcmtzZHNsdGhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMDM1ODcsImV4cCI6MjA4Mzg3OTU4N30.8zOnfvmbd1uSV2i44ATmMv-p3FCeP4RnLRGfsCYf3d4
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_7_3Q5uXNZxIBbAvb2HgAsQ_M_YaglHa
```

**Important:** After changing .env, you MUST restart the dev server!

---

## Step 7: Check Profiles Table

1. Go to: https://supabase.com/dashboard/project/tadxoqrxzzmrksdslthd/editor

2. Click on `profiles` table

3. Verify it has these columns:
   - id
   - username
   - email
   - name
   - avatar_url
   - coins
   - xp
   - created_at

If table is missing, run:
```bash
supabase db push
```

---

## Step 8: Test Manually in Console

1. Go to: http://localhost:5173

2. Open Console (F12)

3. Run this:
```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'test@test.com',
  password: 'Test123456!',
  options: {
    data: {
      name: 'Test',
      username: 'testuser'
    }
  }
})

console.log('Result:', data, error)
```

4. Check the output:
   - **data.user exists** → Signup works!
   - **error exists** → That's your problem

---

## Common Errors & Solutions

### Error: "Email not confirmed"
**Solution:** Disable email confirmation (Step 1)

### Error: "Invalid API key"
**Solution:** Check .env file, restart dev server

### Error: "User already registered"
**Solution:** Use a different email or delete user from dashboard

### Error: "Password should be at least 6 characters"
**Solution:** Use longer password

### Error: "Unable to validate email address"
**Solution:** Use valid email format

### Error: "Network request failed"
**Solution:** Check internet connection, check Supabase status

---

## Quick Test Checklist

Run through this:

- [ ] Email confirmation is DISABLED in Supabase dashboard
- [ ] Site URL is set to `http://localhost:5173`
- [ ] .env file has correct keys
- [ ] Dev server restarted after .env changes
- [ ] Browser cache cleared
- [ ] test-signup.html works
- [ ] No errors in browser console
- [ ] Profiles table exists in database

---

## Still Not Working?

### Get the exact error:

1. Open browser console
2. Try signup
3. Copy the error message
4. Check Network tab for failed requests
5. Share the error with me

### Check Supabase Dashboard:

1. Go to: https://supabase.com/dashboard/project/tadxoqrxzzmrksdslthd/auth/users
2. See if user was created
3. Check if profile was created in profiles table

---

## 99% of the time it's one of these:

1. ❌ Email confirmation is enabled (DISABLE IT!)
2. ❌ Wrong API keys in .env
3. ❌ Dev server not restarted after .env change
4. ❌ Browser cache not cleared
5. ❌ Site URL not set correctly

**Fix these 5 things and signup will work!**
