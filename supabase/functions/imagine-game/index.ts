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
    const { shortIdea } = await req.json();
    
    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
    
    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not configured');
    }

    if (!shortIdea || !shortIdea.trim()) {
      throw new Error('Short idea is required');
    }

    console.log('Imagining game from short idea:', shortIdea);

    // Call Groq API to expand the short idea into a detailed game description
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are a professional game designer who expands short game ideas into complete, detailed game design documents.

Your task: Take a short game idea (1-2 sentences) and expand it into a comprehensive game description that includes:

1. **Game Genre & Core Concept**: What type of game is this? What's the main hook?

2. **Player Mechanics & Controls**:
   - How does the player move and interact?
   - What actions can they perform?
   - Mobile touch controls and desktop keyboard/mouse controls

3. **Environment & World Design**:
   - What does the game world look like?
   - What's the setting/theme?
   - Background elements and atmosphere

4. **Enemies, Obstacles & Challenges**:
   - What opposes the player?
   - How do they behave?
   - Difficulty progression

5. **Level Structure**:
   - Single level, multiple levels, or endless?
   - How does progression work?
   - What's the win/lose condition?

6. **Art Style & Visual Direction**:
   - Pixel art, cartoon, stylized, realistic?
   - Color palette and mood
   - Animation style

7. **Audio & VFX**:
   - Background music style
   - Sound effects needed
   - Particle effects and visual feedback

8. **UI Screens**:
   - Start menu
   - Pause menu
   - Game over screen
   - HUD elements

9. **Extra Features**:
   - Power-ups
   - Scoring system
   - Upgrades or unlockables
   - Special abilities

10. **Game Summary** (2-3 lines): A concise description of the complete game vision.

IMPORTANT:
- Think like a professional game designer
- Infer missing details intelligently based on the game type
- Be specific and detailed
- Avoid placeholders or generic descriptions
- Make it ready for a game engine to implement
- Focus on creating a polished, complete game experience

OUTPUT FORMAT:
Provide a well-structured, detailed game description that covers all aspects above. Write in clear paragraphs, not bullet points. Make it comprehensive enough that a game developer can implement it directly.`
          },
          {
            role: 'user',
            content: `Short game idea: ${shortIdea}

Expand this into a complete, detailed game design description covering all aspects: genre, mechanics, controls, environment, enemies, levels, art style, audio, UI, features, and a final summary.`
          }
        ],
        temperature: 0.9,
        max_tokens: 4000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', response.status, errorText);
      throw new Error('Failed to generate game description');
    }

    const data = await response.json();
    const gameDescription = data.choices?.[0]?.message?.content;

    if (!gameDescription) {
      throw new Error('No game description generated');
    }

    // Extract a suggested title from the description (first line or infer from idea)
    const suggestedTitle = shortIdea.split('.')[0].trim().slice(0, 50);

    console.log('Game description generated successfully');

    return new Response(
      JSON.stringify({ 
        gameDescription,
        suggestedTitle,
        success: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in imagine-game function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to imagine game',
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
