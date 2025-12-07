# 🏆 Achievements System - Quick Reference

## 🚀 Setup (3 Steps)

### Step 1: Create Tables
```sql
-- Run in Supabase SQL Editor
-- File: ACHIEVEMENTS_SETUP.sql
```
Creates achievement tables and inserts 20+ achievements.

### Step 2: Backfill Existing Users
```sql
-- Run in Supabase SQL Editor
-- File: BACKFILL_ACHIEVEMENTS.sql
```
Awards achievements to users who already qualify.

### Step 3: Enable Auto-Awarding
```sql
-- Run in Supabase SQL Editor
-- File: AUTO_AWARD_ACHIEVEMENTS.sql
```
Creates triggers for automatic awarding.

---

## 📊 What Gets Tracked

| Metric | Achievement Type | Example |
|--------|-----------------|---------|
| Games Created | `games_created` | "First Steps" (1 game) |
| Likes Received | `likes_received` | "Popular" (10 likes) |
| Followers | `followers` | "Social Butterfly" (10 followers) |
| Remixes Created | `remixes_created` | "Remix Artist" (5 remixes) |
| Comments Made | `comments_made` | "Commentator" (50 comments) |

---

## 🎯 Achievement Tiers

| Rarity | Color | Difficulty | Example Rewards |
|--------|-------|------------|-----------------|
| Common | Gray | Easy | 10-30 coins |
| Rare | Blue | Medium | 50-100 coins |
| Epic | Purple | Hard | 100-200 coins |
| Legendary | Gold | Very Hard | 250-1000 coins |

---

## 🔍 Useful Queries

### Check User's Achievements
```sql
SELECT a.name, a.rarity, ua.unlocked_at
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
WHERE ua.user_id = 'USER_ID'
ORDER BY ua.unlocked_at DESC;
```

### Check User's Coins
```sql
SELECT username, coins 
FROM profiles 
WHERE id = 'USER_ID';
```

### Top Achievement Earners
```sql
SELECT p.username, COUNT(*) as achievements
FROM user_achievements ua
JOIN profiles p ON ua.user_id = p.id
GROUP BY p.username
ORDER BY achievements DESC
LIMIT 10;
```

### Most Popular Achievements
```sql
SELECT a.name, COUNT(*) as times_awarded
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
GROUP BY a.name
ORDER BY times_awarded DESC;
```

---

## 🎨 Frontend Integration

### View Achievements (Already Done!)
Visit Profile → Achievements tab

### Add Realtime Notifications (Optional)
```typescript
useEffect(() => {
  const channel = supabase
    .channel('user-achievements')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'user_achievements',
      filter: `user_id=eq.${userId}`,
    }, async (payload) => {
      const { data: achievement } = await supabase
        .from('achievements')
        .select('*')
        .eq('id', payload.new.achievement_id)
        .single();

      toast.success(`🏆 ${achievement.name}`, {
        description: `+${achievement.coins_reward} coins`
      });
    })
    .subscribe();

  return () => channel.unsubscribe();
}, [userId]);
```

---

## 🔧 Maintenance

### Add New Achievement
```sql
INSERT INTO achievements (name, description, rarity, requirement_type, requirement_value, coins_reward)
VALUES ('New Achievement', 'Description', 'rare', 'games_created', 15, 75);
```

### Manually Award Achievement
```sql
INSERT INTO user_achievements (user_id, achievement_id)
VALUES ('USER_ID', 'ACHIEVEMENT_ID');

-- Add coins
UPDATE profiles 
SET coins = coins + 75 
WHERE id = 'USER_ID';
```

### Test Backfill Function
```sql
SELECT * FROM backfill_user_achievements();
```

### Test Auto-Award Function
```sql
SELECT * FROM check_and_award_achievements('USER_ID', 'games_created');
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| No achievements showing | Run ACHIEVEMENTS_SETUP.sql |
| Existing users have no achievements | Run BACKFILL_ACHIEVEMENTS.sql |
| New achievements not auto-awarding | Run AUTO_AWARD_ACHIEVEMENTS.sql |
| Coins not added | Check profiles table has `coins` column |
| Triggers not firing | Check Supabase logs for errors |

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `ACHIEVEMENTS_SETUP.sql` | Creates tables and achievements |
| `BACKFILL_ACHIEVEMENTS.sql` | Awards achievements to existing users |
| `AUTO_AWARD_ACHIEVEMENTS.sql` | Enables automatic awarding |
| `ACHIEVEMENTS_COMPLETE_SETUP.md` | Complete setup guide |
| `ACHIEVEMENTS_ADDED.md` | Profile integration guide |
| `QUICK_START.md` | 5-minute quick start |

---

## ✅ Verification Checklist

- [ ] Tables created (`achievements`, `user_achievements`)
- [ ] 20+ achievements inserted
- [ ] Existing users awarded achievements
- [ ] Coins added to user accounts
- [ ] Triggers active and working
- [ ] Profile page shows achievements
- [ ] Test: Create game → Achievement unlocked
- [ ] Test: Get like → Achievement unlocked
- [ ] Test: Get follower → Achievement unlocked

---

## 🎉 Quick Stats

After setup, you'll have:
- ✅ 20+ achievements across 5 categories
- ✅ 4 rarity levels
- ✅ Automatic awarding via database triggers
- ✅ Coin rewards (10-1000 coins per achievement)
- ✅ Beautiful UI in Profile page
- ✅ Progress tracking
- ✅ Realtime notifications (optional)

**Total setup time: ~10 minutes** ⚡
