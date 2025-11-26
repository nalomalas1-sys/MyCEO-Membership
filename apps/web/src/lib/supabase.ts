import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '❌ Supabase environment variables are not set!\n' +
    'Please create a .env file in apps/web/ with:\n' +
    'VITE_SUPABASE_URL=your-supabase-project-url\n' +
    'VITE_SUPABASE_ANON_KEY=your-anon-key\n\n' +
    'Get these values from your Supabase Dashboard:\n' +
    '1. Go to https://app.supabase.com\n' +
    '2. Select your project\n' +
    '3. Go to Settings → API\n' +
    '4. Copy the Project URL and anon public key'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'Accept': 'application/json',
      // Note: Content-Type is set per-request by Supabase
      // For file uploads, it's set via the contentType option in storage.upload()
    },
  },
});


