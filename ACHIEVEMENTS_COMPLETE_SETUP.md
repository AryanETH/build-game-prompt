# 🏆 Complete Achievements Setup Guide

## Overview

This guide will help you set up the achievements system with automatic awarding for both existing and new users.

---

## 📋 Setup Steps (Run in Order)

### Step 1: Create Achievement Tables (Required)

**File:** `ACHIEVEMENTS_SETUP.sql`

This creates:
- `achievements` table with 20+ pre-defined achievements
- `user_achievements` table to track unlocked achievements
- RLS policies for security
- Helper functions

**Run in Supabase SQL Editor:**
```sql
-- Copy and paste entire ACHIEVEMENTS_SETUP.sql file
-- Click "Run"
```

**Expected Result:**
- ✅ Tables created
- ✅ 20+ achievements inserted
- ✅ RLS policies enabled

---

### Step 2: Backfill Existing Users (One-Time)

**File:** `BACKFILL_ACHIEVEMENTS.sql`

This scans all existing users and awards achievements they're already eligible for based on their current stats.

**Run in Supabase SQL Editor:**
```sql
-- Copy and paste entire BACKFILL_ACHIEVEMENTS.sql file
-- Click "Run"
```

**What It Does:**
- Scans every user in your database
- Calculates their stats (games created, likes received, followers, etc.)
- Awards all achievements they qualify for
- Adds coins to their accounts
- Shows results: username, achievements awarded, coins awarded

**Expected Output:**
```
user_id                              | username    | achievements_awarded | coins_awarded
-------------------------------------|-------------|---------------------|---------------
abc123...                            | john_doe    | 5                   | 125
def456...                            | jane_smith  | 3                   | 60
...
```

**Verification Queries (included in file):**
```sql
-- Total achievements awarded
SELECT COUNT(*) FROM user_achievements;

-- Users with achievements
SELECT COUNT(DISTINCT user_id) FROM user_achievements;

-- Top achievement earners
SELECT p.username, COUNT(*) as achievements
FROM user_achievements ua
JOIN profiles p ON ua.user_id = p.id
GROUP BY p.username
ORDER BY achievements DESC
LIMIT 10;
```

---

### Step 3: Enable Automatic Awarding (Recommended)

**File:** `AUTO_AWARD_ACHIEVEMENTS.sql`

This creates database triggers that automatically check and award achievements when users perform actions.

**Run in Supabase SQL Editor:**
```sql
-- Copy and paste entire AUTO_AWARD_ACHIEVEMENTS.sql file
-- Click "Run"
```

**What It Does:**
Creates triggers that automatically award achievements when:
- ✅ User creates a game → Check `games_created` achievements
- ✅ User's game gets liked → Check `likes_received` achievements
- ✅ User gets a follower → Check `followers` achievements
- ✅ User makes a comment → Check `comments_made` achievements
- ✅ User creates a remix → Check `remixes_created` achievements

**Benefits:**
- No frontend code needed for basic achievements
- Instant awarding (no delay)
- Works even if user is offline
- Consistent across all platforms
- Reduces API calls from frontend

---

## 🎯 Achievement Categories

### 🎮 Game Creation
| Achievement | Requirement | Coins | Rarity |
|------------|-------------|-------|--------|
| First Steps | 1 game | 10 | Common |
| Game Creator | 5 games | 25 | Common |
| Prolific Creator | 10 games | 50 | Rare |
| Game Master | 25 games | 100 | Epic |
| Legend | 50 games | 250 | Legendary |

### 🕹️ Playing Games
| Achievement | Requirement | Coins | Rarity |
|------------|-------------|-------|--------|
| Player | 10 plays | 10 | Common |
| Gamer | 50 plays | 50 | Rare |
| Hardcore Gamer | 100 plays | 100 | Epic |
| Gaming Legend | 500 plays | 500 | Legendary |

