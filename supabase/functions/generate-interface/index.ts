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
    const { game_id, base } = await req.json();

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

    if (!game_id) {
      return new Response(
        JSON.stringify({ error: 'game_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Simple interface config schema we can evolve later
    const interfaceConfig = {
      version: 1,
      layout: {
        aspect: '9:16',
        hud: {
          score: { position: 'top-left' },
          lives: { position: 'top-right' },
        },
      },
      controls: {
        desktop: { left: 'ArrowLeft|A', right: 'ArrowRight|D', action: 'Space' },
        mobile: { buttons: [ { id: 'left', x: '25%', y: '90%' }, { id: 'right', x: '75%', y: '90%' } ] }
      },
      theme: {
        palette: base?.palette || 'neon-dark',
      },
    } as const;

    let updated = false;
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: req.headers.get('Authorization') || '' } },
      });
      // Store in control_mapping to reuse existing JSONB column; also echo to sound_effects placeholder
      const { error } = await supabase
        .from('games')
        .update({ control_mapping: interfaceConfig as unknown as Record<string, unknown> })
        .eq('id', game_id);
      updated = !error;
    }

    return new Response(
      JSON.stringify({ interface: interfaceConfig, updated }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-interface function:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    return new Response(
      JSON.stringify({ error: 'Unable to generate interface. Please try again later.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
