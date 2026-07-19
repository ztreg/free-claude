import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey } from '../config/supabase';

// Explicit auth options to ensure session persistence across reloads
// and automatic token refresh. These defaults help avoid users needing
// to sign in repeatedly when localStorage is available.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		persistSession: true,
		autoRefreshToken: true,
		detectSessionInUrl: false,
	},
});