### ❤️ Popularity (Likes Received)
| Achievement | Requirement | Coins | Rarity |
|------------|-------------|-------|--------|
| Popular | 10 likes | 15 | Common |
| Trending | 50 likes | 50 | Rare |
| Viral | 100 likes | 150 | Epic |
| Superstar | 500 likes | 500 | Legendary |

### 👥 Social (Followers)
| Achievement | Requirement | Coins | Rarity |
|------------|-------------|-------|--------|
| Social Butterfly | 10 followers | 20 | Common |
| Influencer | 50 followers | 75 | Rare |
| Celebrity | 100 followers | 200 | Epic |
| Icon | 500 followers | 1000 | Legendary |

### ✨ Engagement
| Achievement | Requirement | Coins | Rarity |
|------------|-------------|-------|--------|
| Remix Artist | 5 remixes | 25 | Common |
| Remix Master | 20 remixes | 100 | Rare |
| Commentator | 50 comments | 30 | Common |
| Community Leader | 200 comments | 100 | Rare |

---

## 🔍 How It Works

### Automatic Awarding Flow

1. **User performs action** (e.g., creates a game)
2. **Database trigger fires** automatically
3. **System calculates user's current stats**
4. **Checks all relevant achievements**
5. **Awards any newly qualified achievements**
6. **Adds coins to user account**
7. **Frontend detects new achievement** (via realtime subscription)
8. **Shows toast notification** to user

### Example: Creating Your 5th Game

```
User creates game #5
    ↓
Trigger fires: trigger_check_game_achievements()
    ↓
Function runs: check_and_award_achievements(user_id, 'games_created')
    ↓
Calculates: User has 5 games
    ↓
Checks achievements:
  - First Steps (1 game) → Already awarded ✓
  - Game Creator (5 games) → NEW! Award it ✓
  - Prolific Creator (10 games) → Not yet ✗
    ↓
Awards "Game Creator" achievement
    ↓
Adds 25 coins to user account
    ↓
Frontend shows: "🏆 Achievement Unlocked: Game Creator (+25 coins)"
```

---

## 🧪 Testing

### Test Backfill (After Step 2)

```sql
-- Check if your achievements were awarded
SELECT 
  a.name,
  a.rarity,
  ua.unlocked_at
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
WHERE ua.user_id = 'YOUR_USER_ID'
ORDER BY ua.unlocked_at DESC;

-- Check your coin balance
SELECT username, coins 
FROM profiles 
WHERE id = 'YOUR_USER_ID';
```

### Test Automatic Awarding (After Step 3)

1. **Create a game** in your app
2. **Check if achievement was awarded:**
```sql
SELECT 
  a.name,
  ua.unlocked_at
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
WHERE ua.user_id = 'YOUR_USER_ID'
AND ua.unlocked_at > NOW() - INTERVAL '1 minute';
```

3. **Check if coins were added:**
```sql
SELECT coins FROM profiles WHERE id = 'YOUR_USER_ID';
```

---

## 🎨 Frontend Integration

### Option 1: Automatic (Recommended)

With the triggers in place, achievements are awarded automatically. You just need to:

1. **Show achievements in Profile** (already done!)
2. **Add realtime listener** for new achievements:

```typescript
// In your Profile or App component
useEffect(() => {
  const channel = supabase
    .channel('user-achievements')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'user_achievements',
        filter: `user_id=eq.${userId}`,
      },
      async (payload) => {
        // Fetch achievement details
        const { data: achievement } = await supabase
          .from('achievements')
          .select('*')
          .eq('id', payload.new.achievement_id)
          .single();

        if (achievement) {
          // Show toast notification
          toast.success(`🏆 Achievement Unlocked: ${achievement.name}`, {
            description: `+${achievement.coins_reward} coins`,
            duration: 5000,
          });
        }
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}, [userId]);
```

### Option 2: Manual Checks (Optional)

You can also manually check achievements from the frontend:

```typescript
import { useAchievements } from '@/hooks/useAchievements';

const { checkAchievement } = useAchievements();

// After creating a game
checkAchievement({ type: 'games_created', value: totalGames });
```

---

## 📊 Analytics Queries

