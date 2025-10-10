import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Ensure a profile row exists for the given user. Creates one if missing,
 * picking a unique username derived from the user's email or id.
 */
export async function ensureProfileExistsForUser(
  supabase: SupabaseClient,
  userId: string,
  suggestedUsername: string
) {
  const { data: existing, error: fetchError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (existing) return;

  const base = (suggestedUsername || `user_${userId.slice(0, 8)}`)
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24) || `user_${userId.slice(0, 8)}`;

  let attempt = 0;
  let candidate = base;
  while (attempt < 50) {
    const { data: row, error: checkErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', candidate)
      .maybeSingle();
    if (checkErr) throw checkErr;
    if (!row) break;
    attempt += 1;
    const suffix = `_${attempt}`;
    const maxBaseLength = Math.max(1, 24 - suffix.length);
    candidate = `${base.slice(0, maxBaseLength)}${suffix}`;
  }

  const { error: insertError } = await supabase
    .from('profiles')
    .insert({ id: userId, username: candidate });
  if (insertError) throw insertError;
}
