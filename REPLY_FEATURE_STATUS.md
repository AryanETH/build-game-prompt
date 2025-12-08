# Reply Feature - Status & Next Steps

## ✅ Completed

### 1. Fixed Copy Function
- Added proper async/await handling
- Added try/catch for errors
- Works with text, GIF URLs, and image URLs
- Shows success/error toasts

### 2. Added Reply Button
- Added "Reply" option to dropdown menu
- Sets `replyingTo` state when clicked
- Shows success toast

### 3. Database Schema
- Created `ADD_REPLY_TO_MESSAGES.sql`
- Adds `reply_to_id` column to track replies
- Adds index for performance

### 4. TypeScript Interface
- Updated `Message` interface with:
  - `reply_to_id?: string | null`
  - `reply_to_content?: string | null`

### 5. State Management
- Added `replyingTo` state to track which message is being replied to

## 🔄 Next Steps (To Complete)

### 1. Run SQL Migration
```sql
-- In Supabase SQL Editor, run:
ADD_REPLY_TO_MESSAGES.sql
```

### 2. Add Reply UI Above Input
Add this before the input field:
```tsx
{replyingTo && (
  <div className="px-4 py-2 bg-muted/50 border-l-4 border-primary flex items-center justify-between">
    <div className="flex-1 min-w-0">
      <div className="text-xs text-muted-foreground">Replying to</div>
      <div className="text-sm truncate">{replyingTo.content}</div>
    </div>
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setReplyingTo(null)}
    >
      <X className="h-4 w-4" />
    </Button>
  </div>
)}
```

### 3. Update Send Message Function
Modify `handleSendMessage` to include reply:
```typescript
const { error } = await supabase
  .from('direct_messages')
  .insert({
    sender_id: userId,
    recipient_id: selectedUser.user_id,
    content: newMessage.trim(),
    is_one_time: isOneTime,
    reply_to_id: replyingTo?.id || null  // Add this
  });

// Clear reply after sending
setReplyingTo(null);
```

### 4. Show Reply in Message Bubble
Add this inside message bubble (before content):
```tsx
{msg.reply_to_id && (
  <div className="px-3 py-2 mb-2 bg-black/10 dark:bg-white/10 rounded-lg border-l-2 border-primary/50">
    <div className="text-xs opacity-70">Replied to</div>
    <div className="text-sm truncate">{msg.reply_to_content || 'Message'}</div>
  </div>
)}
```

### 5. Fetch Reply Content
Update `loadMessages` to fetch replied message content:
```typescript
// After fetching messages, get reply content
const replyIds = messagesData
  ?.filter(m => m.reply_to_id)
  .map(m => m.reply_to_id);

if (replyIds && replyIds.length > 0) {
  const { data: repliedMessages } = await supabase
    .from('direct_messages')
    .select('id, content')
    .in('id', replyIds);
  
  // Map reply content to messages
  const replyMap = new Map();
  repliedMessages?.forEach(r => replyMap.set(r.id, r.content));
  
  messagesWithSender = messagesWithSender?.map(msg => ({
    ...msg,
    reply_to_content: msg.reply_to_id ? replyMap.get(msg.reply_to_id) : null
  }));
}
```

### 6. Add Swipe Gestures (Mobile)
Install library:
```bash
npm install react-swipeable
```

Wrap message bubble:
```tsx
import { useSwipeable } from 'react-swipeable';

const swipeHandlers = useSwipeable({
  onSwipedLeft: () => isMine && setReplyingTo(msg),
  onSwipedRight: () => !isMine && setReplyingTo(msg),
  trackMouse: false,
  trackTouch: true,
});

<div {...swipeHandlers}>
  {/* Message bubble */}
</div>
```

## 📱 Swipe Behavior

### Your Messages (Right Side)
- **Swipe Left** → Reply

### Their Messages (Left Side)
- **Swipe Right** → Reply

### Visual Feedback
Add animation when swiping:
```tsx
const [swipeOffset, setSwipeOffset] = useState(0);

onSwiping: (eventData) => {
  const offset = isMine ? 
    Math.min(0, eventData.deltaX) : 
    Math.max(0, eventData.deltaX);
  setSwipeOffset(offset);
}

<div style={{ transform: `translateX(${swipeOffset}px)` }}>
```

## 🎨 Visual Design

### Reply Indicator
```
┌─────────────────────────┐
│ ┃ Replied to            │
│ ┃ Original message...   │
├─────────────────────────┤
│ Your reply text here    │
└─────────────────────────┘
```

### Reply UI Above Input
```
┌─────────────────────────┐
│ Replying to        [X]  │
│ Original message...     │
├─────────────────────────┤
│ [Type message...] [Send]│
└─────────────────────────┘
```

## 🔧 Quick Implementation

### Minimal Working Version
1. Run `ADD_REPLY_TO_MESSAGES.sql`
2. Add reply UI above input
3. Update send function to include `reply_to_id`
4. Show reply indicator in messages

### Full Version with Swipe
1. Do minimal version first
2. Install `react-swipeable`
3. Add swipe handlers
4. Add swipe animations
5. Test on mobile

## 📝 Summary

**What Works Now:**
- ✅ Copy function fixed
- ✅ Reply button in menu
- ✅ State management ready
- ✅ Database schema ready

**What Needs Completion:**
- [ ] Run SQL migration
- [ ] Add reply UI
- [ ] Update send function
- [ ] Show replies in messages
- [ ] Add swipe gestures (optional but recommended)

The foundation is complete! Just need to add the UI components and wire up the send function.
