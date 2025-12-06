# Share Feature Enhanced - Windows Native Share Dialog

## What Changed

Updated the `handleShare` function and `generateShareImage` in `GameFeed.tsx` to ensure text and image are shared together on Windows.

## Key Improvements

### 1. **URL Embedded in Image**
- The share URL is now **permanently embedded** at the bottom of the generated image
- Even if text doesn't transfer, users can see and type the URL from the image
- Image includes: Logo, Game Title, Tagline, and **Share URL**

### 2. **Pre-Copy Text Strategy**
- Text is copied to clipboard **BEFORE** opening the share dialog
- This ensures text is always available, even if the share API doesn't pass it
- User gets notification: "Text is also in your clipboard - paste it if needed!"

### 3. **Triple-Layer Fallback System**
- Strategy 1: Native Share Dialog (with pre-copied text)
- Strategy 2: Advanced Clipboard (image + text together)
- Strategy 3: Text-only clipboard (URL visible in image anyway)

## How It Works

### Share Flow:

1. **Generate Image** (with embedded URL)
2. **Copy text to clipboard** silently
3. **Open Windows Share dialog** with image
4. User selects app (Mail, Twitter, Discord, etc.)
5. **Image is shared** + **Text is in clipboard** ready to paste

## User Experience

When clicking the Share button:

### On Windows 10/11 (Edge/Chrome):
1. Shows "Preparing to share..." toast
2. Text is copied to clipboard automatically
3. Windows Share dialog opens with installed apps
4. User selects app → Image is shared
5. Success message: "Shared successfully! Text is also in your clipboard - paste it if needed!"
6. User can paste text separately if the app needs it

### Fallback (if share dialog not available):
1. Both image AND text copied to clipboard
2. Shows "Image & text copied to clipboard!"
3. User pastes into any app → Both appear

### Final Fallback:
1. Text copied to clipboard
2. Shows "Link copied to clipboard! The URL is also visible in the image"

## Generated Image Details

**Dimensions**: 1200x630px (optimal for social media)

**Content**:
- Oplus logo (top center)
- Game title (center, bold)
- Tagline: "Hey! I'm waiting for you, let's play together!"
- **Share URL** (bottom, bold) - e.g., "yoursite.com/feed?game=123"

**Design**:
- Purple gradient background (#6366f1 → #8b5cf6)
- White text with shadow for readability
- Professional social media share format

## Technical Details

- Share text format: `Hey! I'm waiting for you, let's play {title} on Oplus!\n\n{url}`
- Image filename: `{game-title}-oplus.png`
- Pre-clipboard copy happens before share dialog (non-blocking)
- URL in image is shortened (removes https://) for cleaner look

## Browser Support

- **Full support**: Edge 93+, Chrome 89+ (Windows 10/11)
- **Clipboard fallback**: All modern browsers
- **Text fallback**: All browsers

## Why This Works

**Problem**: Windows Share API often ignores the `text` parameter when sharing files.

**Solution**: 
1. ✅ URL is **embedded in the image** (always visible)
2. ✅ Text is **pre-copied to clipboard** (ready to paste)
3. ✅ User gets **clear instructions** in toast notifications
4. ✅ Multiple fallback strategies ensure it always works

## Testing

1. Click share button on any game
2. Check clipboard - text should be there
3. Windows Share dialog opens
4. Select any app (Mail, Twitter, etc.)
5. Image is shared with embedded URL
6. Paste text separately if needed (already in clipboard)
