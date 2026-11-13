import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createSupabaseServer } from "@/lib/supabase/server";

/** Handles email-confirmation, magic-link and OAuth redirects from Supabase. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/app";

  if (isSupabaseConfigured && code) {
    const sb = await createSupabaseServer();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${safeNext}`);
  }
  return NextResponse.redirect(`${origin}/login?error=link`);
}
