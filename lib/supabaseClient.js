// Server and client Supabase helper
// Requires: npm install @supabase/supabase-js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Will fail later if env not provided; keep import safe
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

export default supabase;
