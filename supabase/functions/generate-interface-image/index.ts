import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai';
import { decodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

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
    if (!prompt) {
      throw new Error("Missing 'prompt' in request body");
    }

    const googleApiKey = Deno.env.get("GOOGLE_API_KEY") || "";

    const genAI = new GoogleGenerativeAI(googleApiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-preview-05-20" 
    });

    const response = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{ text: `A cinematic game thumbnail for a game about: ${prompt}, 9:16 aspect ratio, high quality` }]
      }],
      generationConfig: {
        responseMimeType: "image/png",
      },
    });

    const imagePart = response.response.candidates?.[0].content.parts[0];
    if (!(imagePart as any)?.inlineData?.data) {
      throw new Error("Google AI did not return image data.");
    }
    const imageBase64 = (imagePart as any).inlineData.data;

    const imageBody = decodeBase64(imageBase64);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const safePrompt = prompt.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
    const filePath = `public/${Date.now()}-${safePrompt}.png`;

    const { error: uploadError } = await supabaseClient
      .storage
      .from('thumbnails')
      .upload(filePath, imageBody, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Supabase Storage error: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabaseClient
      .storage
      .from('thumbnails')
      .getPublicUrl(filePath);

    return new Response(
      JSON.stringify({ imageUrl: publicUrlData.publicUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error in generate-thumbnail function: ${message}`);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
