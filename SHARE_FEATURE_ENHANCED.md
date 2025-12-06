# Share Feature Enhanced - Windows Native Share Dialog

## What Changed

Updated the `handleShare` function in `GameFeed.tsx` to properly trigger the Windows native share dialog on desktop.

## How It Works

The share functionality now follows this priority order:

### 1. **Native Share Dialog (Primary - Desktop & Mobile)**
- Uses `navigator.share()` with `navigator.canShare()` check
- Opens Windows Share menu showing installed apps (Mail, OneNote, Twitter, etc.)
- Shares both the branded image AND text together
- User can select which app to share to

### 2. **Advanced Clipboard (Fallback)**
- Uses `ClipboardItem` API to write both image and text simultaneously
- User can paste into any app (Discord, Slack, WhatsApp, etc.)
- Both image and text are available in clipboard

### 3. **Text-Only Clipboard (Final Fallback)**
- Copies just the share link and message
- Works on all browsers

## User Experience

When clicking the Share button:

1. **On Windows 10/11 with compatible browsers (Edge, Chrome)**:
   - Shows "Preparing to share..." toast
   - Opens native Windows Share dialog
   - User sees all installed apps that can receive images/text
   - Selects app → Image and text are shared together

2. **If native share not available**:
   - Copies both image and text to clipboard
   - Shows "Image & text copied to clipboard!"
   - User can paste into any app

3. **If advanced clipboard fails**:
   - Copies text link only
   - Shows "Link copied to clipboard!"

## Technical Details

- Generates branded 1200x630px image with Oplus logo
- Includes game title and "Let's Play Together!" tagline
- Share URL format: `https://yoursite.com/feed?game={gameId}`
- Share text: "Hey! I'm waiting for you, let's play {title} on Oplus!"

## Browser Support

- **Full support**: Edge 93+, Chrome 89+ (Windows 10/11)
- **Clipboard fallback**: All modern browsers
- **Text fallback**: All browsers including IE11

## Testing

To test on Windows:
1. Click share button on any game
2. Should see Windows Share dialog with apps like:
   - Mail
   - OneNote
   - Twitter/X
   - Facebook
   - LinkedIn
   - Any other installed share targets

If no apps appear, the clipboard fallback will activate automatically.
