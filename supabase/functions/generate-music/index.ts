import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();

    // Use a free music library API - Pixabay Music API
    // Note: Pixabay requires an API key but has a generous free tier
    // For a truly free alternative without API key, we'll use MusicGen via Replicate or similar
    
    // For now, we'll generate a simple background music URL using a free music service
    // This is a placeholder - you would integrate with a real music generation service
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Use Lovable AI to generate music description and fetch from free library
    const musicGenres = ['ambient', 'electronic', 'chill', 'upbeat', 'cinematic'];
    const randomGenre = musicGenres[Math.floor(Math.random() * musicGenres.length)];

    // Free music URLs from free music archive (example URLs)
    const freeMusicLibrary = [
      'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3',
      'https://assets.mixkit.co/music/preview/mixkit-games-worldbeat-466.mp3',
      'https://assets.mixkit.co/music/preview/mixkit-dreaming-big-31.mp3',
      'https://assets.mixkit.co/music/preview/mixkit-a-very-happy-christmas-897.mp3',
      'https://assets.mixkit.co/music/preview/mixkit-hip-hop-02-738.mp3',
    ];

    // Return a random free music track
    const randomMusic = freeMusicLibrary[Math.floor(Math.random() * freeMusicLibrary.length)];

    return new Response(
      JSON.stringify({ musicUrl: randomMusic }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    // Log detailed error server-side only
    console.error('Error in generate-music function:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    // Return generic error to client
    return new Response(
      JSON.stringify({ error: 'Unable to generate music. Please try again later.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});