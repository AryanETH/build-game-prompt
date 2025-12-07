# 🚀 Quick Start - 5 Minutes to New Features

## Step 1: Run Database Migrations (2 minutes)

Open your Supabase SQL Editor and run these two files:

### 1. Achievements System
Copy and paste the entire content of `ACHIEVEMENTS_SETUP.sql` and click "Run"

### 2. Reactions System
Copy and paste the entire content of `REACTIONS_SETUP.sql` and click "Run"

✅ Done! Your database now has achievements and reactions.

---

## Step 2: Test Achievements (1 minute)

Add this to your Profile page to see achievements:

```typescript
// In src/pages/Profile.tsx

// 1. Import at the top
import { AchievementsPanel } from '@/components/AchievementsPanel';

// 2. Add a new tab in your TabsList
<TabsTrigger value="achievements">
  🏆 Achievements
</TabsTrigger>

// 3. Add the content
<TabsContent value="achievements">
  <AchievementsPanel />
</TabsContent>
```

Now visit your profile and click the Achievements tab!

---

## Step 3: Test Reactions (1 minute)

Add reactions to your game feed:

```typescript
// In src/components/GameFeed.tsx

// 1. Import at the top
import { GameReactions } from '@/components/GameReactions';

// 2. Add to your game card (find where you have the like button)
<div className="flex items-center gap-3">
  <GameReactions gameId={game.id} />
  {/* Your existing like button */}
</div>
```

Now you'll see emoji reactions on games!

---

## Step 4: Auto-Check Achievements (1 minute)

Make achievements unlock automatically:

```typescript
// In src/pages/Create.tsx (or wherever you create games)

// 1. Import at the top
import { useAchievements } from '@/hooks/useAchievements';

// 2. Get the function
const { checkAchievement } = useAchievements();

// 3. After successfully creating a game, add:
const handlePublish = async () => {
  // ... your existing publish code ...
  
  // Check for achievements
  checkAchievement({ 
    type: 'games_created', 
    value: userGamesCount + 1 
  });
};
```

Do the same for:
- Playing games: `checkAchievement({ type: 'games_played', value: X })`
- Getting likes: `checkAchievement({ type: 'likes_received', value: X })`
- Getting followers: `checkAchievement({ type: 'followers', value: X })`

---

## That's It! 🎉

You now have:
- ✅ 20+ achievements with automatic unlocking
- ✅ Emoji reactions on games
- ✅ Type-safe code
- ✅ Global state management
- ✅ Better error handling

**Everything works alongside your existing code!**

---

## Optional: Use Global State

Replace local state with global state for better performance:

```typescript
// Before
const [userId, setUserId] = useState<string | null>(null);

// After
import { useUserStore } from '@/store/userStore';
const { userId, profile } = useUserStore();
```

---

## Need More Help?

- **Full guide**: See `IMPLEMENTATION_GUIDE.md`
- **Feature list**: See `FEATURES_IMPLEMENTED.md`
- **Issues**: Check the troubleshooting section in the implementation guide

**Happy coding!** 🚀
