# Video & Media Management - Test Checklist

## ✅ Test Checklist

### Avatar Management
- [ ] Upload avatar image
- [ ] See avatar preview
- [ ] Click "Remove" button
- [ ] Avatar disappears
- [ ] Upload new avatar
- [ ] New avatar replaces old one
- [ ] Paste avatar URL
- [ ] URL avatar shows in preview
- [ ] Delete URL avatar with button

### Image Management
- [ ] Upload content image
- [ ] See image preview
- [ ] Click "Remove Image" button
- [ ] Image disappears
- [ ] Upload new image
- [ ] New image replaces old one
- [ ] Paste image URL
- [ ] URL image shows in preview
- [ ] Delete URL image with button

### Video Management
- [ ] Upload video file (< 50MB)
- [ ] See "Uploading..." loading state
- [ ] Video preview appears with controls
- [ ] Play video in preview
- [ ] Click "Remove Video" button
- [ ] Video disappears
- [ ] Upload new video
- [ ] New video replaces old one
- [ ] Paste video URL
- [ ] URL video shows in preview
- [ ] Delete URL video with button

### Live Preview
- [ ] Add avatar → Preview updates
- [ ] Remove avatar → Preview updates
- [ ] Add image → Preview shows image
- [ ] Remove image → Preview updates
- [ ] Add video → Preview shows video
- [ ] Remove video → Preview updates
- [ ] Type message → Preview updates
- [ ] All media shows together in preview

### Broadcast Sending
- [ ] Fill all fields (name, avatar, message, image, video)
- [ ] Click "Send to All Users"
- [ ] See progress: "Sending... X/Y"
- [ ] Success message appears
- [ ] Form clears completely
- [ ] All media removed from preview

### Notification Display
- [ ] Go to Activity page
- [ ] See broadcast notification (blue highlight)
- [ ] Click notification
- [ ] Dialog opens
- [ ] Shows sender name and avatar
- [ ] Shows full message
- [ ] Shows full-size image
- [ ] Shows video player
- [ ] Video plays with controls
- [ ] Can pause/play video
- [ ] Can seek video
- [ ] Can adjust volume
- [ ] Can fullscreen video

### Error Handling
- [ ] Try upload > 5MB image → Error message
- [ ] Try upload > 50MB video → Error message
- [ ] Try upload non-image file as avatar → Error
- [ ] Try upload non-video file as video → Error
- [ ] Upload fails gracefully
- [ ] Error messages are clear

### Edge Cases
- [ ] Send with only message (no media)
- [ ] Send with only avatar
- [ ] Send with only image
- [ ] Send with only video
- [ ] Send with all media
- [ ] Send with image + video
- [ ] Long message with media
- [ ] Multiple line breaks in message
- [ ] Special characters in message
- [ ] Emojis in message

### Browser Compatibility
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test in Edge
- [ ] Test on mobile browser

### Performance
- [ ] Large image uploads quickly
- [ ] Large video uploads with progress
- [ ] Preview loads fast
- [ ] Dialog opens smoothly
- [ ] Video plays without buffering
- [ ] No lag when typing

## Quick Test Script

### Test 1: Full Media Broadcast
```
1. Sender Name: "O+ Team"
2. Upload avatar (team logo)
3. Message: "🎉 Welcome! Check out our new features."
4. Upload image (feature screenshot)
5. Upload video (demo.mp4)
6. Check preview shows all
7. Send to all users
8. Verify in Activity page
9. Click notification
10. Verify all media displays
```

### Test 2: Delete & Replace
```
1. Upload avatar
2. Click "Remove"
3. Upload new avatar
4. Upload image
5. Click "Remove Image"
6. Upload new image
7. Upload video
8. Click "Remove Video"
9. Upload new video
10. Verify all replacements work
```

### Test 3: URL Media
```
1. Paste avatar URL
2. Paste image URL
3. Paste video URL (YouTube)
4. Check all previews load
5. Send broadcast
6. Verify URLs work in notification
```

### Test 4: Error Handling
```
1. Try upload 10MB image → Error
2. Try upload 100MB video → Error
3. Try upload .txt as avatar → Error
4. Try upload .pdf as video → Error
5. Verify error messages clear
```

## Expected Results

### Upload Success:
- ✅ Loading state shows
- ✅ Success toast appears
- ✅ Preview updates immediately
- ✅ Delete button appears
- ✅ Can play video in preview

### Delete Success:
- ✅ Media disappears immediately
- ✅ Success toast appears
- ✅ Preview updates
- ✅ Can upload new media

### Send Success:
- ✅ Progress tracking works
- ✅ Success message shows count
- ✅ Form clears completely
- ✅ All previews clear

### Notification Display:
- ✅ Blue highlight visible
- ✅ "Click to view" badge shows
- ✅ Dialog opens on click
- ✅ All media displays correctly
- ✅ Video player works
- ✅ Can delete notification

## Common Issues & Fixes

### Issue: Upload button not working
**Fix:** Check file input onChange handler is connected

### Issue: Video doesn't play
**Fix:** Verify video format is supported (MP4, WebM)

### Issue: Delete button doesn't work
**Fix:** Check state setter functions are called

### Issue: Preview doesn't update
**Fix:** Verify state changes trigger re-render

### Issue: Form doesn't clear
**Fix:** Check all state setters called on success

## Sign-off

- [ ] All tests passed
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Mobile responsive
- [ ] Ready for production

**Tested by:** _____________
**Date:** _____________
**Browser:** _____________
**Notes:** _____________
