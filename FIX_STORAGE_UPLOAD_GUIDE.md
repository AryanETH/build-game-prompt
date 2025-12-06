# Fix Thumbnail Upload - Storage RLS Policy

## Problem
Getting error: "new row violates row-level security policy" when uploading thumbnails.

## Solution
You need to configure the storage bucket and RLS policies in Supabase.

## Steps:

### Option 1: Using Supabase Dashboard (Easiest)

#### Step 1: Create/Configure Bucket
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **Storage** in left sidebar
4. If "thumbnails" bucket doesn't exist:
   - Click **New bucket**
   - Name: `thumbnails`
   - **Check** "Public bucket" ✓
   - Click **Create bucket**
5. If bucket exists:
   - Click on "thumbnails" bucket
   - Click **Settings** (gear icon)
   - Make sure **Public bucket** is enabled

#### Step 2: Set RLS Policies
1. Go to **SQL Editor** in left sidebar
2. Click **New Query**
3. Copy the entire content from `FIX_THUMBNAIL_STORAGE_RLS.sql`
4. Paste and click **Run**
5. Should see "Success"

### Option 2: Manual Policy Setup (Alternative)

1. Go to **Storage** → **Policies**
2. Click **New Policy** for the `thumbnails` bucket
3. Create these 4 policies:

**Policy 1: Public Read**
- Name: "Anyone can view thumbnails"
- Operation: SELECT
- Policy: `bucket_id = 'thumbnails'`

**Policy 2: Authenticated Upload**
- Name: "Authenticated users can upload thumbnails"
- Operation: INSERT
- Policy: `bucket_id = 'thumbnails' AND auth.role() = 'authenticated'`

**Policy 3: Update Own**
- Name: "Users can update their own thumbnails"
- Operation: UPDATE
- Policy: `bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]`

**Policy 4: Delete Own**
- Name: "Users can delete their own thumbnails"
- Operation: DELETE
- Policy: `bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]`

## Test Upload

After setting up:
1. Go to Admin panel
2. Click "Upload from Device" under Thumbnail
3. Select an image
4. Should upload successfully and show preview

## Troubleshooting

### Still getting RLS error?
- Make sure you're logged in as admin
- Check bucket is set to **Public**
- Verify all 4 policies are created
- Try refreshing the page

### Upload button not working?
- Check browser console (F12) for errors
- Verify file is an image (jpg, png, gif, webp)
- Check file size is under 5MB

### Image not showing after upload?
- Verify bucket is **Public**
- Check the URL in browser directly
- Make sure RLS SELECT policy exists

## What This Does

- **Public Bucket**: Anyone can view uploaded thumbnails
- **Authenticated Upload**: Only logged-in users can upload
- **Own Files**: Users can only update/delete their own uploads
- **Security**: Prevents unauthorized access while allowing uploads

## Alternative: Disable RLS (Not Recommended)

If you want to quickly test (NOT for production):
1. Go to Storage → thumbnails bucket
2. Click Settings
3. Disable RLS (not recommended for production)

But it's better to set up proper policies as shown above.
