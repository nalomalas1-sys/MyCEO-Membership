// Supabase Edge Function to verify Stripe checkout session
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
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
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Parse request body safely
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { sessionId } = body;

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Session ID is required' }),
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

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });

    // Check if payment was successful
    if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
      return new Response(
        JSON.stringify({ error: 'Payment not completed' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get email from session metadata or customer
    let email = session.metadata?.signup_email;
    
    if (!email && session.customer) {
      const customer = await stripe.customers.retrieve(session.customer as string);
      if (typeof customer !== 'string' && !customer.deleted) {
        email = customer.email || customer.metadata?.signup_email;
      }
    }

    // Get subscription metadata if available
    const subscription = session.subscription;
    let subscriptionMetadata = null;
    if (subscription && typeof subscription === 'object' && 'metadata' in subscription) {
      subscriptionMetadata = subscription.metadata;
    }

    return new Response(
      JSON.stringify({
        success: true,
        email: email || subscriptionMetadata?.signup_email,
        isNewSignup: session.metadata?.is_new_signup === 'true' || subscriptionMetadata?.is_new_signup === 'true',
        customerId: session.customer,
        subscriptionId: subscription,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error verifying checkout session:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to verify checkout session' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});


