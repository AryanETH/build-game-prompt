// Migration script to transfer data from old Supabase project to new one
import { createClient } from '@supabase/supabase-js';

// Old project credentials
const OLD_URL = 'https://zyozjzfkmmtuxvjgryhk.supabase.co';
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5b2p6emZrbW10dXh2amdyeWhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5MjU5NzcsImV4cCI6MjA1MTUwMTk3N30.Aq_Aq0Aq0Aq0Aq0Aq0Aq0Aq0Aq0Aq0Aq0Aq0Aq0Aq0';

// New project credentials
const NEW_URL = 'https://tadxoqrxzzmrksdslthd.supabase.co';
const NEW_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZHhvcXJ4enptcmtzZHNsdGhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjc5NTU5NywiZXhwIjoyMDUyMzcxNTk3fQ.Aq_Aq0Aq0Aq0Aq0Aq0Aq0Aq0Aq0Aq0Aq0Aq0Aq0Aq0';

const oldSupabase = createClient(OLD_URL, OLD_KEY);
const newSupabase = createClient(NEW_URL, NEW_KEY);

async function migrateData() {
  console.log('Starting data migration...\n');

  try {
    // 1. Migrate profiles
    console.log('1. Migrating profiles...');
    const { data: profiles, error: profilesError } = await oldSupabase
      .from('profiles')
      .select('*');
    
    if (profilesError) throw profilesError;
    console.log(`Found ${profiles.length} profiles`);

    for (const profile of profiles) {
      const { error } = await newSupabase
        .from('profiles')
        .upsert(profile, { onConflict: 'id' });
      if (error) console.error(`Error migrating profile ${profile.id}:`, error.message);
    }
    console.log('✓ Profiles migrated\n');

    // 2. Migrate games
    console.log('2. Migrating games...');
    const { data: games, error: gamesError } = await oldSupabase
      .from('games')
      .select('*');
    
    if (gamesError) throw gamesError;
    console.log(`Found ${games.length} games`);

    for (const game of games) {
      const { error } = await newSupabase
        .from('games')
        .upsert(game, { onConflict: 'id' });
      if (error) console.error(`Error migrating game ${game.id}:`, error.message);
    }
    console.log('✓ Games migrated\n');

    // 3. Migrate likes
    console.log('3. Migrating likes...');
    const { data: likes, error: likesError } = await oldSupabase
      .from('likes')
      .select('*');
    
    if (likesError) throw likesError;
    console.log(`Found ${likes.length} likes`);

    for (const like of likes) {
      const { error } = await newSupabase
        .from('likes')
        .upsert(like, { onConflict: 'id' });
      if (error) console.error(`Error migrating like ${like.id}:`, error.message);
    }
    console.log('✓ Likes migrated\n');

    // 4. Migrate comments
    console.log('4. Migrating comments...');
    const { data: comments, error: commentsError } = await oldSupabase
      .from('comments')
      .select('*');
    
    if (commentsError) throw commentsError;
    console.log(`Found ${comments.length} comments`);

    for (const comment of comments) {
      const { error } = await newSupabase
        .from('comments')
        .upsert(comment, { onConflict: 'id' });
      if (error) console.error(`Error migrating comment ${comment.id}:`, error.message);
    }
    console.log('✓ Comments migrated\n');

    // 5. Migrate follows
    console.log('5. Migrating follows...');
    const { data: follows, error: followsError } = await oldSupabase
      .from('follows')
      .select('*');
    
    if (followsError) throw followsError;
    console.log(`Found ${follows.length} follows`);

    for (const follow of follows) {
      const { error } = await newSupabase
        .from('follows')
        .upsert(follow, { onConflict: 'id' });
      if (error) console.error(`Error migrating follow ${follow.id}:`, error.message);
    }
    console.log('✓ Follows migrated\n');

    // 6. Migrate notifications
    console.log('6. Migrating notifications...');
    const { data: notifications, error: notificationsError } = await oldSupabase
      .from('notifications')
      .select('*');
    
    if (notificationsError) throw notificationsError;
    console.log(`Found ${notifications.length} notifications`);

    for (const notification of notifications) {
      const { error } = await newSupabase
        .from('notifications')
        .upsert(notification, { onConflict: 'id' });
      if (error) console.error(`Error migrating notification ${notification.id}:`, error.message);
    }
    console.log('✓ Notifications migrated\n');

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

migrateData();
