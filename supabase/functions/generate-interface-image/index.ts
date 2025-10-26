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
    // 1. Get the prompt from the request
    const { prompt } = await req.json();
    if (!prompt) {
      throw new Error("Missing 'prompt' in request body");
    }

    // 2. Use Google API Key directly (for local testing ONLY)
    const googleApiKey = "AIzaSyAW1EI82pftDLAjSb6N_eV0l2_MSz69Ij0";

    // 3. Initialize the Google Gemini client
    const genAI = new GoogleGenerativeAI(googleApiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-image" 
    });

    // 4. Ask the model to generate an image
    const response = await model.generateContent({
      contents: [{
        parts: [{ text: `A cinematic game thumbnail for a game about: ${prompt}, 9:16 aspect ratio, high quality` }]
      }],
      generationConfig: {
        responseMimeType: "image/png",
        responseModalities: [Modality.IMAGE],
      },
    });

    // 5. Get the base64-encoded image data from the response
    const imagePart = response.response.candidates?.[0].content.parts[0];
    if (imagePart?.inlineData?.data === undefined) {
      throw new Error("Google AI did not return image data.");
    }
    const imageBase64 = imagePart.inlineData.data;

    // 6. Decode the Base64 image into binary data
    const imageBody = decodeBase64(imageBase64);

    // 7. Create a Supabase admin client to upload the image
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 8. Upload the image to Supabase Storage
    const safePrompt = prompt.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
    const filePath = `public/${Date.now()}-${safePrompt}.png`;

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

    // 9. Get the public URL for the newly uploaded image
    const { data: publicUrlData } = supabaseClient
      .storage
      .from('thumbnails')
      .getPublicUrl(filePath);

    // 10. Return the new image URL to your website
    return new Response(
      JSON.stringify({ imageUrl: publicUrlData.publicUrl }),
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
