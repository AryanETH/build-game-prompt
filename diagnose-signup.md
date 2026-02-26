# Signup Diagnosis Guide

## Common Signup Issues

### 1. Email Confirmation Required

**Problem:** Supabase requires email confirmation by default

**Solution:** Disable email confirmation for testing

Go to: https://supabase.com/dashboard/project/tadxoqrxzzmrksdslthd/auth/providers

Under **Email Auth**:
- ✅ Enable Email provider
- ❌ Uncheck "Confirm email" (for testing)
- ✅ Check "Enable email confirmations" (for production later)

### 2. Check Auth Settings

Go to: https://supabase.com/dashboard/project/tadxoqrxzzmrksdslthd/auth/url-configuration

**Site URL:** Set to `http://localhost:5173` (for development)

**Redirect URLs:** Add:
- `http://localhost:5173/**`
- `http://localhost:5173/auth/callback`
- Your production URL when ready

### 3. Check Browser Console

Open DevTools (F12) and check for errors:

**Common errors:**
- `Invalid API key` - Check .env file
- `Email not confirmed` - Disable email confirmation
- `CORS error` - Check Site URL settings
- `Network error` - Check internet connection

### 4. Test Supabase Connection

Open browser console and run:
```javascript
// Check if Supabase is connected
console.log(import.meta.env.VITE_SUPABASE_URL)
console.log(import.meta.env.VITE_SUPABASE_ANON_KEY)
```

Should show:
- URL: `https://tadxoqrxzzmrksdslthd.supabase.co`
- Key: `eyJhbGci...` (long JWT token)

### 5. Manual Test

Try signing up directly via Supabase:

```javascript
// In browser console on your site
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'Test123456!',
  options: {
    data: {
      name: 'Test User',
      username: 'testuser'
    }
  }
})

console.log('Data:', data)
console.log('Error:', error)
```

### 6. Check Database Trigger

The profile should be created automatically. Check if this trigger exists:

Go to: https://supabase.com/dashboard/project/tadxoqrxzzmrksdslthd/database/functions

Look for: `handle_new_user` function

If missing, run this SQL:

```sql
-- Create function to handle new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, name, avatar_url, coins, xp)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    100, -- Starting coins
    0    -- Starting XP
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 7. Check Profiles Table

Go to: https://supabase.com/dashboard/project/tadxoqrxzzmrksdslthd/editor

Check if `profiles` table exists with these columns:
- id (uuid, primary key)
- username (text, unique)
- email (text)
- name (text)
- avatar_url (text)
- coins (integer, default 100)
- xp (integer, default 0)
- created_at (timestamp)

### 8. Test Steps

1. **Clear browser data:**
   - Open DevTools (F12)
   - Application tab → Storage → Clear site data
   - Hard refresh (Ctrl+Shift+R)

2. **Try signup:**
   - Go to http://localhost:5173/auth?mode=signup
   - Fill in all fields
   - Click Sign Up
   - Watch console for errors

3. **Check what happens:**
   - Does it show success message?
   - Does it redirect?
   - Any errors in console?
   - Check Network tab for failed requests

### 9. Quick Fix Commands

```bash
# Restart dev server
npm run dev

# Check if .env is loaded
# In browser console:
console.log(import.meta.env)

# Should show all VITE_ variables
```

### 10. Most Likely Issues

**Issue 1: Email Confirmation Enabled**
- Go to Auth settings
- Disable "Confirm email"
- Try signup again

**Issue 2: Wrong API Keys**
- Check .env file
- Make sure VITE_SUPABASE_ANON_KEY matches dashboard
- Restart dev server after changing .env

**Issue 3: Missing Trigger**
- Run the SQL above to create handle_new_user trigger
- Try signup again

**Issue 4: CORS/Site URL**
- Add `http://localhost:5173` to Site URL
- Add `http://localhost:5173/**` to Redirect URLs

---

## Quick Checklist

- [ ] Email confirmation disabled in Auth settings
- [ ] Site URL set to `http://localhost:5173`
- [ ] Redirect URLs include localhost
- [ ] .env file has correct keys
- [ ] Dev server restarted after .env changes
- [ ] Browser cache cleared
- [ ] Profiles table exists
- [ ] handle_new_user trigger exists
- [ ] No errors in browser console
- [ ] Network tab shows successful requests

---

## Still Not Working?

1. **Check the exact error message** in browser console
2. **Check Network tab** - look for failed requests
3. **Check Supabase logs** in dashboard
4. **Try a different email** - some emails might be blocked
5. **Try incognito mode** - rules out cache issues

**Share the error message and I'll help you fix it!**
