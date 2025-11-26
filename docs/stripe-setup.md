# Stripe Integration Setup Guide

This guide explains how to set up Stripe integration for the MyCEO LMS platform.

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. Access to your Supabase project dashboard
3. Your Stripe API keys

## Step 1: Create Stripe Products and Prices

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Products** → **Add Product**

### Create Three Products

#### Basic Plan
- **Name:** Basic Plan
- **Description:** 1 child account
- **Pricing:**
  - Monthly: $9.99/month
  - Annual: $99.99/year
- **Recurring:** Yes

#### Standard Plan
- **Name:** Standard Plan
- **Description:** Up to 5 child accounts
- **Pricing:**
  - Monthly: $19.99/month
  - Annual: $199.99/year
- **Recurring:** Yes

#### Premium Plan
- **Name:** Premium Plan
- **Description:** Unlimited child accounts
- **Pricing:**
  - Monthly: $29.99/month
  - Annual: $299.99/year
- **Recurring:** Yes

### Copy Price IDs

After creating each price, copy the **Price ID** (starts with `price_`). You'll need these for the next step.

## Step 2: Configure Supabase Environment Variables

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Edge Functions** → **Secrets**
3. Add the following secrets:

```
STRIPE_SECRET_KEY=sk_test_... (or sk_live_... for production)
STRIPE_WEBHOOK_SECRET=whsec_... (from webhook endpoint)
STRIPE_PRICE_BASIC_MONTHLY=price_...
STRIPE_PRICE_BASIC_ANNUAL=price_...
STRIPE_PRICE_STANDARD_MONTHLY=price_...
STRIPE_PRICE_STANDARD_ANNUAL=price_...
STRIPE_PRICE_PREMIUM_MONTHLY=price_...
STRIPE_PRICE_PREMIUM_ANNUAL=price_...
SITE_URL=https://your-domain.com (or http://localhost:5173 for local dev)
```

### Getting Your Stripe Keys

1. **Secret Key:** Go to **Developers** → **API keys** → Copy **Secret key**
2. **Publishable Key:** Copy **Publishable key** (for frontend)

### Getting Webhook Secret

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint** (or use existing)
3. Set endpoint URL to: `https://your-project-ref.supabase.co/functions/v1/stripe-webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the **Signing secret** (starts with `whsec_`)

## Step 3: Deploy Edge Functions

Deploy the Stripe-related Edge Functions to Supabase:

```bash
# Deploy checkout session creator
supabase functions deploy create-checkout-session

# Deploy webhook handler (IMPORTANT: --no-verify-jwt is required because Stripe webhooks don't use JWT tokens)
supabase functions deploy stripe-webhook --no-verify-jwt
```

Or use the Supabase Dashboard:
1. Go to **Edge Functions**
2. Click **Deploy function**
3. Upload or paste the function code from:
   - `supabase/functions/create-checkout-session/index.ts`
   - `supabase/functions/stripe-webhook/index.ts`
4. **IMPORTANT for `stripe-webhook`:** After deploying, go to the function settings and **disable JWT verification** (Stripe webhooks authenticate using signatures, not JWT tokens)

## Step 4: Configure Frontend Environment Variables

Add to your `.env` file in `apps/web/`:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... (or pk_live_... for production)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Step 5: Test the Integration

### Test Mode

1. Use Stripe test cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - 3D Secure: `4000 0025 0000 3155`
2. Use any future expiry date (e.g., 12/34)
3. Use any 3-digit CVC

### Test Flow

1. Sign up or log in as a parent
2. Navigate to `/pricing`
3. Select a plan
4. Complete checkout with test card
5. Verify subscription status updates in dashboard

## Step 6: Production Setup

When ready for production:

1. Switch to **Live mode** in Stripe Dashboard
2. Update environment variables with live keys:
   - `STRIPE_SECRET_KEY` → Live secret key
   - `VITE_STRIPE_PUBLISHABLE_KEY` → Live publishable key
3. Update webhook endpoint URL to production URL
4. Copy new webhook signing secret
5. Redeploy Edge Functions

## Troubleshooting

### Checkout Session Not Created

- Verify `STRIPE_SECRET_KEY` is set correctly
- Check Edge Function logs in Supabase Dashboard
- Ensure price IDs match your Stripe products

### Webhook Not Receiving Events

- Verify webhook URL is correct in Stripe Dashboard
- Check webhook secret matches `STRIPE_WEBHOOK_SECRET`
- Review webhook logs in Stripe Dashboard
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set (for webhook function)

### Subscription Status Not Updating

- Check webhook function logs
- Verify parent record exists with matching `stripe_customer_id`
- Ensure webhook events are being received (check Stripe Dashboard)

## Security Notes

- Never commit Stripe secret keys to version control
- Use environment variables for all sensitive keys
- Enable webhook signature verification (already implemented)
- Use HTTPS in production
- Regularly rotate API keys

## Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)






