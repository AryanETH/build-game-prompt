# Hard Snap Scrolling Fix - Complete

## Issue Fixed
- **Problem**: Sometimes when opening the website, game scroll becomes static scroll instead of TikTok-like one-card-at-a-time behavior
- **Root Cause**: Scroll-snap was only enabled on mobile devices, and inconsistent height calculations were breaking the snap behavior

## Changes Applied

### 1. Enable Hard Snap Scrolling on Both Mobile and Desktop
- **Before**: `scrollSnapType: isMobile ? 'y mandatory' : 'none'`
- **After**: `scrollSnapType: 'y mandatory'` (always enabled)
- **Reason**: User wants strict one-card-at-a-time scrolling on BOTH mobile and desktop

### 2. Consistent Viewport Height for All Cards
- **Before**: Complex calc heights like `h-[calc(100vh-120px)]` and different heights for mobile/desktop
- **After**: `height: '100vh', minHeight: '100vh'` for all game cards
- **Reason**: Ensures each card takes exactly one full viewport height for perfect snap behavior

### 3. Force Scroll-Snap Recalculation
- **Enhanced**: Added `scrollBehavior: 'smooth'` to scroll container
- **Enhanced**: Removed mobile-only condition from scroll-snap recalculation
- **Reason**: Ensures snap behavior is consistently applied when content loads

### 4. Simplified Desktop Action Button Heights
- **Before**: `h-[calc(100vh_-_120px)] min-h-[calc(100dvh_-_120px)]`
- **After**: `h-full`
- **Reason**: Removes complex height calculations that could interfere with snap behavior

## Key Technical Changes

```typescript
// 1. Always enable snap scrolling (not just mobile)
container.style.scrollSnapType = 'y mandatory';
container.style.scrollBehavior = 'smooth';

// 2. Full viewport height for each card
style={{ 
  height: '100vh',
  minHeight: '100vh',
  scrollSnapAlign: 'start',
  scrollSnapStop: 'always'
}}

// 3. Consistent scroll container
className="h-full overflow-y-auto snap-y snap-mandatory no-scrollbar"
style={{ 
  scrollSnapType: 'y mandatory',
  scrollBehavior: 'smooth',
  WebkitOverflowScrolling: 'touch'
}}
```

## Expected Behavior
- ✅ **Mobile**: One card at a time with finger swipe
- ✅ **Desktop**: One card at a time with mouse wheel scroll
- ✅ **Desktop**: Arrow key navigation works
- ✅ **Desktop**: Up/Down navigation buttons work
- ✅ **Consistent**: No more static scrolling after refresh

## Testing
1. Open website on desktop
2. Use mouse wheel to scroll - should show exactly one card at a time
3. Use arrow keys - should navigate one card at a time
4. Use navigation buttons - should navigate smoothly
5. Refresh page multiple times - should maintain snap behavior
6. Test on mobile - should maintain TikTok-like swipe behavior

The scroll behavior is now "hard" - meaning every scroll action results in exactly one game card being displayed, creating a consistent TikTok-like experience across all devices.