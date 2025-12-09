# Notifications Setup Guide 🔔

## Quick Setup (2 minutes)

### Step 1: Run SQL Setup
1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `SETUP_NOTIFICATIONS_COMPLETE.sql`
5. Click **Run**

You should see success messages like:
```
✅ Notifications system setup complete!
All notification types are now ready:
  - Game likes
  - Game comments
  - Comment likes
  - Comment replies
  - User mentions (@username)
  - Game mentions (+game_title)
  - New followers
```

### Step 2: Verify Setup
The SQL script will automatically verify:
- ✅ Notifications table exists
- ✅ RLS policies are configured
- ✅ Required columns exist in profiles and games tables
- ✅ Permissions are granted

### Step 3: Test Notifications
1. **Test Game Like:**
   - User A likes User B's game
   - User B should receive: "[User A] liked your game"

2. **Test Comment:**
   - User A comments on User B's game
   - User B should receive: "[User A] commented on your game"

3. **Test Comment Like:**
   - User A likes User B's comment
   - User B should receive: "[User A] liked your comment"

4. **Test User Mention:**
   - User A writes: "Hey @userB check this out!"
   - User B should receive: "[User A] mentioned you in a comment"

5. **Test Game Mention:**
   - User A writes: "This is like +SpaceShooter"
   - Creator of SpaceShooter should receive: "[User A] mentioned your game"

## What's Already Working

The following notifications were already implemented:
- ✅ Game likes
- ✅ Game comments
- ✅ Comment replies
- ✅ New followers

## What's New

These notifications are newly added:
- 🆕 Comment likes
- 🆕 User mentions (@username)
- 🆕 Game mentions (+game_title)

## Troubleshooting

### Notifications not appearing?
1. Check if SQL script ran successfully
2. Verify RLS policies: `SELECT * FROM pg_policies WHERE tablename = 'notifications';`
3. Check browser console for errors
4. Ensure users have profiles with usernames

### Mentions not working?
1. User mentions require exact username match
2. Game mentions use fuzzy search (partial match)
3. Check console logs for mention detection

### Self-notifications appearing?
This shouldn't happen - the code checks `userId !== creatorId` before sending notifications. If you see this, check the notification creation logic.

## Database Schema

### Notifications Table
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Payload Structure
```json
{
  "type": "like" | "comment" | "reply" | "mention" | "follow",
  "content": "liked your game",
  "read": false,
  "username": "john_doe",
  "avatar_url": "https://...",
  "game_id": "uuid",
  "game_title": "Space Shooter",
  "game_thumbnail": "https://...",
  "comment_id": "uuid"
}
```

## Support

If you encounter any issues:
1. Check the SQL script output for errors
2. Verify all tables exist: `notifications`, `profiles`, `games`, `game_comments`
3. Check RLS policies are enabled
4. Review browser console for JavaScript errors

## Next Steps

After setup is complete:
- [ ] Test all notification types
- [ ] Customize notification messages if needed
- [ ] Add email notifications (future enhancement)
- [ ] Add push notifications (future enhancement)
- [ ] Implement notification preferences (future enhancement)
