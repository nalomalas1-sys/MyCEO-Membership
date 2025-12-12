// Supabase Edge Function to create Stripe checkout session
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Stripe price IDs - These should be set in your Stripe Dashboard and stored as environment variables
// For now, using placeholder values - replace with your actual Stripe price IDs
const STRIPE_PRICE_IDS: Record<string, { monthly: string; annual: string }> = {
  basic: {
    monthly: Deno.env.get('STRIPE_PRICE_BASIC_MONTHLY') || 'price_basic_monthly',
    annual: Deno.env.get('STRIPE_PRICE_BASIC_ANNUAL') || 'price_basic_annual',
  },
  standard: {
    monthly: Deno.env.get('STRIPE_PRICE_STANDARD_MONTHLY') || 'price_standard_monthly',
    annual: Deno.env.get('STRIPE_PRICE_STANDARD_ANNUAL') || 'price_standard_annual',
  },
  premium: {
    monthly: Deno.env.get('STRIPE_PRICE_PREMIUM_MONTHLY') || 'price_premium_monthly',
    annual: Deno.env.get('STRIPE_PRICE_PREMIUM_ANNUAL') || 'price_premium_annual',
  },
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
    // Parse request body
    const { plan, billingPeriod = 'monthly', successUrl, cancelUrl, userData } = await req.json();

    // Check if this is a new signup (with userData) or existing user
    let user: { id: string; email?: string | null } | null = null;
    let parent: { id: string; stripe_customer_id: string | null } | null = null;
    let stripeCustomerId: string | null = null;

    if (userData) {
      // New signup flow - user doesn't exist yet
      // We'll create the account in the webhook after payment
      // For now, just validate the data
      if (!userData.email || !userData.password || !userData.fullName) {
        return new Response(
          JSON.stringify({ error: 'Missing required user data' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      // Normalize email (trim and lowercase) to prevent login issues
      userData.email = userData.email.trim().toLowerCase();
    } else {
      // Existing user flow - verify authentication
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
        data: { user: authUser },
      } = await supabaseClient.auth.getUser();

      if (!authUser) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      user = authUser;

      if (!user) {
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Get parent record
      const { data: parentData } = await supabaseClient
        .from('parents')
        .select('id, stripe_customer_id')
        .eq('user_id', user.id)
        .single();

      if (!parentData) {
        return new Response(
          JSON.stringify({ error: 'Parent record not found' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      parent = parentData;
      if (!parent) {
        return new Response(
          JSON.stringify({ error: 'Parent record not found' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      stripeCustomerId = parent.stripe_customer_id;
    }

    if (!plan || !['basic', 'standard', 'premium'].includes(plan)) {
      return new Response(
        JSON.stringify({ error: 'Invalid plan. Must be basic, standard, or premium' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!['monthly', 'annual'].includes(billingPeriod)) {
      return new Response(
        JSON.stringify({ error: 'Invalid billing period. Must be monthly or annual' }),
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

    // Create or get Stripe customer
    if (!stripeCustomerId) {
      // Normalize email for existing users too
      const customerEmail = userData?.email || (user?.email ? user.email.trim().toLowerCase() : undefined);
      const customer = await stripe.customers.create({
        email: customerEmail,
        metadata: userData
          ? {
              // New signup - store user data in customer metadata (email already normalized)
              signup_email: userData.email,
              signup_password: userData.password, // Will be hashed in webhook
              signup_full_name: userData.fullName,
              is_new_signup: 'true',
            }
          : {
              // Existing user
              supabase_user_id: user?.id || '',
              parent_id: parent?.id || '',
              is_new_signup: 'false',
            },
      });

      stripeCustomerId = customer.id;

      // Update parent record if it exists
      if (parent) {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_ANON_KEY') ?? '',
          {
            global: {
              headers: { Authorization: req.headers.get('Authorization')! },
            },
          }
        );
        await supabaseClient
          .from('parents')
          .update({ stripe_customer_id: customer.id })
          .eq('id', parent.id);
      }
    }

    // Get the appropriate price ID
    const priceId = STRIPE_PRICE_IDS[plan][billingPeriod];

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      // Note: Removing locale setting to use Stripe's default (English)
      // Setting locale to 'auto' can cause module loading errors in some cases
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 1, // 1-day free trial
        metadata: {
          plan,
          billing_period: billingPeriod,
          ...(userData
            ? {
                // New signup - pass user data through subscription metadata
                signup_email: userData.email,
                signup_password: userData.password, // Will be hashed in webhook
                signup_full_name: userData.fullName,
                is_new_signup: 'true',
              }
            : {
                // Existing user
                parent_id: parent?.id || '',
                supabase_user_id: user?.id || '',
                is_new_signup: 'false',
              }),
        },
      },
      success_url: successUrl || `${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/signup-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/signup?canceled=true`,
      metadata: {
        ...(userData
          ? {
              signup_email: userData.email,
              signup_password: userData.password,
              signup_full_name: userData.fullName,
              is_new_signup: 'true',
            }
          : {
              parent_id: parent?.id || '',
              supabase_user_id: user?.id || '',
              is_new_signup: 'false',
            }),
        plan,
        billing_period: billingPeriod,
      },
    });

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

