import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

// Initialize Supabase client
const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey);

// Log status (equivalent to testConnection)
if (env.supabaseUrl && env.supabaseAnonKey) {
  console.log(`✅ Supabase initialized for URL: ${env.supabaseUrl}`);
} else {
  console.error('❌ Supabase configuration missing!');
}

export { supabase as db };
