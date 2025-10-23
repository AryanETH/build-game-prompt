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
    const body = await req.json();
    const {
      prompt,
      game_id,
      metadata,
      backgroundMode = 'dark',
    }: {
      prompt?: string;
      game_id?: string;
      metadata?: { title?: string; genre?: string; colorPalette?: string; tags?: string[] };
      backgroundMode?: 'dark' | 'light';
    } = body || {};

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const POLLINATIONS_BASE_URL = Deno.env.get('POLLINATIONS_BASE_URL') || 'https://image.pollinations.ai/prompt';
    const POLLINATIONS_API_KEY = Deno.env.get('POLLINATIONS_API_KEY') || '';

    // Build tuned prompt
    const title = metadata?.title?.toString() || '';
    const theme = (metadata?.genre || metadata?.colorPalette || '').toString();
    const tagText = Array.isArray(metadata?.tags) && metadata!.tags!.length ? metadata!.tags!.join(', ') : '';
    const styleHints = 'digital art, cinematic lighting, high detail, crisp silhouettes, 2D-perfect quality';
    const tone = backgroundMode === 'light'
      ? 'bright, clean, high-saturation, airy background'
      : 'high-contrast, neon highlights, dark space / nebula background';

    const basePrompt = (prompt && typeof prompt === 'string' && prompt.trim()) || [title, theme, tagText].filter(Boolean).join(' ');
    const promptText = `${basePrompt}. Create a striking vertical 9:16 thumbnail, ${styleHints}, ${tone}. Center main subject and leave negative space for overlay UI. Kid-safe if the creator is under 13.`;

    // Pollinations open endpoint (GET returns image)
    const encoded = encodeURIComponent(promptText);
    const pollinationsUrl = `${POLLINATIONS_BASE_URL}/${encoded}`;
    const headers: HeadersInit = new Headers({ 'Accept': 'image/*' });
    if (POLLINATIONS_API_KEY) headers.set('Authorization', `Bearer ${POLLINATIONS_API_KEY}`);

    let imageBlob: Blob | null = null;
    try {
      const pRes = await fetch(pollinationsUrl, { method: 'GET', headers });
      if (pRes.ok) {
        const arrayBuffer = await pRes.arrayBuffer();
        imageBlob = new Blob([arrayBuffer], { type: 'image/png' });
      } else {
        console.error('Pollinations non-ok:', pRes.status, await pRes.text().catch(() => ''));
      }
    } catch (e) {
      console.error('Pollinations fetch error:', e);
    }

    // Fallback placeholder if image not available
    let thumbnailUrl = '';
    let uploadedPath: string | null = null;
    if (imageBlob && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const filename = `${game_id || 'unlinked'}/${Date.now()}.png`;
        const { error: uploadErr } = await service.storage
          .from('thumbnails')
          .upload(filename, imageBlob, { contentType: 'image/png', cacheControl: '31536000', upsert: false });
        if (uploadErr) {
          console.error('Supabase upload error:', uploadErr.message || uploadErr.name);
        } else {
          uploadedPath = filename;
          const { data } = service.storage.from('thumbnails').getPublicUrl(filename);
          thumbnailUrl = data.publicUrl;
        }
      } catch (e) {
        console.error('Supabase storage error:', e);
      }
    }

    if (!thumbnailUrl) {
      const baseText = (typeof basePrompt === 'string' && basePrompt.trim().length > 0)
        ? basePrompt.trim().slice(0, 40)
        : 'Game Thumbnail';
      const encodedText = encodeURIComponent(baseText).replace(/%20/g, '+');
      thumbnailUrl = `https://placehold.co/720x1280/png?text=${encodedText}`;
    }

    // Persist to DB if we have a game_id
    if (game_id && SUPABASE_URL && (SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY)) {
      try {
        const client = SUPABASE_SERVICE_ROLE_KEY
          ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
          : createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: req.headers.get('Authorization') || '' } } });
        await client
          .from('games')
          .update({ cover_url: thumbnailUrl, thumbnail_url: thumbnailUrl })
          .eq('id', game_id);
      } catch (e) {
        console.warn("Couldn't update games table with thumbnail_url:", e);
      }
    }

    return new Response(
      JSON.stringify({ ok: true, thumbnailUrl, imageUrl: thumbnailUrl, storagePath: uploadedPath }),
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
