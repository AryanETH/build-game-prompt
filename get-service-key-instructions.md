# Get Your Service Role Keys

## For NEW Project (tadxoqrxzzmrksdslthd)

1. Go to: https://supabase.com/dashboard/project/tadxoqrxzzmrksdslthd/settings/api
2. Scroll down to "Project API keys"
3. Copy the **service_role** key (the long one, NOT anon)
4. In `migrate-data.mjs`, replace line 8:
   ```javascript
   const NEW_SERVICE_KEY = 'PASTE_THE_KEY_HERE';
   ```

## Then Run Migration

```bash
node migrate-data.mjs
```

This will migrate:
- ✅ 25 profiles (with usernames)
- ✅ 27 games
- ✅ 39 follows
- ✅ 78 notifications

Note: The old project doesn't have `likes` or `comments` tables, so those will be skipped.
