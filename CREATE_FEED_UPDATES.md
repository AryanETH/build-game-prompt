# Create Game & Feed Updates

## Changes Made

### 1. Create Game Page (src/pages/Create.tsx)

#### Removed Features:
- ❌ **Image Prompt Section** - Removed entire UI for generating interface images
- ❌ **Multiplayer Type Selector** - Removed dropdown for co-op/versus/turn-based/etc.
- ❌ **Graphics Quality Selector** - Removed dropdown for low/medium/high/ultra/realistic

#### Enhanced Features:
- ✅ **Public/Private Toggle** - Now properly styled with icons and descriptions
  - **Public**: Game visible to everyone in the feed
  - **Private**: Game only visible to user's followers
  - Saves `is_public` field to database
  
- ✅ **Multiplayer Toggle** - Simplified to just on/off switch with better styling
  - Clean card-style UI with Users icon
  - Description text for clarity

#### Updated UI:
```
┌─────────────────────────────────────┐
│ Game Prompt                         │
│ [Text area for game idea]           │
├─────────────────────────────────────┤
│ 🌐 Public / 🔒 Private              │
│ [Toggle Switch]                     │
│ Visible to everyone / Only followers│
├─────────────────────────────────────┤
│ 👥 Multiplayer                      │
│ [Toggle Switch]                     │
│ Enable multiplayer features         │
├─────────────────────────────────────┤
│ Game Title                          │
│ Description                         │
│ [Imagine] [Generate] [Thumbnail]    │
└─────────────────────────────────────┘
```

### 2. Game Feed (src/components/GameFeed.tsx)

#### New Feature: Expandable Descriptions
- ✅ **More/Less Button** - Added to game descriptions
  - Shows "More" button if description is longer than 80 characters
  - Clicking "More" expands full description
  - Clicking "Less" collapses back to 2 lines
  - Button styled with white text and drop shadow for visibility

#### Updated Layout:
```
┌─────────────────────────────────────┐
│                                     │
│         [Game Cover Image]          │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ @username                    │  │
│  │ Game Title                   │  │
│  │ Description text here that   │  │
│  │ can be expanded...           │  │
│  │ [More]                       │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

## Database Changes Required

To support the Public/Private feature, ensure your `games` table has:

```sql
ALTER TABLE games ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
```

## Feed Query Update (Future)

To respect the privacy setting, update the feed query to:
- Show all public games to everyone
- Show private games only to followers of the creator

Example query logic:
```typescript
// If user is logged in
const { data } = await supabase
  .from('games')
  .select('*')
  .or(`is_public.eq.true,creator_id.in.(${followedUserIds})`)
  .order('created_at', { ascending: false });
```

## User Experience

### Creating a Game:
1. Enter game idea in prompt
2. Choose Public (everyone) or Private (followers only)
3. Toggle Multiplayer if needed
4. Click "Imagine" to get AI description
5. Click "Generate Game" to create
6. Generate thumbnail
7. Publish to feed

### Viewing Games in Feed:
1. Scroll through games
2. See profile, username, and game title
3. See first 2 lines of description
4. Click "More" to read full description
5. Click "Less" to collapse

## Benefits

### Simplified Creation:
- Removed confusing options (image prompt, graphics quality)
- Clear Public/Private choice
- Streamlined multiplayer toggle
- Faster game creation flow

### Better Feed Experience:
- Descriptions don't clutter the UI
- Users can expand only what interests them
- Maintains clean TikTok-style vertical layout
- More/Less button is easily accessible

## Testing

### Test Public/Private:
1. Create a game with Public ON → Should appear in everyone's feed
2. Create a game with Private ON → Should only appear to followers
3. Toggle between Public/Private → Verify database updates

### Test Description Expansion:
1. Create game with short description (<80 chars) → No More button
2. Create game with long description (>80 chars) → More button appears
3. Click More → Full description shows
4. Click Less → Description collapses to 2 lines
5. Test on mobile and desktop → Both work smoothly
