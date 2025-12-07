# Test Broadcast Image Upload

## Fixed Issues
✅ Converted from DOM manipulation to React state management
✅ Proper event handlers for file uploads
✅ Real-time preview updates
✅ Loading states during upload
✅ Form clears after successful send

## How to Test

### 1. Test Avatar Upload
1. Go to Admin Panel → Broadcast tab
2. Click "Upload Avatar" button
3. Select an image file (JPG, PNG, GIF, WebP)
4. Watch for:
   - "Uploading..." loading state
   - "Avatar uploaded!" success message
   - Image preview appears below
   - Live preview updates on right side

### 2. Test Content Image Upload
1. Click "Upload Content Image" button
2. Select an image file
3. Watch for:
   - "Uploading..." loading state
   - "Image uploaded!" success message
   - Image preview appears below
   - Live preview updates on right side

### 3. Test URL Input
1. Paste an image URL in "Sender Avatar" field
2. Preview should update immediately
3. Paste an image URL in "Content Image" field
4. Preview should update immediately

### 4. Test Live Preview
1. Type in "Sender Name" field → Preview updates
2. Add avatar → Preview shows avatar instead of bell icon
3. Type message → Preview shows message
4. Add content image → Preview shows image

### 5. Test Full Broadcast
1. Fill in all fields:
   - Sender Name: "O+ Team"
   - Upload or paste avatar
   - Message: "🎉 Test notification"
   - Upload or paste content image
2. Check preview looks good
3. Click "Send to All Users"
4. Watch progress: "Sending... X/Y"
5. Success message appears
6. Form clears automatically
7. Check Activity page to see notification

## Troubleshooting

### Upload button not working
- Check browser console for errors
- Verify you're logged in as admin
- Check Supabase Storage is configured

### "Failed to upload" error
Run this SQL in Supabase:

```sql
-- Create thumbnails bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
DROP POLICY IF EXISTS "Authenticated users can upload thumbnails" ON storage.objects;
CREATE POLICY "Authenticated users can upload thumbnails"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'thumbnails');

-- Allow public read
DROP POLICY IF EXISTS "Public can view thumbnails" ON storage.objects;
CREATE POLICY "Public can view thumbnails"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'thumbnails');
```

### Preview not updating
- Refresh the page
- Clear browser cache
- Check React DevTools for state updates

### Images not showing in notifications
- Check the notification payload in database
- Verify `avatar_url` and `image_url` fields are present
- Check NotificationPanel component handles these fields

## Expected Behavior

### Upload Flow:
1. Click upload button
2. File picker opens
3. Select image
4. Loading state shows
5. Image uploads to Supabase Storage
6. Public URL generated
7. URL set in input field
8. Preview updates
9. Success toast appears

### State Management:
- `broadcastSenderName` - Sender name text
- `broadcastSenderAvatar` - Avatar URL
- `broadcastMessage` - Message text
- `broadcastContentImage` - Content image URL
- `uploadingBroadcastAvatar` - Avatar upload loading
- `uploadingBroadcastImage` - Image upload loading

### Notification Payload:
```json
{
  "type": "broadcast",
  "content": "Your message",
  "read": false,
  "username": "O+ Team",
  "avatar_url": "https://...",
  "image_url": "https://..."
}
```

## Success Criteria
- ✅ Can upload avatar image
- ✅ Can upload content image
- ✅ Can paste URLs
- ✅ Preview updates in real-time
- ✅ Loading states work
- ✅ Form clears after send
- ✅ Notifications appear in Activity page
- ✅ Images display correctly in notifications
