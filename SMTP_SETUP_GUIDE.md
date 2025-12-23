# Complete Setup Guide: Resend + Vercel + Supabase Auth

This guide will walk you through setting up **Resend** for email delivery, integrating it with **Supabase Auth**, and deploying your app on **Vercel** - all working together seamlessly.

---

## Table of Contents

1. [Overview: How They Work Together](#overview-how-they-work-together)
2. [Part 1: Setting Up Resend](#part-1-setting-up-resend)
3. [Part 2: Configuring Supabase Auth with Resend](#part-2-configuring-supabase-auth-with-resend)
4. [Part 3: Setting Up Vercel Deployment](#part-3-setting-up-vercel-deployment)
5. [Part 4: Configuring Your App](#part-4-configuring-your-app)
6. [Part 5: Testing Everything](#part-5-testing-everything)
7. [Troubleshooting](#troubleshooting)

---

## Overview: How They Work Together

Here's how the three services work together:

```
┌─────────────┐
│   Vercel    │  ← Your app is hosted here
│  (Frontend) │
└──────┬──────┘
       │
       │ User signs up/login
       ▼
┌─────────────┐
│  Supabase   │  ← Handles authentication
│    Auth     │
└──────┬──────┘
       │
       │ Sends auth emails via SMTP
       ▼
┌─────────────┐
│   Resend    │  ← Actually delivers the emails
│   (SMTP)    │
└─────────────┘
```

**Flow:**
1. User visits your app on **Vercel**
2. User signs up → Your app calls **Supabase Auth**
3. Supabase Auth sends confirmation email → Uses **Resend SMTP**
4. User clicks email link → Redirects back to your **Vercel** app
5. User is authenticated ✅

---

## Part 1: Setting Up Resend

### Step 1.1: Create a Resend Account

1. Go to **[https://resend.com](https://resend.com)**
2. Click **"Sign Up"** (or **"Get Started"**)
3. Sign up with:
   - Email address
   - Password
   - Or use GitHub/Google OAuth

### Step 1.2: Create a Project (Optional)

1. After logging in, you may be prompted to create a project
2. Enter a project name (e.g., **"MyCEO"**)
3. Click **"Create Project"**

### Step 1.3: Add and Verify Your Domain

**Why?** Using your own domain (instead of `onboarding@resend.dev`) improves email deliverability and looks professional.

1. In Resend dashboard, go to **"Domains"** (left sidebar)
2. Click **"Add Domain"**
3. Enter your domain (e.g., `myceo.app` or `app.myceo.com`)
   - ⚠️ **Important:** Use a domain you own and can modify DNS records for
4. Click **"Add Domain"**

### Step 1.4: Configure DNS Records

Resend will show you DNS records you need to add. You'll need to add these to your domain's DNS provider (Cloudflare, GoDaddy, Namecheap, etc.).

**Example DNS Records (your values will be different):**

```
Type: TXT
Name: @
Value: v=spf1 include:resend.com ~all

Type: TXT
Name: resend._domainkey
Value: [long DKIM string provided by Resend]

Type: CNAME
Name: resend
Value: [CNAME value provided by Resend]
```

**How to add DNS records:**

1. **If using Cloudflare:**
   - Go to Cloudflare Dashboard → Select your domain → **DNS** → **Records**
   - Click **"Add record"**
   - Enter each record type, name, and value
   - Click **"Save"**

2. **If using GoDaddy/Namecheap/Other:**
   - Go to your domain registrar's DNS management page
   - Add each record manually
   - Save changes

3. **Wait for verification:**
   - DNS changes can take 5 minutes to 48 hours (usually 5-30 minutes)
   - In Resend dashboard, you'll see status: **"Pending"** → **"Verified"**
   - ⚠️ **Don't proceed until domain shows "Verified"**

### Step 1.5: Get SMTP Credentials

Once your domain is verified:

1. In Resend dashboard, go to **"SMTP"** (or **"API Keys"** → look for SMTP section)
2. You'll see SMTP credentials:
   - **SMTP Host:** `smtp.resend.com`
   - **SMTP Port:** `587` (or `465` for SSL)
   - **SMTP Username:** Usually `resend` or a generated username
   - **SMTP Password:** Your Resend API key (starts with `re_...`)

   **OR** if Resend doesn't show SMTP directly:
   - Go to **"API Keys"**
   - Create a new API key (if you don't have one)
   - Copy the API key (this is your SMTP password)
   - Username is usually `resend`

3. **Save these credentials** - you'll need them in the next section:
   ```
   SMTP Host: smtp.resend.com
   SMTP Port: 587
   SMTP Username: resend
   SMTP Password: re_xxxxxxxxxxxxx
   ```

### Step 1.6: Choose Your Sender Email

Decide what email address you want to send from:
- Example: `no-reply@myceo.app`
- Example: `noreply@myceo.app`
- Example: `hello@myceo.app`

⚠️ **Important:** The domain part (`@myceo.app`) must match the domain you verified in Resend.

---

## Part 2: Configuring Supabase Auth with Resend

### Step 2.1: Open Supabase Dashboard

1. Go to **[https://app.supabase.com](https://app.supabase.com)**
2. Log in to your account
3. Select your **MyCEO** project (or create one if you haven't)

### Step 2.2: Navigate to SMTP Settings

1. In the left sidebar, click **"Settings"** (gear icon)
2. Click **"Auth"** (under Settings)
3. Scroll down to find **"SMTP Settings"** section

### Step 2.3: Enable Custom SMTP

1. Find the toggle **"Enable Custom SMTP"** (or **"Custom SMTP"**)
2. Toggle it **ON**

### Step 2.4: Fill in Resend SMTP Credentials

Enter the values from **Step 1.5**:

```
SMTP Host: smtp.resend.com
SMTP Port: 587
SMTP User: resend
SMTP Password: [Your Resend API key from Step 1.5]
Sender Email: no-reply@myceo.app (or your chosen email from Step 1.6)
Sender Name: MyCEO (or your app name)
```

**Detailed fields:**

- **SMTP Host:** `smtp.resend.com`
- **SMTP Port:** `587` (use `465` if `587` doesn't work)
- **SMTP User:** `resend` (or the username Resend provided)
- **SMTP Password:** Your Resend API key (e.g., `re_xxxxxxxxxxxxx`)
- **Sender Email:** `no-reply@myceo.app` (must match your verified domain)
- **Sender Name:** `MyCEO` (this appears as the sender name in emails)

### Step 2.5: Save SMTP Settings

1. Click **"Save"** or **"Update Settings"** button
2. Wait for confirmation message: **"SMTP settings updated successfully"**

### Step 2.6: Enable Email Confirmations

1. Still in **Settings → Auth**, scroll to **"Email Auth"** section
2. Find **"Enable email confirmations"**
3. Toggle it **ON** (if not already enabled)
4. Click **"Save"**

**What this does:**
- Users must click a confirmation link in their email before they can log in
- This is a security best practice

### Step 2.7: Configure Auth URLs

1. Still in **Settings → Auth**, scroll to **"URL Configuration"**
2. Set **"Site URL":**
   - For **local development:** `http://localhost:5173` (or your Vite dev port)
   - For **production:** `https://your-app.vercel.app` (or your custom domain)
3. Add **"Redirect URLs":**
   - `http://localhost:5173/**` (for local dev)
   - `https://your-app.vercel.app/**` (for production)
   - `https://yourdomain.com/**` (if using custom domain)

**Example:**
```
Site URL: https://myceo.vercel.app

Redirect URLs:
- http://localhost:5173/**
- https://myceo.vercel.app/**
- https://myceo.app/**
```

4. Click **"Save"**

---

## Part 3: Setting Up Vercel Deployment

### Step 3.1: Prepare Your Project for Vercel

Make sure your project is ready:

1. **Check your `package.json`** has a build script:
   ```json
   {
     "scripts": {
       "build": "vite build"
     }
   }
   ```

2. **Check your `vite.config.ts`** has proper configuration:
   ```typescript
   export default defineConfig({
     build: {
       outDir: 'dist',
     },
   })
   ```

3. **Commit your code to Git:**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

### Step 3.2: Connect Project to Vercel

1. Go to **[https://vercel.com](https://vercel.com)**
2. Sign up or log in (use GitHub if your code is on GitHub)
3. Click **"Add New..."** → **"Project"**
4. Import your repository:
   - If using GitHub: Select your repository
   - If using GitLab/Bitbucket: Connect that service first
5. Click **"Import"**

### Step 3.3: Configure Vercel Project Settings

1. **Project Name:** Keep default or change to `myceo` (or your preference)
2. **Framework Preset:** Select **"Vite"** (Vercel should auto-detect)
3. **Root Directory:** 
   - If your app is in `apps/web/`, set to `apps/web`
   - Otherwise, leave as root `.`
4. **Build Command:** `pnpm build` (or `npm run build` if using npm)
5. **Output Directory:** `dist` (Vite's default output)

### Step 3.4: Add Environment Variables in Vercel

1. In Vercel project settings, go to **"Environment Variables"**
2. Add these variables:

   **For Production:**
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

   **For Preview/Development:**
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

   **How to get Supabase values:**
   - Go to Supabase Dashboard → **Settings → API**
   - Copy **"Project URL"** → This is `VITE_SUPABASE_URL`
   - Copy **"anon public"** key → This is `VITE_SUPABASE_ANON_KEY`

3. Click **"Save"** for each environment variable

### Step 3.5: Deploy

1. Click **"Deploy"** button
2. Wait for build to complete (usually 1-3 minutes)
3. Once deployed, you'll get a URL like: `https://myceo-xyz123.vercel.app`

### Step 3.6: Update Supabase Auth URLs (Again)

Now that you have your Vercel URL:

1. Go back to Supabase Dashboard → **Settings → Auth → URL Configuration**
2. Update **"Site URL"** to your Vercel URL:
   ```
   Site URL: https://myceo-xyz123.vercel.app
   ```
3. Add your Vercel URL to **"Redirect URLs"**:
   ```
   https://myceo-xyz123.vercel.app/**
   ```
4. Click **"Save"**

### Step 3.7: (Optional) Add Custom Domain

If you have a custom domain:

1. In Vercel project, go to **"Settings" → "Domains"**
2. Click **"Add Domain"**
3. Enter your domain (e.g., `myceo.app`)
4. Follow Vercel's instructions to add DNS records
5. Wait for domain to be verified
6. Update Supabase Auth URLs again with your custom domain

---

## Part 4: Configuring Your App

### Step 4.1: Verify Environment Variables

Make sure your `.env` file (for local development) has:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Location:** `apps/web/.env` (or `.env.local`)

### Step 4.2: Check Supabase Client Configuration

Your Supabase client should already be configured (in `apps/web/src/lib/supabase.ts`):

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
```

✅ This should already be correct - no changes needed.

### Step 4.3: Implement Auth Callback Handler

When users click the confirmation email link, Supabase redirects them back to your app. You need to handle this callback.

**Create or update `apps/web/src/pages/auth/callback.tsx` (or similar):**

```typescript
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Get the hash fragment from URL (Supabase adds #access_token=...)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const error = hashParams.get('error');

      if (error) {
        console.error('Auth error:', error);
        navigate('/login?error=' + encodeURIComponent(error));
        return;
      }

      if (accessToken) {
        // Supabase client will automatically handle the session
        // Just redirect to dashboard or home
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p>Verifying your email...</p>
        <p className="text-sm text-gray-500 mt-2">Please wait...</p>
      </div>
    </div>
  );
}
```

**Add route in your router (e.g., `apps/web/src/App.tsx` or router config):**

```typescript
import { AuthCallback } from './pages/auth/callback';

// In your routes:
<Route path="/auth/callback" element={<AuthCallback />} />
```

### Step 4.4: Update Signup Flow (If Needed)

Your signup form should call Supabase Auth:

```typescript
const { data, error } = await supabase.auth.signUp({
  email: email,
  password: password,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
  },
});
```

✅ This should already be in your `SignupForm.tsx` - verify it includes `emailRedirectTo`.

---

## Part 5: Testing Everything

### Step 5.1: Test Locally

1. **Start your dev server:**
   ```bash
   cd apps/web
   pnpm dev
   ```

2. **Test signup:**
   - Go to `http://localhost:5173/signup`
   - Enter a test email (use a real email you can access)
   - Enter a password
   - Click "Sign Up"

3. **Check for confirmation email:**
   - Check your email inbox
   - Check spam folder
   - You should receive an email from `no-reply@myceo.app` (or your sender email)
   - Subject: "Confirm your signup" (or similar)

4. **Click the confirmation link:**
   - Should redirect to `http://localhost:5173/auth/callback`
   - Then redirect to your dashboard/home
   - You should be logged in ✅

### Step 5.2: Test on Vercel

1. **Deploy to Vercel** (if not already deployed):
   - Push code to Git
   - Vercel will auto-deploy (if auto-deploy is enabled)
   - Or manually trigger deploy in Vercel dashboard

2. **Test signup on production:**
   - Go to `https://your-app.vercel.app/signup`
   - Sign up with a different test email
   - Check email inbox
   - Click confirmation link
   - Should redirect to your Vercel app ✅

### Step 5.3: Check Logs

**If something doesn't work:**

1. **Supabase Auth Logs:**
   - Go to Supabase Dashboard → **Logs → Auth Logs**
   - Look for errors related to email sending

2. **Resend Logs:**
   - Go to Resend Dashboard → **Logs** (or **Emails**)
   - See if emails were sent successfully
   - Check for bounce/spam reports

3. **Vercel Logs:**
   - Go to Vercel Dashboard → Your Project → **Deployments** → Click latest deployment → **Logs**
   - Check for build/runtime errors

---

## Troubleshooting

### Problem: "Error sending confirmation email" (500 error)

**Causes:**
- SMTP not configured in Supabase
- Wrong SMTP credentials
- Domain not verified in Resend

**Solutions:**
1. ✅ Verify SMTP is enabled in Supabase Dashboard → Settings → Auth → SMTP Settings
2. ✅ Double-check SMTP credentials match Resend dashboard
3. ✅ Ensure domain is "Verified" in Resend (not "Pending")
4. ✅ Test SMTP connection (some providers offer test tools)

### Problem: Emails go to spam

**Causes:**
- Domain not verified
- Missing SPF/DKIM records
- Using `onboarding@resend.dev` instead of custom domain

**Solutions:**
1. ✅ Use your own verified domain (not Resend's default)
2. ✅ Ensure all DNS records are added correctly
3. ✅ Wait 24-48 hours for DNS propagation
4. ✅ Check Resend dashboard for domain verification status

### Problem: Confirmation link doesn't work

**Causes:**
- Wrong redirect URL in Supabase
- Callback route not implemented
- Site URL mismatch

**Solutions:**
1. ✅ Check Supabase → Settings → Auth → URL Configuration
   - Site URL should match your Vercel URL
   - Redirect URLs should include your Vercel URL with `/**`
2. ✅ Verify callback route exists: `/auth/callback`
3. ✅ Check browser console for errors when clicking link

### Problem: "Invalid redirect URL"

**Causes:**
- Redirect URL not in Supabase's allowed list
- URL mismatch (http vs https, trailing slash, etc.)

**Solutions:**
1. ✅ Add exact redirect URL to Supabase → Settings → Auth → Redirect URLs
2. ✅ Use wildcard: `https://your-app.vercel.app/**`
3. ✅ Ensure `emailRedirectTo` in signup matches allowed URLs

### Problem: Build fails on Vercel

**Causes:**
- Missing environment variables
- Build command incorrect
- Type errors

**Solutions:**
1. ✅ Check Vercel → Settings → Environment Variables
2. ✅ Verify build command: `pnpm build` (or `npm run build`)
3. ✅ Check Vercel build logs for specific errors
4. ✅ Test build locally: `pnpm build`

### Problem: Can't find SMTP settings in Resend

**Solutions:**
1. ✅ Look for **"API Keys"** section instead
2. ✅ Create an API key - this is your SMTP password
3. ✅ Username is usually `resend`
4. ✅ Check Resend documentation for latest SMTP setup

---

## Quick Reference Checklist

Use this checklist to verify everything is set up:

- [ ] Resend account created
- [ ] Domain added to Resend
- [ ] DNS records added to domain provider
- [ ] Domain verified in Resend (status: "Verified")
- [ ] SMTP credentials copied from Resend
- [ ] Supabase SMTP settings configured
- [ ] Supabase email confirmations enabled
- [ ] Supabase Site URL set to Vercel URL
- [ ] Supabase Redirect URLs include Vercel URL
- [ ] Project deployed to Vercel
- [ ] Environment variables added in Vercel
- [ ] Auth callback route implemented
- [ ] Tested signup locally ✅
- [ ] Tested signup on Vercel ✅
- [ ] Confirmation emails received ✅
- [ ] Confirmation links work ✅

---

## Additional Resources

- **Resend Documentation:** [https://resend.com/docs](https://resend.com/docs)
- **Supabase Auth Docs:** [https://supabase.com/docs/guides/auth](https://supabase.com/docs/guides/auth)
- **Vercel Deployment Guide:** [https://vercel.com/docs](https://vercel.com/docs)
- **Resend SMTP Setup:** [https://resend.com/docs/send-with-smtp](https://resend.com/docs/send-with-smtp)

---

## Need Help?

If you're still stuck:

1. **Check the logs:**
   - Supabase → Logs → Auth Logs
   - Resend → Logs
   - Vercel → Deployments → Logs

2. **Verify each step:**
   - Go through this guide step-by-step
   - Double-check all credentials and URLs

3. **Common mistakes:**
   - Domain not verified (most common)
   - Wrong SMTP password (using wrong API key)
   - Redirect URL not in allowed list
   - Environment variables not set in Vercel

---

**🎉 Congratulations!** Once everything is working, your users will receive beautiful, professional confirmation emails sent via Resend, authenticated through Supabase, and hosted on Vercel!
