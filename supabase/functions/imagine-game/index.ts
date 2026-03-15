import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { shortIdea } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    if (!shortIdea || !shortIdea.trim()) {
      throw new Error('Short idea is required');
    }

    console.log('Imagining game from short idea:', shortIdea);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a professional game designer who expands short game ideas into complete, detailed game design documents.

Take a short game idea (1-2 sentences) and expand it into a comprehensive game description covering:
1. Game Genre & Core Concept
2. Player Mechanics & Controls (mobile touch + desktop keyboard/mouse)
3. Environment & World Design
4. Enemies, Obstacles & Challenges
5. Level Structure (single/multiple/endless, win/lose conditions)
6. Art Style & Visual Direction
7. Audio & VFX
8. UI Screens (start, pause, game over, HUD)
9. Extra Features (power-ups, scoring, upgrades)
10. Game Summary (2-3 lines)

Be specific and detailed. Make it ready for a game developer to implement directly.`
          },
          {
            role: 'user',
            content: `Short game idea: ${shortIdea}\n\nExpand this into a complete, detailed game design description.`
          }
        ],
        temperature: 0.9,
        max_tokens: 4000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded, please try again later.', success: false }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Usage limit reached. Please add credits.', success: false }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      throw new Error('Failed to generate game description');
    }

    const data = await response.json();
    const gameDescription = data.choices?.[0]?.message?.content;

    if (!gameDescription) {
      throw new Error('No game description generated');
    }

    const suggestedTitle = shortIdea.split('.')[0].trim().slice(0, 50);

    console.log('Game description generated successfully');

    return new Response(
      JSON.stringify({ gameDescription, suggestedTitle, success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in imagine-game function:', error);
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to imagine game', success: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
