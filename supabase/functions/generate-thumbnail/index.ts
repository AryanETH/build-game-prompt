import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GoogleGenerativeAI, Modality } from 'https://esm.sh/@google/generative-ai';
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
    // 1. Get the prompt and metadata from the request
    const { prompt, metadata } = await req.json();
    if (!prompt) {
      throw new Error("Missing 'prompt' in request body");
    }

    // 2. Get API key from environment (secure)
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not found in environment");
    }

    // 3. Build the full prompt with metadata
    const title = metadata?.title || prompt.slice(0, 50);
    const description = prompt;
    const graphicsQuality = metadata?.colorPalette || 'high';
    const mode = metadata?.genre || 'single-player';
    
    const fullPrompt = `Generate a high-quality vertical game thumbnail in a 9:16 aspect ratio. The output must be a PNG image only—no text, no captions, no borders, no markdown, and no explanations. The thumbnail should visually represent the game described below and remain clear and readable even at very small sizes. Use vibrant colors, high contrast, a strong focal point, and elements that match the game's theme.

Always embed the official FEEP logo PNG with transparent background in the bottom-right corner. Keep the logo crisp, clean, small, and unobtrusive but clearly visible. Do not distort or recreate the logo.

Game Metadata

Title: ${title}

Description: ${description}

Graphics Quality: ${graphicsQuality}

Mode: ${mode}

Strict Output Requirements

Output ONLY a PNG image encoded as base64/inlineData.

Use exact 9:16 aspect ratio (e.g., 1080×1920).

Do not include any text inside the image.

Thumbnail must be visually appealing and game-themed.

FEEP logo must be placed cleanly and correctly.

Return no markdown, no JSON, no comments—PNG image only.`;

    // 4. Initialize the Google Gemini client
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-image" // Use image generation capable model
    });

    // 5. Ask the model to generate an image
    const response = await model.generateContent({
      contents: [{
        parts: [{ text: fullPrompt }]
      }],
      generationConfig: {
        responseMimeType: "image/png",
        responseModalities: [Modality.IMAGE],
      },
    });

    // 6. Get the base64-encoded image data from the response
    const imagePart = response.response.candidates?.[0].content.parts[0];
    if (imagePart?.inlineData?.data === undefined) {
      throw new Error("Google AI did not return image data.");
    }
    const imageBase64 = imagePart.inlineData.data;

    // 7. Decode the Base64 image into binary data
    const imageBody = decodeBase64(imageBase64);

    // 8. Create a Supabase admin client to upload the image
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 9. Upload the image to Supabase Storage
    const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
    const filePath = `public/${Date.now()}-${safeTitle}.png`;

    const { error: uploadError } = await supabaseClient
      .storage
      .from('thumbnails') // The name of your bucket
      .upload(filePath, imageBody, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Supabase Storage error: ${uploadError.message}`);
    }

    // 10. Get the public URL for the newly uploaded image
    const { data: publicUrlData } = supabaseClient
      .storage
      .from('thumbnails')
      .getPublicUrl(filePath);

    // 11. Return the new image URL to your website
    return new Response(
      JSON.stringify({ thumbnailUrl: publicUrlData.publicUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`Error in generate-thumbnail function: ${error.message}`);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
