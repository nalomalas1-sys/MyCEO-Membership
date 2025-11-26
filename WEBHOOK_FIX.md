# Fix: Stripe Webhook 401 Errors

## Problem
The Stripe webhook is returning 401 errors because the Edge Function has JWT verification enabled. Stripe webhooks don't send JWT tokens - they use Stripe signature verification instead.

## Solution: Disable JWT Verification

You need to redeploy the `stripe-webhook` function with JWT verification disabled.

### Option 1: Using Supabase CLI (Recommended)

1. Install Supabase CLI if you haven't already:
   ```bash
   npm install -g supabase
   ```

2. Login and link your project:
   ```bash
   supabase login
   supabase link --project-ref your-project-ref
   ```

3. Redeploy the webhook function with JWT verification disabled:
   ```bash
   supabase functions deploy stripe-webhook --no-verify-jwt
   ```

### Option 2: Using Supabase Dashboard

1. Go to your Supabase Dashboard → **Edge Functions**
2. Find the `stripe-webhook` function
3. Click on it to open the function details
4. Look for **Settings** or **Configuration**
5. Find the **JWT Verification** toggle and **disable it**
6. Save the changes

**Note:** The exact location of this setting may vary. If you can't find it in the dashboard, use Option 1 (CLI method).

## Verify the Fix

After redeploying, check the webhook logs:
1. Go to Supabase Dashboard → **Edge Functions** → `stripe-webhook` → **Logs**
2. Trigger a test checkout
3. You should see 200 status codes instead of 401 errors
4. The webhook should successfully create user accounts

## Why This Happens

- Supabase Edge Functions have JWT verification enabled by default
- This works for authenticated API calls from your frontend
- But Stripe webhooks authenticate using the `stripe-signature` header, not JWT tokens
- The webhook function verifies Stripe signatures in its code (line 76), so JWT verification is not needed


