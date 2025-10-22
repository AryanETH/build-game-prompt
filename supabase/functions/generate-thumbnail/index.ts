import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, game_id } = await req.json();
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

    // Return a stable 9:16 placeholder thumbnail URL based on the prompt.
    const baseText = (typeof prompt === 'string' && prompt.trim().length > 0)
      ? prompt.trim().slice(0, 40)
      : 'Game Thumbnail';
    const encodedText = encodeURIComponent(baseText).replace(/%20/g, '+');
    const thumbnailUrl = `https://placehold.co/720x1280/png?text=${encodedText}`;

    // If a game_id is provided and Supabase env is set, persist to DB
    if (game_id && SUPABASE_URL && SUPABASE_ANON_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: req.headers.get('Authorization') || '' } },
      });
      // Try to update both cover_url and thumbnail_url for better feed visuals
      await supabase
        .from('games')
        .update({ cover_url: thumbnailUrl, thumbnail_url: thumbnailUrl })
        .eq('id', game_id);
    }

    return new Response(
      JSON.stringify({ thumbnailUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    // Log detailed error server-side only
    console.error('Error in generate-thumbnail function:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    // Return generic error to client
    return new Response(
      JSON.stringify({ error: 'Unable to generate thumbnail. Please try again later.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