### Most Popular Achievements
```sql
SELECT 
  a.name,
  COUNT(*) as times_awarded,
  a.rarity
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
GROUP BY a.id, a.name, a.rarity
ORDER BY times_awarded DESC;
```

### Achievement Completion Rate
```sql
SELECT 
  a.name,
  COUNT(DISTINCT ua.user_id) as users_unlocked,
  (SELECT COUNT(*) FROM profiles) as total_users,
  ROUND(COUNT(DISTINCT ua.user_id)::NUMERIC / (SELECT COUNT(*) FROM profiles) * 100, 2) as completion_rate
FROM achievements a
LEFT JOIN user_achievements ua ON a.id = ua.achievement_id
GROUP BY a.id, a.name
ORDER BY completion_rate DESC;
```

### User Engagement Score
```sql
SELECT 
  p.username,
  COUNT(ua.achievement_id) as achievements_count,
  SUM(a.coins_reward) as total_coins_earned,
  ROUND(AVG(
    CASE a.rarity
      WHEN 'common' THEN 1
      WHEN 'rare' THEN 2
      WHEN 'epic' THEN 3
      WHEN 'legendary' THEN 4
    END
  ), 2) as avg_rarity_score
FROM profiles p
LEFT JOIN user_achievements ua ON p.id = ua.user_id
LEFT JOIN achievements a ON ua.achievement_id = a.id
GROUP BY p.id, p.username
ORDER BY achievements_count DESC, total_coins_earned DESC
LIMIT 20;
```

---

## 🔧 Maintenance

### Add New Achievement
```sql
INSERT INTO achievements (name, description, rarity, requirement_type, requirement_value, coins_reward)
VALUES (
  'Speed Demon',
  'Create 10 games in one day',
  'epic',
  'games_created_daily',
  10,
  150
);
```

### Modify Achievement Rewards
```sql
UPDATE achievements
SET coins_reward = 50
WHERE name = 'Game Creator';
```

### Reset User Achievements (Testing)
```sql
-- Delete all achievements for a user
DELETE FROM user_achievements WHERE user_id = 'USER_ID';

-- Subtract coins (optional)
UPDATE profiles 
SET coins = 0 
WHERE id = 'USER_ID';
```

---

## 🐛 Troubleshooting

### Achievements not awarded after backfill?
- Check if ACHIEVEMENTS_SETUP.sql ran successfully
- Verify achievements exist: `SELECT COUNT(*) FROM achievements;`
- Check for errors in Supabase logs

### Automatic awarding not working?
- Verify triggers are active: Check verification query in AUTO_AWARD_ACHIEVEMENTS.sql
- Check Supabase logs for trigger errors
- Test manually: `SELECT * FROM check_and_award_achievements('USER_ID', 'games_created');`

### Coins not added?
- Check profiles table has `coins` column
- Verify user exists: `SELECT * FROM profiles WHERE id = 'USER_ID';`
- Check if coins column allows NULL: `UPDATE profiles SET coins = COALESCE(coins, 0);`

---

## ✅ Checklist

- [ ] Run ACHIEVEMENTS_SETUP.sql
- [ ] Verify 20+ achievements created
- [ ] Run BACKFILL_ACHIEVEMENTS.sql
- [ ] Check results - users got achievements
- [ ] Verify coins were added
- [ ] Run AUTO_AWARD_ACHIEVEMENTS.sql
- [ ] Verify triggers are active
- [ ] Test by creating a game
- [ ] Add realtime listener (optional)
- [ ] Visit Profile → Achievements tab
- [ ] Celebrate! 🎉

---

## 🎉 Summary

After completing these steps:

✅ **Existing users** have been awarded all achievements they qualify for  
✅ **New achievements** are automatically awarded when earned  
✅ **Coins** are automatically added to accounts  
✅ **No frontend code** required for basic functionality  
✅ **Realtime notifications** can be added for better UX  
✅ **Profile page** shows all achievements with progress  

**Your achievement system is now fully operational!** 🚀
