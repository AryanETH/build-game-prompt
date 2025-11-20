# Fix Feed Layout - Separate Mobile & Desktop

The GameFeed.tsx file is currently in a broken state with mixed mobile/desktop code.

## Recommended Solution

Create two separate components:

### 1. GameFeedMobile.tsx
- Full-bleed TikTok style
- Action buttons inside card
- Full screen height cards
- Snap scrolling

### 2. GameFeedDesktop.tsx  
- Centered 400px cards with 9:16 aspect ratio
- Action buttons outside card on right
- Clean background
- Snap scrolling

### 3. Update GameFeed.tsx
```typescript
import { useMediaQuery } from "@/hooks/use-media-query";
import { GameFeedMobile } from "./GameFeedMobile";
import { GameFeedDesktop } from "./GameFeedDesktop";

export const GameFeed = () => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  return isMobile ? <GameFeedMobile /> : <GameFeedDesktop />;
};
```

## Current Issue

The file has:
- Mixed mobile/desktop code
- Mismatched closing tags
- Broken Card structure
- Inconsistent styling

## Quick Fix

Since the file is broken, the fastest solution is to:
1. Revert to a working version from git
2. Then implement the separate components approach

Would you like me to:
A) Try to fix the current broken file
B) Provide complete separate Mobile/Desktop component code
C) Revert and start fresh

Let me know which approach you prefer!
