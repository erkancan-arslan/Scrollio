/**
 * useSupabase — Provides access to Supabase client from context/env.
 *
 * In the Kids module, all API calls go through the kidsApi client (which hits
 * the NestJS backend). Direct Supabase client access is rarely needed on the
 * frontend, but this hook is available for cases like real-time subscriptions.
 */

import { useMemo } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

let sharedClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null;
  }
  if (!sharedClient) {
    sharedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return sharedClient;
}

export const useSupabase = () => {
  const supabase = useMemo(() => getSupabaseClient(), []);
  return { supabase };
};
