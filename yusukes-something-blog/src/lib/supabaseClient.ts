// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL or Service Key is not defined in environment variables.');
}

// サーバーサイド用のクライアント (Service Keyを使用)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);