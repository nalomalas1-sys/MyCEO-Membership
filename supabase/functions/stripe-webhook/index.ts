// Supabase Edge Function to handle Stripe webhooks
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
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
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'No signature provided' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET is not set');
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get the raw body for signature verification
    const body = await req.text();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response(
        JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize Supabase client with service role key for admin operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;

        if (!subscriptionId || !customerId) {
          console.error('Missing subscription or customer ID in checkout session');
          break;
        }

        // Retrieve the subscription to get full details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const metadata = subscription.metadata;
        const isNewSignup = metadata?.is_new_signup === 'true';

        // Check if this is a new signup
        if (isNewSignup) {
          const signupEmail = metadata?.signup_email || session.metadata?.signup_email;
          const signupPassword = metadata?.signup_password || session.metadata?.signup_password;
          const signupFullName = metadata?.signup_full_name || session.metadata?.signup_full_name;

          if (!signupEmail || !signupPassword || !signupFullName) {
            console.error('Missing signup data in metadata');
            break;
          }

          // Create user account using Supabase Admin API
          const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
            email: signupEmail,
            password: signupPassword,
            email_confirm: true, // Auto-confirm email for paid signups
            user_metadata: {
              full_name: signupFullName,
            },
          });

          if (authError || !authData.user) {
            console.error('Error creating user account:', authError);
            break;
          }

          // Ensure user record exists in public.users (triggers should create it, but fallback if needed)
          const { data: existingUser } = await supabaseClient
            .from('users')
            .select('id')
            .eq('id', authData.user.id)
            .single();

          if (!existingUser) {
            // Manually create user record if trigger didn't fire
            const { error: userInsertError } = await supabaseClient
              .from('users')
              .insert({
                id: authData.user.id,
                email: signupEmail,
                full_name: signupFullName,
                role: 'parent',
              });

            if (userInsertError) {
              console.error('Error creating user record:', userInsertError);
            } else {
              console.log('Manually created user record for:', authData.user.id);
            }
          }

          // Retry mechanism to find or create parent record
          let parent = null;
          let retries = 5;
          let parentError = null;

          while (retries > 0 && !parent) {
            // Try to find existing parent record
            const { data: parentData, error: findError } = await supabaseClient
              .from('parents')
              .select('id')
              .eq('user_id', authData.user.id)
              .single();

            if (parentData) {
              parent = parentData;
              break;
            }

            // If not found, try to create it manually
            if (findError && findError.code === 'PGRST116') {
              // Record doesn't exist, create it
              const { data: newParent, error: createError } = await supabaseClient
                .from('parents')
                .insert({
                  user_id: authData.user.id,
                  subscription_status: 'trialing',
                  trial_ends_at: subscription.trial_end
                    ? new Date(subscription.trial_end * 1000).toISOString()
                    : new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
                })
                .select('id')
                .single();

              if (newParent && !createError) {
                parent = newParent;
                console.log('Manually created parent record for user:', authData.user.id);
                break;
              } else {
                parentError = createError;
              }
            } else {
              parentError = findError;
            }

            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
            retries--;
          }

          if (!parent) {
            // Final attempt after longer wait (triggers might be slow)
            console.log('Parent record not found after initial retries, waiting longer...');
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const { data: finalParent, error: finalError } = await supabaseClient
              .from('parents')
              .select('id')
              .eq('user_id', authData.user.id)
              .single();

            if (finalParent) {
              parent = finalParent;
              console.log('Found parent record after extended wait');
            } else {
              // Last resort: try to create parent record directly
              console.log('Attempting final manual creation of parent record...');
              const { data: lastResortParent, error: lastResortError } = await supabaseClient
                .from('parents')
                .insert({
                  user_id: authData.user.id,
                  subscription_status: 'trialing',
                  trial_ends_at: subscription.trial_end
                    ? new Date(subscription.trial_end * 1000).toISOString()
                    : new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
                })
                .select('id')
                .single();

              if (lastResortParent) {
                parent = lastResortParent;
                console.log('Successfully created parent record as last resort');
              } else {
                console.error('CRITICAL: Failed to create parent record after all attempts:', lastResortError || finalError || parentError);
                // Still try to update by user_id as fallback
                const updateResult = await supabaseClient
                  .from('parents')
                  .update({
                    subscription_tier: metadata?.plan || 'standard',
                    subscription_status: subscription.status === 'trialing' ? 'trialing' : 'active',
                    stripe_customer_id: customerId,
                    trial_ends_at: subscription.trial_end
                      ? new Date(subscription.trial_end * 1000).toISOString()
                      : new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
                  })
                  .eq('user_id', authData.user.id);

                if (updateResult.error) {
                  console.error('CRITICAL: Failed to update parent record by user_id:', updateResult.error);
                } else {
                  console.log('Updated parent record by user_id as fallback');
                }
                break;
              }
            }
          }

          if (parent) {
            // Determine plan from metadata
            const plan = metadata?.plan || 'standard';
            const status = subscription.status === 'trialing' ? 'trialing' : 'active';
            const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null;

            // Update parent subscription
            const updateResult = await supabaseClient
              .from('parents')
              .update({
                subscription_tier: plan,
                subscription_status: status,
                stripe_customer_id: customerId,
                trial_ends_at: trialEnd,
              })
              .eq('id', parent.id);

            if (updateResult.error) {
              console.error('Error updating parent subscription:', updateResult.error);
            } else {
              console.log(`New user account created and subscription activated for parent ${parent.id}: ${plan} - ${status}`);
              
              // Send welcome email with login credentials
              try {
                await sendWelcomeEmail(signupEmail, signupPassword, signupFullName, plan);
              } catch (emailError) {
                console.error('Error sending welcome email:', emailError);
                // Don't fail the webhook if email fails
              }
            }
          }
        } else {
          // Existing user flow
          // Find parent by Stripe customer ID
          const { data: parent, error: parentError } = await supabaseClient
            .from('parents')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single();

          if (parentError || !parent) {
            console.error('Parent not found for customer:', customerId);
            break;
          }

          // Determine plan from metadata or price
          const plan = metadata?.plan || 'standard'; // Default to standard if not specified
          const status = subscription.status === 'trialing' ? 'trialing' : 'active';
          const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null;

          // Update parent subscription
          await supabaseClient
            .from('parents')
            .update({
              subscription_tier: plan,
              subscription_status: status,
              stripe_customer_id: customerId,
              trial_ends_at: trialEnd,
            })
            .eq('id', parent.id);

          console.log(`Subscription activated for parent ${parent.id}: ${plan} - ${status}`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const subscriptionId = invoice.subscription as string;

        if (!subscriptionId || !customerId) {
          break;
        }

        // Retrieve subscription
        const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
        const metadata = subscription.metadata;
        const plan = metadata?.plan || 'standard';

        // Find parent
        const { data: parent, error: parentError } = await supabaseClient
          .from('parents')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (parentError || !parent) {
          console.error('Parent not found for customer:', customerId);
          break;
        }

        // Update subscription status to active
        await supabaseClient
          .from('parents')
          .update({
            subscription_status: 'active',
            subscription_tier: plan,
          })
          .eq('id', parent.id);

        console.log(`Payment succeeded for parent ${parent.id}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        if (!customerId) {
          break;
        }

        // Find parent
        const { data: parent, error: parentError } = await supabaseClient
          .from('parents')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (parentError || !parent) {
          console.error('Parent not found for customer:', customerId);
          break;
        }

        // Update subscription status to past_due
        await supabaseClient
          .from('parents')
          .update({
            subscription_status: 'past_due',
          })
          .eq('id', parent.id);

        console.log(`Payment failed for parent ${parent.id}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const metadata = subscription.metadata;
        const plan = metadata?.plan || 'standard';
        const status = subscription.status;

        if (!customerId) {
          break;
        }

        // Map Stripe status to our status
        let subscriptionStatus: string;
        switch (status) {
          case 'active':
            subscriptionStatus = 'active';
            break;
          case 'trialing':
            subscriptionStatus = 'trialing';
            break;
          case 'past_due':
            subscriptionStatus = 'past_due';
            break;
          case 'canceled':
          case 'unpaid':
            subscriptionStatus = status;
            break;
          default:
            subscriptionStatus = 'active';
        }

        // Find parent
        const { data: parent, error: parentError } = await supabaseClient
          .from('parents')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (parentError || !parent) {
          console.error('Parent not found for customer:', customerId);
          break;
        }

        // Update subscription
        await supabaseClient
          .from('parents')
          .update({
            subscription_status: subscriptionStatus,
            subscription_tier: plan,
            trial_ends_at: subscription.trial_end
              ? new Date(subscription.trial_end * 1000).toISOString()
              : null,
          })
          .eq('id', parent.id);

        console.log(`Subscription updated for parent ${parent.id}: ${plan} - ${subscriptionStatus}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        if (!customerId) {
          break;
        }

        // Find parent
        const { data: parent, error: parentError } = await supabaseClient
          .from('parents')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (parentError || !parent) {
          console.error('Parent not found for customer:', customerId);
          break;
        }

        // Update subscription status to canceled
        await supabaseClient
          .from('parents')
          .update({
            subscription_status: 'canceled',
          })
          .eq('id', parent.id);

        console.log(`Subscription canceled for parent ${parent.id}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

