# Game Mention Debugging Guide

## Changes Made

### Enhanced Game Mention Lookup
- ✅ Added case-insensitive matching
- ✅ Added fallback search if exact match fails
- ✅ Added console logging for debugging
- ✅ Multiple mapping strategies (exact + lowercase)

## How to Test

### 1. Open Browser Console
Press `F12` or right-click → Inspect → Console tab

### 2. Type a Game Mention
In a comment, type: `+YourGameTitle`

### 3. Check Console Logs
You should see:
```
Game mentions found: [{id: "...", title: "..."}]
```

### 4. Click the Mention
You should see:
```
Game mention clicked: YourGameTitle ID: abc-123-def
```

### 5. If Not Working
Check for:
```
Game ID not found for: YourGameTitle
```

## Common Issues & Solutions

### Issue 1: Game Title Doesn't Match Exactly
**Problem:** You typed `+Space Shooter` but game is titled `+space shooter`

**Solution:** Now supports case-insensitive matching
- Tries exact match first
- Falls back to case-insensitive search
- Maps both versions

### Issue 2: Multi-word Game Title
**Problem:** `+Space Shooter Adventure` only captures `+Space`

**Solution:** Pattern now captures full title:
```regex
/\+([^\s]+(?:\s+[^\s]+)*?)(?=\s|$|\+|@|#)/g
```

Stops at:
- Space followed by another mention
- End of text
- Another `+`, `@`, or `#`

### Issue 3: Game Not in Database
**Problem:** Game doesn't exist

**Solution:** Check console for:
```
Game mentions found: []
```

Create the game first, then mention it.

### Issue 4: Navigation Not Working
**Problem:** Click doesn't navigate

**Check:**
1. Console shows game ID?
2. URL changes to `/feed?game={id}`?
3. GameFeed component opens game?

## Testing Checklist

### Basic Test
1. [ ] Create a game (e.g., "Test Game")
2. [ ] In a comment, type `+Test Game`
3. [ ] See purple clickable text
4. [ ] Open console (F12)
5. [ ] Click the mention
6. [ ] Check console logs
7. [ ] Game should open

### Case Sensitivity Test
1. [ ] Game titled "Space Shooter"
2. [ ] Type `+space shooter` (lowercase)
3. [ ] Should still work
4. [ ] Type `+SPACE SHOOTER` (uppercase)
5. [ ] Should still work

### Multi-word Test
1. [ ] Game titled "Super Space Adventure"
2. [ ] Type `+Super Space Adventure`
3. [ ] Entire title should be clickable
4. [ ] Should navigate correctly

### Mixed Mentions Test
1. [ ] Type `@user check out +Game Name`
2. [ ] Both should be clickable
3. [ ] Different colors (blue vs purple)
4. [ ] Both should navigate

## Console Commands for Testing

### Check if game exists:
```javascript
const { data } = await supabase
  .from('games')
  .select('id, title')
  .ilike('title', 'your game title');
console.log(data);
```

### Check game by exact title:
```javascript
const { data } = await supabase
  .from('games')
  .select('id, title')
  .eq('title', 'Your Game Title');
console.log(data);
```

## Expected Console Output

### When Typing Comment with Game Mention
```
Game mentions found: [
  {id: "abc-123", title: "Space Shooter"}
]
```

### When Clicking Game Mention
```
Game mention clicked: Space Shooter ID: abc-123
```

### When Game Not Found
```
Game mentions found: []
Game mention clicked: NonExistent Game ID: undefined
Game ID not found for: NonExistent Game
```

## Troubleshooting Steps

### Step 1: Verify Game Exists
1. Go to `/feed`
2. Find the game you want to mention
3. Note the exact title

### Step 2: Type Exact Title
1. In comment: `+ExactTitle`
2. Check console for "Game mentions found"
3. Should show the game

### Step 3: Click and Check
1. Click the purple mention
2. Check console for "Game mention clicked"
3. Should show game ID
4. URL should change to `/feed?game={id}`

### Step 4: If Still Not Working
1. Check browser console for errors
2. Check network tab for failed requests
3. Verify game table has the title
4. Try refreshing the page

## Files Modified

- `src/components/LinkifiedText.tsx` - Enhanced with debugging
- `src/components/CommentText.tsx` - Enhanced with debugging

## What to Look For

### Success Indicators
- ✅ Purple clickable text appears
- ✅ Console shows "Game mentions found"
- ✅ Console shows game ID when clicked
- ✅ URL changes to `/feed?game={id}`
- ✅ Game opens in player

### Failure Indicators
- ❌ Text not purple/clickable
- ❌ Console shows empty array
- ❌ Console shows "Game ID not found"
- ❌ Click does nothing
- ❌ URL doesn't change

## Next Steps

If still not working after these changes:
1. Share console logs
2. Share exact game title from database
3. Share exact mention text you're typing
4. Check if other mentions (@username) work
