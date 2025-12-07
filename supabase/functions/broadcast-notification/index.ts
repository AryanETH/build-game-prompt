import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { message, imageUrl } = await req.json();

    if (!message || message.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all user IDs
    const { data: users, error: usersError } = await supabaseClient
      .from('profiles')
      .select('id');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch users', details: usersError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No users found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create notification payload
    const payload = {
      type: 'broadcast',
      content: message.trim(),
      read: false,
      ...(imageUrl && imageUrl.trim() !== '' && { image_url: imageUrl.trim() })
    };

    // Insert notifications in batches to avoid timeout
    const batchSize = 100;
    let totalInserted = 0;

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      const notifications = batch.map(user => ({
        user_id: user.id,
        payload: payload
      }));

      const { error: insertError } = await supabaseClient
        .from('notifications')
        .insert(notifications);

      if (insertError) {
        console.error('Batch insert error:', insertError);
        // Continue with next batch even if one fails
      } else {
        totalInserted += batch.length;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notification sent to ${totalInserted} users`,
        totalUsers: users.length,
        sent: totalInserted
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Broadcast error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
