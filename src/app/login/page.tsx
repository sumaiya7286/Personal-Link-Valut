import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { Aurora } from "@/components/ui/aurora";
import { Logo } from "@/components/ui/logo";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <Aurora />
      <div className="grid-bg absolute inset-0" aria-hidden />
      <header className="relative z-10 flex items-center justify-between px-5 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-8">
        <Logo />
        <Link href="/" className="rounded-xl px-3 py-2 text-sm text-muted transition-colors hover:text-text">
          Back to home
        </Link>
      </header>
      <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-semibold sm:text-5xl">
              Welcome to <span className="text-gradient">Stash</span>
            </h1>
            <p className="mt-3 text-muted">Your links, synced on every device.</p>
          </div>
          <div className="glass rounded-[28px] bg-ink-900/60 p-6 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] sm:p-8">
            <AuthForm />
          </div>
        </div>
      </main>
    </div>
  );
}
