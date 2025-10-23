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
    const { prompt, game_id, metadata } = await req.json();
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
    const POLLINATION_API_URL = Deno.env.get('POLLINATION_API_URL') || 'https://api.pollination.ai/v1/images';
    const POLLINATION_API_KEY = Deno.env.get('POLLINATION_API_KEY') || '';

    // Attempt Pollination AI first if configured; otherwise fallback to placeholder
    let thumbnailUrl = '';
    if (POLLINATION_API_KEY) {
      try {
        const title: string | undefined = metadata?.title;
        const genre: string | undefined = metadata?.genre;
        const colorPalette: string | undefined = metadata?.colorPalette;
        const tags: string[] | undefined = Array.isArray(metadata?.tags) ? metadata.tags : undefined;

        const pollinationPayload: Record<string, unknown> = {
          prompt: [
            'Design a high-quality vertical game cover thumbnail.',
            title ? `Title: ${title}.` : '',
            genre ? `Genre: ${genre}.` : '',
            colorPalette ? `Color palette/mood: ${colorPalette}.` : '',
            tags && tags.length ? `Tags: ${tags.join(', ')}.` : '',
            'Aspect ratio 9:16. 2D Perfects quality. Clear focal composition. No text watermark.'
          ].filter(Boolean).join(' '),
          aspect_ratio: '9:16',
          safety: { nsfw: false },
        };

        const pollinationRes = await fetch(POLLINATION_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${POLLINATION_API_KEY}`,
          },
          body: JSON.stringify(pollinationPayload),
        });

        if (pollinationRes.ok) {
          const body = await pollinationRes.json();
          // Try several common shapes for image URL fields
          const candidate = body?.imageUrl
            || body?.url
            || body?.data?.[0]?.url
            || body?.output?.[0]?.url
            || '';
          if (typeof candidate === 'string' && candidate.length > 0) {
            thumbnailUrl = candidate;
          }
        } else {
          console.error('Pollination API error', pollinationRes.status, await pollinationRes.text());
        }
      } catch (e) {
        console.error('Pollination integration failed:', e);
      }
    }

    if (!thumbnailUrl) {
      // Fallback: stable 9:16 placeholder based on prompt
      const baseText = (typeof prompt === 'string' && prompt.trim().length > 0)
        ? prompt.trim().slice(0, 40)
        : 'Game Thumbnail';
      const encodedText = encodeURIComponent(baseText).replace(/%20/g, '+');
      thumbnailUrl = `https://placehold.co/720x1280/png?text=${encodedText}`;
    }

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
