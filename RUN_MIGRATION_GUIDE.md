# How to Run the Database Migration

## The migration file is located at:
`supabase/migrations/20241206000001_add_matchmaking_system.sql`

## Option 1: Supabase Dashboard (Easiest)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Click on your project
3. Go to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the entire content from `supabase/migrations/20241206000001_add_matchmaking_system.sql`
6. Paste it into the SQL editor
7. Click **Run** button
8. You should see "Success. No rows returned"

## Option 2: Supabase CLI (If installed)

```bash
# Install Supabase CLI first (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## What the Migration Creates:

### Tables:
- ✅ `match_sessions` - Stores active multiplayer matches
- ✅ `match_queue` - Matchmaking queue for finding players
- ✅ `game_states` - Turn-based game state snapshots

### Functions:
- ✅ `match_players()` - Automatically matches 2 players in queue

### Security:
- ✅ Row Level Security (RLS) policies
- ✅ Realtime subscriptions enabled

## After Running Migration:

The multiplayer system will be fully functional:

1. **Purple Gamepad Button** appears in game player
2. Click it to join matchmaking queue
3. **"Looking for Player"** screen shows
4. When 2 players join, match starts automatically
5. **Turn-based gameplay** begins
6. Players take turns, opponent watches in real-time

## Testing:

1. Open game in 2 browser windows (or 2 devices)
2. Click the purple gamepad button in both
3. Both should see "Looking for Player" screen
4. After a moment, match should start
5. Player 1 goes first, Player 2 watches
6. Click "End Turn" to switch

## Troubleshooting:

### Migration fails:
- Check if tables already exist
- Verify you have admin access to database
- Try running each CREATE TABLE statement separately

### Players not matching:
- Check if `match_players()` function was created
- Verify realtime is enabled on tables
- Check browser console for errors

### Can't join queue:
- Verify user is logged in
- Check RLS policies are applied
- Look for errors in browser console

## Files Integrated:

✅ `src/hooks/useMatchmaking.ts` - Matchmaking logic
✅ `src/components/LookingForPlayer.tsx` - Waiting screen
✅ `src/components/TurnBasedGame.tsx` - Turn-based gameplay
✅ `src/components/GamePlayer.tsx` - Main integration

Everything is ready to go once the migration runs!
