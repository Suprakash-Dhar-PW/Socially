import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

const supabaseUrl = env.supabase.url;
const supabaseKey = env.supabase.anonKey;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials missing!');
}

export const db = createClient(supabaseUrl, supabaseKey);

console.log(`✅ Supabase initialized for URL: ${supabaseUrl}`);
