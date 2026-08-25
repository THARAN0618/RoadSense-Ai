import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || 'roadsense-uploads';

let cachedClient: SupabaseClient | null = null;
let cachedUrl: string | undefined = undefined;
let cachedKey: string | undefined = undefined;

export function getSupabaseClient(): SupabaseClient | null {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    cachedClient = null;
    cachedUrl = undefined;
    cachedKey = undefined;
    return null;
  }

  if (cachedClient && cachedUrl === supabaseUrl && cachedKey === supabaseServiceKey) {
    return cachedClient;
  }

  cachedUrl = supabaseUrl;
  cachedKey = supabaseServiceKey;
  cachedClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedClient;
}

// Export getter for backward compatibility
export const supabaseClient = getSupabaseClient();
