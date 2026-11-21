import { ArrowRight, ClipboardPaste, FolderHeart, Zap } from "lucide-react";
import Link from "next/link";
import { Devices } from "@/components/landing/devices";
import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import { Nav } from "@/components/landing/nav";
import { PasteDemo } from "@/components/landing/paste-demo";
import { Reveal } from "@/components/landing/reveal";
import { Aurora } from "@/components/ui/aurora";
import { buttonClass } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { isSupabaseConfigured } from "@/lib/config";

const steps = [
  { icon: ClipboardPaste, title: "Paste", body: "Drop in any link: a YouTube video, a Google Doc, a PDF, an article. Or just press Ctrl/⌘ V on the page." },
  { icon: FolderHeart, title: "Organize", body: "It's sorted by type automatically. Add a collection, a few tags, or a note to your future self." },
  { icon: Zap, title: "Find it instantly", body: "Weeks later, type two letters and it's there, on whichever device you're holding." },
];

function SectionHeading({ eyebrow, title, body }: { eyebrow: string; title: React.ReactNode; body?: string }) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">{eyebrow}</p>
      <h2 className="mt-4 text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.03em]">{title}</h2>
      {body && <p className="mt-4 text-lg text-muted">{body}</p>}
    </Reveal>
  );
}

export default function Home() {
  const ctaHref = isSupabaseConfigured ? "/login" : "/app";
  const signInHref = isSupabaseConfigured ? "/login" : "/app";

  return (
    <div className="relative overflow-x-clip">
      <Aurora className="h-[120vh]" />
      <div className="grid-bg absolute inset-x-0 top-0 h-[110vh]" aria-hidden />
      <Nav ctaHref={ctaHref} signInHref={signInHref} />

      <main className="relative">
        <Hero ctaHref={ctaHref} />

        <section id="how" className="scroll-mt-24 px-5 py-24 sm:py-32">
          <SectionHeading
            eyebrow="How it works"
            title={
              <>
                Paste it. Stash it. Done.
              </>
            }
            body="No browser extension, no folders to set up first. Saving a link takes about two seconds."
          />
          <div className="mx-auto mt-14 grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <PasteDemo />
            </Reveal>
            <ol className="space-y-4">
              {steps.map((s, i) => (
                <Reveal key={s.title} delay={i * 0.1}>
                  <li className="glass glass-hover flex gap-4 rounded-[20px] p-5">
                    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/[0.07] text-text ring-1 ring-white/12">
                      <s.icon className="size-5" aria-hidden />
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold">
                        <span className="mr-2 font-mono text-sm text-subtle">0{i + 1}</span>
                        {s.title}
                      </h3>
                      <p className="mt-1 text-muted">{s.body}</p>
                    </div>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        <section id="features" className="scroll-mt-24 px-5 py-24 sm:py-32">
          <SectionHeading
            eyebrow="Features"
            title="Everything a link deserves"
            body="Thoughtful details that make saving fast and finding effortless."
          />
          <div className="mx-auto mt-14 max-w-6xl">
            <Features />
          </div>
        </section>

        <section id="devices" className="scroll-mt-24 overflow-hidden px-5 py-24 sm:py-32">
          <SectionHeading
            eyebrow="Every device"
            title={
              <>
                Phone, tablet, laptop. <br className="hidden sm:block" />
                <span>One stash.</span>
              </>
            }
            body="Designed mobile-first with big touch targets, swipe-to-close sheets and a layout that adapts to any screen."
          />
          <div className="mt-16">
            <Devices />
          </div>
        </section>

        <section className="px-5 pb-24 pt-8 sm:pb-32">
          <Reveal>
            <div className="glass relative mx-auto max-w-5xl overflow-hidden rounded-[20px] px-6 py-16 text-center sm:px-12 sm:py-24">
              <Aurora />
              <div className="grid-bg absolute inset-0" aria-hidden />
              <div className="relative">
                <h2 className="mx-auto max-w-3xl text-[clamp(2.25rem,6vw,4.5rem)] font-semibold leading-[1] tracking-[-0.035em]">
                  Stop losing the good stuff.
                </h2>
                <p className="mx-auto mt-5 max-w-lg text-lg text-muted">
                  Free to start. Your first link takes two seconds, and every one after that is just as easy to find.
                </p>
                <Link href={ctaHref} className={buttonClass("primary", "lg", "group mt-9")}>
                  Start your stash
                  <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="relative border-t border-line px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 sm:flex-row">
          <Logo />
          <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted">
            <a href="#features" className="hover:text-text">Features</a>
            <a href="#how" className="hover:text-text">How it works</a>
            <Link href={signInHref} className="hover:text-text">Sign in</Link>
          </nav>
          <p className="text-sm text-subtle">© 2026 Stash</p>
        </div>
      </footer>
    </div>
  );
}
