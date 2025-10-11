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
    const { prompt, options } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating game from prompt:', prompt);

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
            content: `You are a game code generator. Generate complete, playable HTML5 games based on user prompts.
            
Rules:
- Generate a COMPLETE, self-contained HTML file with inline CSS and JavaScript
- Game must be playable and fun (1-2 minutes duration)
- Include clear game instructions in the HTML
- Prefer realistic, high-quality visuals while keeping performance good. Use canvas/WebGL-like effects if possible within HTML/JS only (no external assets). Provide crisp animations and particles. Offer graceful fallback for low-power devices.
- Add score tracking and game over logic
- Make it mobile-friendly with touch controls
- Keep the total code under 500 lines
- Use vibrant colors and smooth animations

Return ONLY the complete HTML code, nothing else. No explanations, no markdown code blocks.`
          },
          {
            role: 'user',
            content: `Prompt: ${prompt}\n\nOptions: ${JSON.stringify(options || {})}`
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('Failed to generate game');
    }

    const data = await response.json();
    const gameCode = data.choices[0].message.content;

    console.log('Game generated successfully');

    return new Response(
      JSON.stringify({ gameCode }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    // Log detailed error server-side only
    console.error('Error in generate-game function:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    // Return generic error to client
    return new Response(
      JSON.stringify({ error: 'Unable to generate game. Please try again later.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});