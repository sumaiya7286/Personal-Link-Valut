"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { LogoMark } from "@/components/ui/logo";
import { createLocalStore } from "@/lib/store/local";
import { createSupabaseStore } from "@/lib/store/supabase";
import { getSupabase } from "@/lib/supabase/client";
import { useSession } from "@/lib/use-session";
import { Library } from "./library";

export function LibraryApp() {
  const session = useSession();
  const router = useRouter();
  const userId = session.status === "signedIn" ? session.user.id : null;

  const store = useMemo(() => {
    if (session.status === "demo") return createLocalStore();
    const sb = getSupabase();
    if (userId && sb) return createSupabaseStore(sb, userId);
    return null;
  }, [session.status, userId]);

  useEffect(() => {
    if (session.status === "signedOut") router.replace("/login");
  }, [session.status, router]);

  if (!store || (session.status !== "demo" && session.status !== "signedIn")) {
    return (
      <div className="grid min-h-dvh place-items-center" role="status" aria-label="Loading your library">
        <LogoMark className="size-12 animate-pulse" />
      </div>
    );
  }

  return (
    <Library
      key={userId ?? "demo"}
      store={store}
      email={session.user.email}
      onSignOut={async () => {
        await getSupabase()?.auth.signOut();
        router.replace("/");
        router.refresh();
      }}
    />
  );
}
