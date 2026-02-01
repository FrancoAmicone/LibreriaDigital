import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('❌ Error: SUPABASE_URL or SUPABASE_ANON_KEY is missing. Check your Railway environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
