export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** When Supabase keys are missing the app runs in demo mode: links live in this browser only. */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const isGoogleAuthEnabled = process.env.NEXT_PUBLIC_AUTH_GOOGLE === "true";
