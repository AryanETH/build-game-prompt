// @ts-ignore - Deno types
import { serve } from "std/http/server.ts";
// @ts-ignore - Deno types
import { createClient } from "@supabase/supabase-js";

// @ts-ignore - Deno global
declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const { description } = await req.json();
    if (!description) throw new Error("Missing game description");

    // Extract key elements from description for metadata
    const nameMatches = [...description.matchAll(/[A-Z][a-zA-Z]+/g)];
    const protagonist = nameMatches[0]?.[0] || "Hero";
    const partner = nameMatches[1]?.[0] || "Companion";

    let genre = "Action";
    const descLower = description.toLowerCase();
    if (descLower.includes("sci") || descLower.includes("space") || descLower.includes("robot") || descLower.includes("cyber")) genre = "Sci-Fi";
    else if (descLower.includes("fantasy") || descLower.includes("magic") || descLower.includes("dragon") || descLower.includes("wizard")) genre = "Fantasy";
    else if (descLower.includes("horror") || descLower.includes("zombie") || descLower.includes("scary")) genre = "Horror";
    else if (descLower.includes("puzzle") || descLower.includes("brain") || descLower.includes("logic")) genre = "Puzzle";
    else if (descLower.includes("race") || descLower.includes("car") || descLower.includes("speed")) genre = "Racing";
    else if (descLower.includes("sport") || descLower.includes("soccer") || descLower.includes("basketball")) genre = "Sports";

    const gameTitle = description.split(' ').slice(0, 4).join(' ');
    const safeTitle = gameTitle.replace(/[^a-zA-Z0-9]/g, "_");
    const scene = description; // Keep scene for response metadata

    // Create a unique, detailed prompt based on the actual user description
    const finalPrompt = `Create a stunning vertical mobile game screenshot in 9:16 portrait format (1080x1920 pixels).

GAME CONCEPT: ${description}

VISUAL REQUIREMENTS:
- VERTICAL PORTRAIT orientation (9:16 aspect ratio) - MUST be taller than wide
- Mobile game screenshot aesthetic
- Cinematic, high-quality 3D rendering
- ${genre} genre visual style
- Dramatic lighting and atmospheric effects
- Rich colors and detailed textures
- Dynamic action scene that captures: ${description}

COMPOSITION:
- Vertical framing for mobile screens
- Main action/characters in center frame
- Background elements extending top to bottom
- Depth and perspective suited for portrait orientation
- Professional game marketing screenshot quality

STRICT RULES:
- NO text, UI elements, HUD, or game interface
- NO logos, watermarks, or borders
- NO landscape orientation - MUST be vertical portrait
- Pure cinematic game scene only
- Focus on bringing this concept to life: ${description}

Make it unique and specific to this game idea: ${description}

Seed: ${Date.now()}`;

    const apiKey = Deno.env.get("RAPIDAPI_KEY");
    if (!apiKey) {
      throw new Error("RAPIDAPI_KEY environment variable not set");
    }

    console.log("Generating thumbnail for:", description);
    console.log("Detected genre:", genre);
    console.log("Prompt length:", finalPrompt.length);

    const rapid = await fetch(
      "https://ai-text-to-image-generator-flux-free-api.p.rapidapi.com/aaaaaaaaaaaaaaaaaiimagegenerator/fluximagegenerate/generateimage.php",
      {
        method: "POST",
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": "ai-text-to-image-generator-flux-free-api.p.rapidapi.com",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `prompt=${encodeURIComponent(finalPrompt)}&aspect_ratio=9:16&width=1080&height=1920&seed=${Date.now()}`,
      }
    );

    if (!rapid.ok) {
      const errorText = await rapid.text();
      throw new Error(`RapidAPI failed: ${errorText}`);
    }

    const binaryImage = new Uint8Array(await rapid.arrayBuffer());

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    const filePath = `public/${Date.now()}-${safeTitle}.jpg`;

    const { error } = await supabase.storage
      .from("thumbnails")
      .upload(filePath, binaryImage, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from("thumbnails")
      .getPublicUrl(filePath);

    return new Response(
      JSON.stringify({
        thumbnailUrl: publicUrlData.publicUrl,
        protagonist,
        partner,
        genre,
        gameTitle,
        scene,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
