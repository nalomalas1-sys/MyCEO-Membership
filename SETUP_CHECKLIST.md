# Subscription-First Signup Setup Checklist

Before using the subscription-first signup flow, you need to complete the following setup steps:

## ✅ Prerequisites

- [ ] Stripe account created (sign up at https://stripe.com)
- [ ] Supabase project created and running
- [ ] Node.js 18+ and pnpm installed

## 1. Stripe Setup

### Create Products & Prices in Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → **Products** → **Add Product**

2. Create three products with the following pricing:

   **Basic Plan:**
   - Name: Basic Plan
   - Description: 1 child account
   - Monthly: $9.99/month
   - Annual: $99.99/year
   - Copy the Price IDs (starts with `price_`)

   **Standard Plan:**
   - Name: Standard Plan
   - Description: Up to 5 child accounts
   - Monthly: $19.99/month
   - Annual: $199.99/year
   - Copy the Price IDs

   **Premium Plan:**
   - Name: Premium Plan
   - Description: Unlimited child accounts
   - Monthly: $29.99/month
   - Annual: $299.99/year
   - Copy the Price IDs

3. Get your Stripe API keys:
   - Go to **Developers** → **API keys**
   - Copy **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - Copy **Secret key** (starts with `sk_test_` or `sk_live_`)

## 2. Supabase Configuration

### Set Edge Function Secrets

1. Go to your Supabase Dashboard → **Settings** → **Edge Functions** → **Secrets**

2. Add the following secrets:

   ```
   STRIPE_SECRET_KEY=sk_test_... (your Stripe secret key)
   STRIPE_WEBHOOK_SECRET=whsec_... (you'll get this after setting up webhook)
   STRIPE_PRICE_BASIC_MONTHLY=price_... (from Stripe)
   STRIPE_PRICE_BASIC_ANNUAL=price_... (from Stripe)
   STRIPE_PRICE_STANDARD_MONTHLY=price_... (from Stripe)
   STRIPE_PRICE_STANDARD_ANNUAL=price_... (from Stripe)
   STRIPE_PRICE_PREMIUM_MONTHLY=price_... (from Stripe)
   STRIPE_PRICE_PREMIUM_ANNUAL=price_... (from Stripe)
   SITE_URL=http://localhost:5173 (for local dev) or https://your-domain.com (for production)
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (from Supabase Settings → API)
   SUPABASE_ANON_KEY=your-anon-key (from Supabase Settings → API)
   ```

   **Note:** You can get `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` from:
   - Supabase Dashboard → **Settings** → **API**

### Deploy Edge Functions

You have two options:

**Option A: Using Supabase CLI (Recommended)**
```bash
# Make sure you're logged in and linked to your project
supabase login
supabase link --project-ref your-project-ref

# Deploy the functions
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook --no-verify-jwt
```

**Option B: Using Supabase Dashboard**
1. Go to **Edge Functions** in your Supabase Dashboard
2. Click **Deploy function** or **Create function**
3. For `create-checkout-session`:
   - Copy code from `supabase/functions/create-checkout-session/index.ts`
   - Paste and deploy
4. For `stripe-webhook`:
   - Copy code from `supabase/functions/stripe-webhook/index.ts`
   - Paste and deploy
   - **IMPORTANT:** After deploying, disable JWT verification in the function settings (Stripe webhooks don't use JWT tokens)

## 3. Configure Stripe Webhook

1. Go to Stripe Dashboard → **Developers** → **Webhooks**

2. Click **Add endpoint**

3. Set the endpoint URL to:
   ```
   https://your-project-ref.supabase.co/functions/v1/stripe-webhook
   ```
   Replace `your-project-ref` with your actual Supabase project reference.

4. Select events to listen for:
   - ✅ `checkout.session.completed`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`

5. Click **Add endpoint**

6. Copy the **Signing secret** (starts with `whsec_`)

7. Add this secret to Supabase Edge Function secrets as `STRIPE_WEBHOOK_SECRET`

## 4. Frontend Environment Variables

Create or update `.env` file in `apps/web/`:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... (your Stripe publishable key)
```

**Note:** For production, use `pk_live_...` instead of `pk_test_...`

## 5. Database Migrations

Make sure all database migrations are applied:

1. Go to Supabase Dashboard → **SQL Editor**

2. Run migrations in order (if not already done):
   - `supabase/migrations/20240101000000_initial_schema.sql`
   - `supabase/migrations/20240101000001_rls_policies.sql`
   - `supabase/migrations/20240101000002_functions.sql`
   - `supabase/migrations/20240101000003_user_registration.sql`
   - (and any other migrations in order)

   Or use Supabase CLI:
   ```bash
   supabase db push
   ```

## 6. Test the Flow

### Local Testing

1. Start your development server:
   ```bash
   pnpm dev
   ```

2. Navigate to `/signup` in your browser

3. Fill out the signup form:
   - Email
   - Password
   - Full Name
   - Select a plan (Basic, Standard, or Premium)
   - Choose billing period (Monthly or Annual)

4. Click "Continue to Checkout"

5. Use Stripe test card:
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/34)
   - CVC: Any 3 digits (e.g., 123)
   - ZIP: Any 5 digits

6. Complete checkout

7. You should be redirected to `/signup-success` with a login form

8. Log in with your email and password

9. You should be redirected to the dashboard

### Verify Everything Works

- [ ] Checkout session is created successfully
- [ ] Payment processes with test card
- [ ] Webhook receives `checkout.session.completed` event
- [ ] User account is created in Supabase
- [ ] Parent record is created with subscription details
- [ ] Login form appears on success page
- [ ] User can log in and access dashboard

## Troubleshooting

### Checkout Session Not Created
- Verify `STRIPE_SECRET_KEY` is set in Supabase Edge Function secrets
- Check Edge Function logs in Supabase Dashboard
- Ensure price IDs match your Stripe products

### Webhook Not Working
- Verify webhook URL is correct in Stripe Dashboard
- Check `STRIPE_WEBHOOK_SECRET` matches the signing secret from Stripe
- Review webhook logs in Stripe Dashboard (should show events being received)
- Check Edge Function logs in Supabase Dashboard

### User Account Not Created
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set in Edge Function secrets
- Check webhook function logs for errors
- Ensure database triggers are set up (from migrations)

### Can't Log In After Signup
- Check that user was created in Supabase Auth
- Verify password was set correctly
- Check browser console for errors

### Email Not Confirmed Error
If you see "Email not confirmed" errors after subscribing:

**Root Cause:** Supabase Auth has email confirmation enabled, which requires users to confirm their email before logging in. However, for paid subscriptions, we auto-confirm emails via the webhook.

**Solution:**
1. Go to your **Supabase Dashboard** → **Authentication** → **Settings**
2. Scroll down to **Email Auth** section
3. Find **"Enable email confirmations"** setting
4. **Disable** this setting (toggle it off)
   - This allows the webhook to auto-confirm emails for paid signups
   - Users created via the webhook will be immediately confirmed
5. Save the changes

**Alternative (if you want to keep email confirmations enabled):**
- The webhook already sets `email_confirm: true` when creating users
- However, if email confirmations are required in settings, you may need to disable it
- Check the webhook logs in Supabase Dashboard to see if email confirmation is working

**Verify it's working:**
- After disabling email confirmations, test a new signup
- Check the webhook logs to see: `Email already confirmed for user: [user-id]`
- Users should be able to log in immediately after signup

## Production Checklist

Before going live:

- [ ] Switch Stripe to **Live mode**
- [ ] Update all environment variables with live keys:
  - `STRIPE_SECRET_KEY` → Live secret key (`sk_live_...`)
  - `VITE_STRIPE_PUBLISHABLE_KEY` → Live publishable key (`pk_live_...`)
- [ ] Update `SITE_URL` to your production domain
- [ ] Create new webhook endpoint for production URL
- [ ] Update `STRIPE_WEBHOOK_SECRET` with production webhook secret
- [ ] Redeploy Edge Functions
- [ ] Test the full flow in production mode

## Need Help?

- Check `docs/stripe-setup.md` for detailed Stripe setup instructions
- Review Edge Function logs in Supabase Dashboard
- Check Stripe webhook logs in Stripe Dashboard
- Verify all environment variables are set correctly






