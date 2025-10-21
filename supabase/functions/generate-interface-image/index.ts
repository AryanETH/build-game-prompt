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

    // Replace AI image generation with a stable 9:16 placeholder URL.
    // This keeps the feature functional without relying on image-capable models.
    const baseText = (typeof prompt === 'string' && prompt.trim().length > 0)
      ? prompt.trim().slice(0, 60)
      : 'Game UI';
    const encodedText = encodeURIComponent(baseText).replace(/%20/g, '+');
    const imageUrl = `https://placehold.co/720x1280/png?text=${encodedText}`;

    return new Response(
      JSON.stringify({ imageUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-interface-image function:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    return new Response(
      JSON.stringify({ error: 'Unable to generate interface image. Please try again later.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
