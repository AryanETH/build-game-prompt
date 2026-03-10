// Migrate storage files recursively from old to new Supabase project
import { createClient } from '@supabase/supabase-js';

const OLD_URL = 'https://zyozjzfkmmtuxvjgryhk.supabase.co';
const OLD_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5b3pqemZrbW10dXh2amdyeWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDg4ODkyNSwiZXhwIjoyMDc2NDY0OTI1fQ.ZjFStE8yD6Ggwyl4274q92EuWrF3zgS-hOiXPq3m74Y';

const NEW_URL = 'https://tadxoqrxzzmrksdslthd.supabase.co';
const NEW_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZHhvcXJ4enptcmtzZHNsdGhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMwMzU4NywiZXhwIjoyMDgzODc5NTg3fQ.LtBXjxsYOKlEJg6LZ8zx3qr0fwjHzz6_exQkmoJkCwo';

const oldSupabase = createClient(OLD_URL, OLD_SERVICE_KEY);
const newSupabase = createClient(NEW_URL, NEW_SERVICE_KEY);

async function listAllFiles(bucketName, path = '') {
  const allFiles = [];
  
  const { data: items, error } = await oldSupabase
    .storage
    .from(bucketName)
    .list(path);

  if (error) {
    console.error(`Error listing ${path}:`, error.message);
    return allFiles;
  }

  for (const item of items) {
    const fullPath = path ? `${path}/${item.name}` : item.name;
    
    if (item.id === null) {
      // It's a folder, recurse into it
      const subFiles = await listAllFiles(bucketName, fullPath);
      allFiles.push(...subFiles);
    } else {
      // It's a file
      allFiles.push(fullPath);
    }
  }

  return allFiles;
}

async function migrateBucket(bucketName) {
  console.log(`\n📦 Migrating bucket: ${bucketName}`);
  
  try {
    // Get all files recursively
    const files = await listAllFiles(bucketName);
    
    if (files.length === 0) {
      console.log(`   No files found in ${bucketName}`);
      return;
    }

    console.log(`   Found ${files.length} files`);

    let successCount = 0;
    let errorCount = 0;

    for (const filePath of files) {
      try {
        // Download file from old storage
        const { data: fileData, error: downloadError } = await oldSupabase
          .storage
          .from(bucketName)
          .download(filePath);

        if (downloadError) {
          console.error(`   ❌ Download failed: ${filePath}`);
          errorCount++;
          continue;
        }

        // Upload to new storage
        const { error: uploadError } = await newSupabase
          .storage
          .from(bucketName)
          .upload(filePath, fileData, {
            contentType: fileData.type || 'application/octet-stream',
            upsert: true
          });

        if (uploadError) {
          console.error(`   ❌ Upload failed: ${filePath} - ${uploadError.message}`);
          errorCount++;
        } else {
          console.log(`   ✅ ${filePath}`);
          successCount++;
        }
      } catch (error) {
        console.error(`   ❌ Error: ${filePath} - ${error.message}`);
        errorCount++;
      }
    }

    console.log(`\n✓ Completed ${bucketName}: ${successCount} succeeded, ${errorCount} failed`);
  } catch (error) {
    console.error(`❌ Failed to migrate ${bucketName}:`, error.message);
  }
}

async function migrate() {
  console.log('🚀 Starting storage migration...\n');

  const buckets = ['game-assets', 'game-thumbnails', 'avatars'];
  
  for (const bucket of buckets) {
    await migrateBucket(bucket);
  }

  console.log('\n✨ Storage migration complete!');
}

migrate();
