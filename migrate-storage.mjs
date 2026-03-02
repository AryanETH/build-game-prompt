// Migrate storage files from old to new Supabase project
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const OLD_URL = 'https://zyozjzfkmmtuxvjgryhk.supabase.co';
const OLD_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5b3pqemZrbW10dXh2amdyeWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDg4ODkyNSwiZXhwIjoyMDc2NDY0OTI1fQ.ZjFStE8yD6Ggwyl4274q92EuWrF3zgS-hOiXPq3m74Y';

const NEW_URL = 'https://tadxoqrxzzmrksdslthd.supabase.co';
const NEW_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZHhvcXJ4enptcmtzZHNsdGhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMwMzU4NywiZXhwIjoyMDgzODc5NTg3fQ.LtBXjxsYOKlEJg6LZ8zx3qr0fwjHzz6_exQkmoJkCwo';

const oldSupabase = createClient(OLD_URL, OLD_SERVICE_KEY);
const newSupabase = createClient(NEW_URL, NEW_SERVICE_KEY);

async function migrateBucket(bucketName) {
  console.log(`\n📦 Migrating bucket: ${bucketName}`);
  
  try {
    // List all files in old bucket recursively
    const { data: files, error: listError } = await oldSupabase
      .storage
      .from(bucketName)
      .list('', { limit: 1000, sortBy: { column: 'name', order: 'asc' } });

    if (listError) {
      console.error(`❌ Error listing files in ${bucketName}:`, listError.message);
      return;
    }

    if (!files || files.length === 0) {
      console.log(`   No files found in ${bucketName}`);
      return;
    }

    console.log(`   Found ${files.length} items`);

    // Process each item
    for (const file of files) {
      // Skip folders
      if (!file.name || file.id === null) {
        console.log(`   ⏭️  Skipping folder: ${file.name}`);
        continue;
      }

      try {
        // Download file from old storage
        const { data: fileData, error: downloadError } = await oldSupabase
          .storage
          .from(bucketName)
          .download(file.name);

        if (downloadError) {
          console.error(`   ❌ Error downloading ${file.name}:`, downloadError.message);
          continue;
        }

        // Upload to new storage
        const { error: uploadError } = await newSupabase
          .storage
          .from(bucketName)
          .upload(file.name, fileData, {
            contentType: file.metadata?.mimetype || 'application/octet-stream',
            upsert: true
          });

        if (uploadError) {
          console.error(`   ❌ Error uploading ${file.name}:`, uploadError.message);
        } else {
          console.log(`   ✅ Migrated: ${file.name}`);
        }
      } catch (error) {
        console.error(`   ❌ Error processing ${file.name}:`, error.message);
      }
    }

    console.log(`✓ Completed ${bucketName}`);
  } catch (error) {
    console.error(`❌ Failed to migrate ${bucketName}:`, error.message);
  }
}

async function updateGameUrls() {
  console.log('\n🔄 Updating game URLs in database...');
  
  const { data: games, error } = await newSupabase
    .from('games')
    .select('id, html_url, thumbnail_url');

  if (error) {
    console.error('❌ Error fetching games:', error.message);
    return;
  }

  for (const game of games) {
    const updates = {};
    
    // Update html_url if it points to old storage
    if (game.html_url && game.html_url.includes(OLD_URL)) {
      updates.html_url = game.html_url.replace(OLD_URL, NEW_URL);
    }
    
    // Update thumbnail_url if it points to old storage
    if (game.thumbnail_url && game.thumbnail_url.includes(OLD_URL)) {
      updates.thumbnail_url = game.thumbnail_url.replace(OLD_URL, NEW_URL);
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await newSupabase
        .from('games')
        .update(updates)
        .eq('id', game.id);

      if (updateError) {
        console.error(`   ❌ Error updating game ${game.id}:`, updateError.message);
      } else {
        console.log(`   ✅ Updated URLs for game ${game.id}`);
      }
    }
  }

  console.log('✓ URL updates complete');
}

async function migrate() {
  console.log('🚀 Starting storage migration...\n');

  // Migrate each bucket
  const buckets = ['game-assets', 'game-thumbnails', 'avatars'];
  
  for (const bucket of buckets) {
    await migrateBucket(bucket);
  }

  // Update URLs in database
  await updateGameUrls();

  console.log('\n✨ Storage migration complete!');
}

migrate();
