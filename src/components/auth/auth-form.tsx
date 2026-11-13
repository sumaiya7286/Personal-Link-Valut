"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Eye, EyeOff, Loader2, Mail, MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, useSyncExternalStore } from "react";
import { Button, buttonClass } from "@/components/ui/button";
import { isGoogleAuthEnabled, isSupabaseConfigured } from "@/lib/config";
import { getSupabase } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

const field =
  "h-13 w-full rounded-2xl border border-line bg-white/[0.03] px-4 text-[15px] text-text outline-none transition-colors placeholder:text-subtle hover:border-line-strong focus:border-lime/60 focus:bg-white/[0.05]";

const friendly = (msg: string) => {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "That email and password don't match. Try again or use a sign-in link.";
  if (m.includes("already registered")) return "An account with this email already exists. Sign in instead.";
  if (m.includes("password should be")) return "Use at least 8 characters for your password.";
  if (m.includes("rate limit")) return "Too many attempts. Wait a minute and try again.";
  if (m.includes("email not confirmed")) return "Confirm your email first — check your inbox for the link.";
  return msg;
};

const useUrlError = () =>
  useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(window.location.search).get("error"),
    () => null,
  );

export function AuthForm() {
  const router = useRouter();
  const urlError = useUrlError();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState<null | "password" | "magic" | "google">(null);
  const [error, setError] = useState<{ field: "email" | "password" | "form"; msg: string } | null>(null);
  const [sent, setSent] = useState<null | "magic" | "confirm">(null);
  const ids = { email: useId(), password: useId() };

  const formError = error?.field === "form" ? error.msg : urlError === "link" && !error ? "That sign-in link has expired or was already used. Request a new one." : null;

  if (!isSupabaseConfigured) {
    return (
      <div className="space-y-5 text-center">
        <p className="text-muted">
          Accounts aren&apos;t connected yet. Add your Supabase keys to <code className="rounded bg-white/5 px-1.5 py-0.5 text-sm">.env.local</code> to turn on sign-in and cloud sync. You can try everything right now in demo mode.
        </p>
        <Link href="/app" className={buttonClass("primary", "lg", "w-full")}>
          Open the demo <ArrowRight className="size-5" aria-hidden />
        </Link>
      </div>
    );
  }

  const redirectTo = () => `${window.location.origin}/auth/callback?next=/app`;

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validEmail) return setError({ field: "email", msg: "Enter a valid email address." });
    if (password.length < 8) return setError({ field: "password", msg: "Use at least 8 characters." });
    const sb = getSupabase()!;
    setBusy("password");
    setError(null);
    const res =
      mode === "signin"
        ? await sb.auth.signInWithPassword({ email: email.trim(), password })
        : await sb.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: redirectTo() } });
    setBusy(null);
    if (res.error) return setError({ field: "form", msg: friendly(res.error.message) });
    if (mode === "signup" && !res.data.session) return setSent("confirm");
    router.replace("/app");
    router.refresh();
  };

  const magic = async () => {
    if (!validEmail) return setError({ field: "email", msg: "Enter your email first, then we'll send a link." });
    setBusy("magic");
    setError(null);
    const { error: err } = await getSupabase()!.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo() },
    });
    setBusy(null);
    if (err) return setError({ field: "form", msg: friendly(err.message) });
    setSent("magic");
  };

  const google = async () => {
    setBusy("google");
    const { error: err } = await getSupabase()!.auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectTo() } });
    if (err) {
      setBusy(null);
      setError({ field: "form", msg: friendly(err.message) });
    }
  };

  if (sent) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.1 }}
          className="mx-auto mb-5 grid size-16 place-items-center rounded-3xl bg-lime/10 text-lime ring-1 ring-lime/25"
        >
          <MailCheck className="size-8" aria-hidden />
        </motion.div>
        <h2 className="text-2xl font-semibold">Check your inbox</h2>
        <p className="mt-2 text-muted">
          We sent a {sent === "magic" ? "sign-in" : "confirmation"} link to <span className="text-text">{email}</span>. Open it on this device to continue.
        </p>
        <Button variant="ghost" className="mt-6" onClick={() => setSent(null)}>
          Use a different email
        </Button>
      </motion.div>
    );
  }

  return (
    <div>
      <div role="tablist" aria-label="Account" className="relative mb-6 grid grid-cols-2 rounded-2xl border border-line bg-white/[0.02] p-1">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            type="button"
            aria-selected={mode === m}
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={`relative h-11 rounded-xl text-sm font-medium transition-colors ${mode === m ? "text-text" : "text-subtle hover:text-muted"}`}
          >
            {mode === m && <motion.span layoutId="auth-tab" className="absolute inset-0 rounded-xl bg-white/[0.08] ring-1 ring-line-strong" />}
            <span className="relative">{m === "signin" ? "Sign in" : "Create account"}</span>
          </button>
        ))}
      </div>

      <form onSubmit={submit} noValidate className="space-y-4">
        <div>
          <label htmlFor={ids.email} className="mb-2 block text-sm font-medium text-muted">
            Email
          </label>
          <input
            id={ids.email}
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error?.field === "email") setError(null);
            }}
            placeholder="you@example.com"
            aria-invalid={error?.field === "email"}
            aria-describedby={error?.field === "email" ? `${ids.email}-err` : undefined}
            className={field}
          />
          {error?.field === "email" && (
            <p id={`${ids.email}-err`} role="alert" className="mt-2 text-sm text-danger">
              {error.msg}
            </p>
          )}
        </div>
        <div>
          <label htmlFor={ids.password} className="mb-2 block text-sm font-medium text-muted">
            Password
          </label>
          <div className="relative">
            <input
              id={ids.password}
              type={show ? "text" : "password"}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error?.field === "password") setError(null);
              }}
              placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
              aria-invalid={error?.field === "password"}
              aria-describedby={error?.field === "password" ? `${ids.password}-err` : undefined}
              className={`${field} pr-13`}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-1 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-xl text-subtle hover:text-text"
            >
              {show ? <EyeOff className="size-[18px]" aria-hidden /> : <Eye className="size-[18px]" aria-hidden />}
            </button>
          </div>
          {error?.field === "password" && (
            <p id={`${ids.password}-err`} role="alert" className="mt-2 text-sm text-danger">
              {error.msg}
            </p>
          )}
        </div>

        <AnimatePresence>
          {formError && (
            <motion.p
              role="alert"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger"
            >
              {formError}
            </motion.p>
          )}
        </AnimatePresence>

        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy !== null}>
          {busy === "password" ? <Loader2 className="size-5 animate-spin" aria-hidden /> : null}
          {mode === "signin" ? "Sign in" : "Create account"}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-widest text-subtle">
        <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
      </div>

      <div className="space-y-2.5">
        <Button size="lg" className="w-full" onClick={() => void magic()} disabled={busy !== null}>
          {busy === "magic" ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Mail className="size-5" aria-hidden />}
          Email me a sign-in link
        </Button>
        {isGoogleAuthEnabled && (
          <Button size="lg" className="w-full" onClick={() => void google()} disabled={busy !== null}>
            {busy === "google" ? (
              <Loader2 className="size-5 animate-spin" aria-hidden />
            ) : (
              <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
                <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.3 14.7 2.3 12 2.3 6.6 2.3 2.3 6.6 2.3 12S6.6 21.7 12 21.7c5.6 0 9.3-3.9 9.3-9.5 0-.6-.1-1.1-.2-1.6H12Z" />
              </svg>
            )}
            Continue with Google
          </Button>
        )}
      </div>
    </div>
  );
}
