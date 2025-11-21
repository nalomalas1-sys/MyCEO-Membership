// Supabase Edge Function to generate unique child access code
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate unique code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excludes O, 0, I, 1
    let code = '';
    let isUnique = false;

    while (!isUnique) {
      // Generate 6 character code
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      // Format as ABC-123
      code = code.slice(0, 3) + '-' + code.slice(3);
      code = code.toUpperCase();

      // Check if code exists
      const { data, error } = await supabaseClient
        .from('children')
        .select('id')
        .eq('access_code', code)
        .single();

      if (error && error.code === 'PGRST116') {
        // No rows found - code is unique
        isUnique = true;
      } else if (data) {
        // Code exists, generate new one
        code = '';
      } else {
        // Other error
        throw error;
      }
    }

    return new Response(
      JSON.stringify({ code }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});



