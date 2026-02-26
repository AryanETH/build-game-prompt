// Automated Data Migration Script
// Migrates data from old Supabase project to new one

import { createClient } from '@supabase/supabase-js';

// Old project credentials
const OLD_URL = 'https://zyozjzfkmmtuxvjgryhk.supabase.co';
const OLD_KEY = 'YOUR_OLD_ANON_KEY_HERE'; // Get from old project dashboard

// New project credentials
const NEW_URL = 'https://tadxoqrxzzmrksdslthd.supabase.co';
const NEW_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZHhvcXJ4enptcmtzZHNsdGhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMDM1ODcsImV4cCI6MjA4Mzg3OTU4N30.8zOnfvmbd1uSV2i44ATmMv-p3FCeP4RnLRGfsCYf3d4';

const oldSupabase = createClient(OLD_URL, OLD_KEY);
const newSupabase = createClient(NEW_URL, NEW_KEY);

async function migrateTable(tableName, batchSize = 100) {
  console.log(`\n📦 Migrating ${tableName}...`);
  
  try {
    // Fetch all data from old project
    const { data, error } = await oldSupabase
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error(`❌ Error fetching ${tableName}:`, error);
      return { success: false, error };
    }
    
    if (!data || data.length === 0) {
      console.log(`⚠️  No data found in ${tableName}`);
      return { success: true, count: 0 };
    }
    
    console.log(`📊 Found ${data.length} records in ${tableName}`);
    
    // Insert in batches
    let inserted = 0;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      const { error: insertError } = await newSupabase
        .from(tableName)
        .insert(batch);
      
      if (insertError) {
        console.error(`❌ Error inserting batch ${i}-${i + batch.length}:`, insertError);
        // Continue with next batch
      } else {
        inserted += batch.length;
        console.log(`✅ Inserted ${inserted}/${data.length} records`);
      }
    }
    
    return { success: true, count: inserted };
  } catch (err) {
    console.error(`❌ Migration failed for ${tableName}:`, err);
    return { success: false, error: err };
  }
}

async function migrateAll() {
  console.log('🚀 Starting data migration...\n');
  console.log('Old Project:', OLD_URL);
  console.log('New Project:', NEW_URL);
  
  const results = {};
  
  // Migrate in order (respecting foreign key constraints)
  const tables = [
    'profiles',      // First - other tables reference this
    'games',         // Second - comments/likes reference this
    'game_likes',
    'game_comments',
    'follows',
    'direct_messages',
    'coin_purchases',
  ];
  
  for (const table of tables) {
    results[table] = await migrateTable(table);
    
    // Wait a bit between tables
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n\n📊 Migration Summary:');
  console.log('='.repeat(50));
  for (const [table, result] of Object.entries(results)) {
    const status = result.success ? '✅' : '❌';
    const count = result.count || 0;
    console.log(`${status} ${table}: ${count} records`);
  }
  console.log('='.repeat(50));
  console.log('\n✨ Migration complete!');
}

// Run migration
migrateAll().catch(console.error);
