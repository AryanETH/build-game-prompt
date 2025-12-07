# Enhanced Broadcast Notification System

## New Features Added

### 1. Sender Customization
- **Sender Name**: Add a custom name (e.g., "O+ Team", "Admin", "Support")
- **Sender Avatar**: Upload or paste URL for sender's profile picture
- Makes notifications feel more personal and branded

### 2. Image Upload Support
- **Avatar Upload**: Upload sender profile picture directly from device
- **Content Image Upload**: Upload notification content image from device
- **URL Support**: Still supports pasting image URLs
- **Live Preview**: See how images look before sending

### 3. Live Preview
- Real-time preview updates as you type
- Shows exactly how notification will appear to users
- Preview includes:
  - Sender name and avatar
  - Message content
  - Content image (if added)
  - Timestamp indicator

## How to Use

### Basic Broadcast (System Notification)
1. Go to Admin Panel → Broadcast tab
2. Enter your message
3. Click "Send to All Users"
4. System notification with bell icon will be sent

### Branded Broadcast (With Sender)
1. Enter **Sender Name** (e.g., "O+ Team")
2. Upload or paste **Sender Avatar** URL
3. Enter your **Message**
4. Optionally add **Content Image**
5. Check the preview
6. Click "Send to All Users"

### Image Upload Options

#### Upload Avatar:
- Click "Upload Avatar" button
- Select image from device (max 5MB)
- Image automatically uploads to Supabase Storage
- Preview appears instantly

#### Upload Content Image:
- Click "Upload Content Image" button
- Select image from device (max 5MB)
- Image automatically uploads to Supabase Storage
- Preview appears in notification

#### Or Use URLs:
- Paste any image URL in the input fields
- Preview updates automatically

## Examples

### Welcome Message
```
Sender Name: O+ Team
Sender Avatar: [Upload O+ logo]
Message: 🎉 Welcome to O+! Start creating amazing games today.
Content Image: [Upload welcome banner]
```

### Feature Announcement
```
Sender Name: Product Team
Sender Avatar: [Upload team avatar]
Message: 🚀 New feature alert! Check out our new game editor.
Content Image: [Upload feature screenshot]
```

### System Update
```
Sender Name: (leave empty)
Sender Avatar: (leave empty)
Message: ⚠️ Scheduled maintenance tonight at 2 AM UTC.
Content Image: (leave empty)
```

### Event Notification
```
Sender Name: Events Team
Sender Avatar: [Upload event logo]
Message: 🎮 Game Jam starts tomorrow! Join now and win prizes.
Content Image: [Upload event poster]
```

## Technical Details

### Image Storage
- All uploaded images stored in Supabase Storage (`thumbnails` bucket)
- Automatic file naming: `broadcast-avatar-{timestamp}.{ext}`
- Public URLs generated automatically
- Supports: JPG, PNG, GIF, WebP

### Notification Payload
```json
{
  "type": "broadcast",
  "content": "Your message",
  "read": false,
  "username": "O+ Team",           // Optional
  "avatar_url": "https://...",     // Optional
  "image_url": "https://..."       // Optional
}
```

### Batch Processing
- Sends to 50 users per batch
- Progress tracking: "Sending... X/Y"
- Handles large user bases efficiently
- Error handling per batch

## Tips

1. **Keep messages concise** - Users see notifications in a small panel
2. **Use emojis** - Makes notifications more engaging 🎉
3. **Test first** - Send to yourself before broadcasting to all
4. **Brand it** - Use consistent sender name and avatar
5. **Add images** - Visual content gets more attention
6. **Clear form** - Form auto-clears after successful send

## Preview Features

The live preview shows:
- ✅ Sender avatar (or default bell icon)
- ✅ Sender name (or "System Notification")
- ✅ Message content
- ✅ Content image (if added)
- ✅ Timestamp ("just now")
- ✅ Exact styling users will see

## Troubleshooting

### Image upload fails
- Check file size (must be < 5MB)
- Ensure file is an image (JPG, PNG, GIF, WebP)
- Verify Supabase Storage is configured
- Check RLS policies on `thumbnails` bucket

### Preview not updating
- Refresh the page
- Check browser console for errors
- Ensure all input IDs are correct

### Broadcast fails
- Run `FIX_BROADCAST_NOTIFICATIONS.sql` first
- Check RLS policies
- Verify user count: `SELECT COUNT(*) FROM profiles;`
- Check browser console for detailed errors

## Storage Setup

If image uploads fail, run this SQL:

```sql
-- Enable storage for thumbnails bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload thumbnails"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'thumbnails');

-- Allow public read access
CREATE POLICY "Public can view thumbnails"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'thumbnails');
```

## Next Steps

Consider adding:
- [ ] Scheduled broadcasts
- [ ] User segment targeting
- [ ] Rich text formatting
- [ ] Notification templates
- [ ] Analytics (open rate, click rate)
- [ ] A/B testing
