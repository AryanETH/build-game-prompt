// Migration script - Run with: node migrate-data.mjs
import { createClient } from '@supabase/supabase-js';

const OLD_URL = 'https://zyozjzfkmmtuxvjgryhk.supabase.co';
const OLD_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5b3pqemZrbW10dXh2amdyeWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDg4ODkyNSwiZXhwIjoyMDc2NDY0OTI1fQ.ZjFStE8yD6Ggwyl4274q92EuWrF3zgS-hOiXPq3m74Y'; // You'll need this from old project

const NEW_URL = 'https://tadxoqrxzzmrksdslthd.supabase.co';
const NEW_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZHhvcXJ4enptcmtzZHNsdGhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMwMzU4NywiZXhwIjoyMDgzODc5NTg3fQ.LtBXjxsYOKlEJg6LZ8zx3qr0fwjHzz6_exQkmoJkCwo';

const oldSupabase = createClient(OLD_URL, OLD_SERVICE_KEY);
const newSupabase = createClient(NEW_URL, NEW_SERVICE_KEY);

async function migrate() {
  console.log('🚀 Starting migration...\n');

  // First, migrate auth users
  console.log('👤 Migrating auth users...');
  try {
    const { data: oldUsers, error: oldUsersError } = await oldSupabase.auth.admin.listUsers();
    
    if (oldUsersError) {
      console.error(`❌ Error reading auth users:`, oldUsersError.message);
    } else {
      console.log(`   Found ${oldUsers.users.length} auth users`);
      
      for (const user of oldUsers.users) {
        // Try to create user with original ID
        const { data: newUser, error: createError } = await newSupabase.auth.admin.createUser({
          email: user.email,
          email_confirm: true,
          user_metadata: user.user_metadata,
          app_metadata: user.app_metadata,
          id: user.id, // Preserve original user ID
        });
        
        if (createError) {
          if (createError.message.includes('already registered')) {
            // User exists, try to update instead
            const { error: updateError } = await newSupabase.auth.admin.updateUserById(
              user.id,
              {
                email: user.email,
                user_metadata: user.user_metadata,
                app_metadata: user.app_metadata,
              }
            );
            
            if (updateError) {
              console.log(`   ⚠️  Could not update user ${user.email}: ${updateError.message}`);
            } else {
              console.log(`   ✅ Updated existing user: ${user.email}`);
            }
          } else {
            console.error(`   ❌ Error creating user ${user.email}:`, createError.message);
          }
        } else {
          console.log(`   ✅ Migrated user: ${user.email}`);
        }
      }
      console.log('✓ Auth users migration complete\n');
    }
  } catch (error) {
    console.error('❌ Auth migration failed:', error.message);
  }

  // Then migrate database tables
  const tables = ['profiles', 'games', 'likes', 'comments', 'follows', 'notifications'];

  for (const table of tables) {
    console.log(`📦 Migrating ${table}...`);
    const { data, error } = await oldSupabase.from(table).select('*');
    
    if (error) {
      console.error(`❌ Error reading ${table}:`, error.message);
      continue;
    }

    console.log(`   Found ${data.length} records`);

    if (data.length > 0) {
      // Clean data before inserting
      const cleanedData = data.map(record => {
        const cleaned = { ...record };
        
        // Convert array fields - handle both string and array types
        if (table === 'profiles') {
          // Handle followers_list and following_list
          ['followers_list', 'following_list'].forEach(field => {
            if (cleaned[field] !== undefined && cleaned[field] !== null) {
              // If it's already an array
              if (Array.isArray(cleaned[field])) {
                cleaned[field] = cleaned[field].length > 0 ? cleaned[field] : null;
              }
              // If it's a string, try to parse it
              else if (typeof cleaned[field] === 'string') {
                if (cleaned[field] === '[]' || cleaned[field].trim() === '') {
                  cleaned[field] = null;
                } else {
                  try {
                    const parsed = JSON.parse(cleaned[field]);
                    cleaned[field] = Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
                  } catch {
                    cleaned[field] = null;
                  }
                }
              }
            } else {
              cleaned[field] = null;
            }
          });
          
          // Handle other array fields
          ['interests', 'preferred_styles'].forEach(field => {
            if (cleaned[field] !== undefined && cleaned[field] !== null) {
              if (Array.isArray(cleaned[field])) {
                cleaned[field] = cleaned[field].length > 0 ? cleaned[field] : null;
              }
            } else {
              cleaned[field] = null;
            }
          });
        }
        
        // Remove invalid values
        Object.keys(cleaned).forEach(key => {
          const value = cleaned[key];
          if (
            value === '[]' || 
            value === '' || 
            value === undefined ||
            (typeof value === 'string' && value.trim() === '') ||
            (typeof value === 'string' && value === '[]')
          ) {
            delete cleaned[key];
          }
        });
        
        return cleaned;
      });

      const { error: insertError } = await newSupabase
        .from(table)
        .upsert(cleanedData, { onConflict: 'id' });
      
      if (insertError) {
        console.error(`❌ Error inserting ${table}:`, insertError.message);
        // Try inserting one by one to find the problematic record
        console.log('   Trying individual inserts...');
        for (const record of cleanedData) {
          const { error: singleError } = await newSupabase
            .from(table)
            .upsert(record, { onConflict: 'id' });
          if (singleError) {
            console.error(`   Failed record:`, JSON.stringify(record, null, 2));
            console.error(`   Error:`, singleError.message);
          }
        }
      } else {
        console.log(`   ✅ Migrated ${data.length} ${table}`);
      }
    }
    console.log('');
  }

  console.log('✨ Migration complete!');
}

migrate();
