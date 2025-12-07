# 🚀 Setup Instructions - Coin Purchase System

## Step-by-Step Guide

### Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New query"**

### Step 2: Copy and Modify the SQL

1. Open the file `QUICK_SETUP.sql`
2. Find this line (near the bottom):
   ```sql
   WHERE email = 'your-email@example.com'
   ```
3. Replace `'your-email@example.com'` with **YOUR actual email** (the one you use to login)
4. Copy **ALL** the SQL content

### Step 3: Run the SQL

1. Paste into Supabase SQL Editor
2. Click the **"Run"** button (or press Ctrl+Enter)
3. Wait for **"Success"** message

### Step 4: Verify Setup

Run these queries one by one to verify:

```sql
-- Check if coin_purchases table exists
SELECT * FROM public.coin_purchases LIMIT 1;
```
✅ Should return "Success" (even with 0 rows)

```sql
-- Check if you're an admin
SELECT username, is_admin, is_plus_member 
FROM public.profiles 
WHERE id = auth.uid();
```
✅ Should show `is_admin: true`

```sql
-- Check if storage bucket exists
SELECT * FROM storage.buckets WHERE id = 'payment-screenshots';
```
✅ Should return 1 row

### Step 5: Refresh Your App

1. Go back to your application
2. Press **F5** to refresh
3. Go to **Admin panel**
4. Click **"Coins"** tab
5. Should see "No coin purchases yet" ✅

## What If It Still Doesn't Work?

### Error: "is_admin does not exist"
- The script now adds this column automatically
- Make sure you ran the ENTIRE script

### Error: "permission denied"
- Make sure you're logged in to Supabase
- Check you have admin access to the project

### Can't see Coins tab in Admin
- Make sure you set yourself as admin (Step 2)
- Logout and login again to your app
- Check the verification query above

### Still having issues?
Run this to check your admin status:
```sql
SELECT 
  u.email,
  p.username,
  p.is_admin,
  p.is_plus_member
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'your-email@example.com';
```

If `is_admin` is `false`, run:
```sql
UPDATE public.profiles 
SET is_admin = true 
WHERE id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');
```

## Quick Reference

### Make someone else admin:
```sql
UPDATE public.profiles 
SET is_admin = true 
WHERE id = (SELECT id FROM auth.users WHERE email = 'their-email@example.com');
```

### Remove admin access:
```sql
UPDATE public.profiles 
SET is_admin = false 
WHERE id = (SELECT id FROM auth.users WHERE email = 'their-email@example.com');
```

### Check all admins:
```sql
SELECT u.email, p.username, p.is_admin
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
WHERE p.is_admin = true;
```

---

## ✅ Success Checklist

- [ ] Ran QUICK_SETUP.sql in Supabase SQL Editor
- [ ] Replaced email with my actual email
- [ ] Got "Success" message
- [ ] Verified I'm an admin
- [ ] Refreshed the app
- [ ] Can see Coins tab in Admin panel
- [ ] No errors when clicking Coins tab

**If all checked, you're done!** 🎉

---

**Need more help?** Check the error message and search for it in this document.
