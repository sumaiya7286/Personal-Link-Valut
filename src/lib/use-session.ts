"use client";

import { useEffect, useState } from "react";
import { isSupabaseConfigured } from "./config";
import { getSupabase } from "./supabase/client";

export type Session =
  | { status: "loading" }
  | { status: "demo"; user: { id: string; email: string } }
  | { status: "signedIn"; user: { id: string; email: string } }
  | { status: "signedOut" };

export function useSession(): Session {
  const [session, setSession] = useState<Session>(() =>
    isSupabaseConfigured ? { status: "loading" } : { status: "demo", user: { id: "demo", email: "demo@stash.local" } },
  );

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    let active = true;
    sb.auth.getUser().then(({ data }) => {
      if (!active) return;
      setSession(
        data.user ? { status: "signedIn", user: { id: data.user.id, email: data.user.email ?? "" } } : { status: "signedOut" },
      );
    });
    const { data: sub } = sb.auth.onAuthStateChange((_event, s) => {
      setSession(
        s?.user ? { status: "signedIn", user: { id: s.user.id, email: s.user.email ?? "" } } : { status: "signedOut" },
      );
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return session;
}
