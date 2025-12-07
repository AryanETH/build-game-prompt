# Broadcast Notification - Video & Media Management

## New Features Added ✨

### 1. Video Upload Support
- Upload videos directly from device (max 50MB)
- Paste video URLs (YouTube, Vimeo, direct links)
- Live preview in admin panel
- Video player in notification dialog

### 2. Media Management
- **Delete Avatar** - Remove uploaded/pasted avatar
- **Delete Image** - Remove uploaded/pasted content image
- **Delete Video** - Remove uploaded/pasted video
- **Change Media** - Upload new file to replace existing

### 3. Enhanced Preview
- Shows avatar, image, AND video
- Real-time updates as you add/remove media
- Exactly matches user view

## How to Use

### Upload Video

#### Option 1: Upload from Device
1. Go to Admin Panel → Broadcast tab
2. Scroll to "Content Video (Optional)"
3. Click "Upload Video" button
4. Select video file (MP4, WebM, etc.)
5. Wait for upload (shows progress)
6. Video preview appears with controls
7. Click "Remove Video" to delete

#### Option 2: Paste Video URL
1. Find video URL (YouTube, Vimeo, direct link)
2. Paste in "Content Video" input field
3. Video preview appears automatically
4. Click "Remove Video" to delete

### Manage Media

#### Change Avatar:
1. Upload new avatar → Replaces old one
2. Or click "Remove" → Then upload new one
3. Or paste new URL → Replaces old one

#### Change Image:
1. Upload new image → Replaces old one
2. Or click "Remove Image" → Then upload new one
3. Or paste new URL → Replaces old one

#### Change Video:
1. Upload new video → Replaces old one
2. Or click "Remove Video" → Then upload new one
3. Or paste new URL → Replaces old one

### Delete Media

#### Delete Avatar:
- Click "Remove" button under avatar preview
- Avatar clears immediately
- Can upload new one or leave empty

#### Delete Image:
- Click "Remove Image" button under image preview
- Image clears immediately
- Can upload new one or leave empty

#### Delete Video:
- Click "Remove Video" button under video preview
- Video clears immediately
- Can upload new one or leave empty

## Supported Formats

### Images:
- JPG, JPEG
- PNG
- GIF
- WebP
- Max size: 5MB

### Videos:
- MP4
- WebM
- OGG
- MOV
- Max size: 50MB

### Video URLs:
- Direct video links (.mp4, .webm, etc.)
- YouTube embed URLs
- Vimeo embed URLs
- Any publicly accessible video URL

## Example Broadcasts

### 1. Welcome Video
```
Sender Name: O+ Team
Avatar: [Upload team logo]
Message: 🎉 Welcome to O+! Watch this quick intro.
Video: [Upload welcome.mp4]
```

### 2. Feature Announcement with Image
```
Sender Name: Product Team
Avatar: [Upload avatar]
Message: 🚀 New feature alert! Check it out.
Image: [Upload screenshot]
Video: [Upload demo.mp4]
```

### 3. Event Promo
```
Sender Name: Events Team
Avatar: [Upload event logo]
Message: 🎮 Game Jam starts tomorrow!
Image: [Upload poster]
Video: [Paste YouTube trailer URL]
```

### 4. System Update (No Media)
```
Sender Name: (empty)
Avatar: (empty)
Message: ⚠️ Scheduled maintenance tonight.
Image: (empty)
Video: (empty)
```

## User Experience

### In Notification Panel:
- Shows thumbnail/preview
- "Click to view" badge
- Blue highlight for broadcasts

### Click → Opens Dialog:
- Full sender info
- Complete message
- Full-size image (if present)
- Video player with controls (if present)
- Delete and Close buttons

### Video Player Features:
- Play/Pause
- Volume control
- Fullscreen option
- Seek bar
- Standard HTML5 video controls

## Technical Details

