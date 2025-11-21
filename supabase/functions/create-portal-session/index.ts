// Supabase Edge Function to create Stripe Customer Portal session
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

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
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Verify authentication
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
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get parent record with Stripe customer ID
    const { data: parent, error: parentError } = await supabaseClient
      .from('parents')
      .select('id, stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (parentError || !parent) {
      return new Response(
        JSON.stringify({ error: 'Parent record not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!parent.stripe_customer_id) {
      return new Response(
        JSON.stringify({ error: 'No Stripe customer ID found. Please subscribe first.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Get return URL from request or use default
    const { returnUrl } = await req.json().catch(() => ({}));
    const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:5173';
    const defaultReturnUrl = `${siteUrl}/settings`;

    // Create Customer Portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: parent.stripe_customer_id,
      return_url: returnUrl || defaultReturnUrl,
    });

    return new Response(
      JSON.stringify({
        url: portalSession.url,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating portal session:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});