### Storage:
- All media stored in Supabase Storage
- Bucket: `thumbnails`
- Auto-generated filenames
- Public URLs

### File Naming:
- Avatar: `broadcast-avatar-{timestamp}.{ext}`
- Image: `broadcast-content-{timestamp}.{ext}`
- Video: `broadcast-video-{timestamp}.{ext}`

### Notification Payload:
```json
{
  "type": "broadcast",
  "content": "Your message",
  "read": false,
  "username": "O+ Team",
  "avatar_url": "https://...",
  "image_url": "https://...",
  "video_url": "https://..."
}
```

### State Management:
```typescript
broadcastSenderAvatar: string
broadcastContentImage: string
broadcastVideoUrl: string
uploadingBroadcastAvatar: boolean
uploadingBroadcastImage: boolean
uploadingBroadcastVideo: boolean
```

## Workflow

### Complete Broadcast Flow:
1. **Prepare Content**
   - Write message
   - Choose sender name
   - Upload/paste avatar
   - Upload/paste image
   - Upload/paste video

2. **Preview**
   - Check live preview
   - Verify all media loads
   - Test video playback

3. **Adjust**
   - Remove unwanted media
   - Change/replace media
   - Edit message

4. **Send**
   - Click "Send to All Users"
   - Watch progress
   - Form clears on success

5. **Verify**
   - Check Activity page
   - Click notification
   - Verify dialog shows all content

## Tips & Best Practices

### Video Tips:
1. **Keep it short** - Under 2 minutes ideal
2. **Compress videos** - Use tools to reduce file size
3. **Test playback** - Preview before sending
4. **Add captions** - For accessibility
5. **Use thumbnails** - First frame should be engaging

### Image Tips:
1. **Optimize size** - Compress before upload
2. **Use high quality** - But not too large
3. **Relevant content** - Match the message
4. **Aspect ratio** - 16:9 or 4:3 works best

### Avatar Tips:
1. **Square images** - Looks best in circle
2. **Clear logo/face** - Recognizable
3. **Consistent branding** - Use same avatar
4. **High contrast** - Stands out

### Message Tips:
1. **Clear and concise** - Get to the point
2. **Use emojis** - Makes it engaging
3. **Call to action** - Tell users what to do
4. **Line breaks** - For readability

## Troubleshooting

### Video upload fails:
- Check file size (must be < 50MB)
- Verify file format (MP4, WebM, etc.)
- Check internet connection
- Try compressing video

### Video doesn't play:
- Check video URL is accessible
- Try different browser
- Verify video format supported
- Check browser console for errors

### Delete button not working:
- Refresh the page
- Check browser console
- Verify state updates

### Preview not showing:
- Check URL is valid
- Verify file uploaded successfully
- Inspect network tab
- Clear browser cache

## Storage Setup

If uploads fail, run this SQL:

```sql
-- Ensure thumbnails bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload to thumbnails"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'thumbnails');

-- Allow public read access
CREATE POLICY "Public can view thumbnails"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'thumbnails');

-- Allow users to delete their uploads
CREATE POLICY "Users can delete their thumbnails"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'thumbnails');
```

## Future Enhancements

Consider adding:
- [ ] Multiple video support
- [ ] Video thumbnail generation
- [ ] Progress bar for uploads
- [ ] Drag & drop upload
- [ ] Image/video gallery
- [ ] Media library (reuse uploads)
- [ ] Video transcoding
- [ ] Subtitle support
- [ ] Live streaming support
- [ ] GIF support
- [ ] Audio file support

## Success Criteria

- ✅ Can upload videos (up to 50MB)
- ✅ Can paste video URLs
- ✅ Can delete avatar
- ✅ Can delete image
- ✅ Can delete video
- ✅ Can change/replace media
- ✅ Preview updates in real-time
- ✅ Video plays in notification dialog
- ✅ All media displays correctly
- ✅ Form clears after send
- ✅ Loading states work
- ✅ Error handling works
