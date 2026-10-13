import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { Logo } from "@/components/Logo";
import { buttonClass } from "@/components/ui";
import { TOOLS } from "@/lib/tools";

const STEPS = [
  { title: "Find the idea", body: "Describe your niche and audience. Get 10 specific ideas with hooks built for the first two seconds." },
  { title: "Write the script", body: "Pick an idea and get a timed script with voiceover, on-screen text, an ending and a call to action." },
  { title: "Plan the shots", body: "Turn it into a shot list you can film on your phone — angles, transitions and editing notes included." },
];

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-1 sm:gap-2">
            {TOOLS.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className="hidden rounded-md px-3 py-1.5 text-sm text-muted transition-colors hover:text-foreground md:inline-block"
              >
                {t.short}
              </Link>
            ))}
            <Link href="/login" className={buttonClass("ghost", "h-9 px-3")}>
              Log in
            </Link>
            <Link href="/signup" className={buttonClass("primary", "h-9 px-3.5")}>
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:56px_56px] opacity-40 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]"
          />
          <div className="relative mx-auto max-w-3xl px-4 pb-20 pt-20 text-center sm:px-6 sm:pt-28">
            <span className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted shadow-sm">
              <span className="size-1.5 rounded-full bg-accent" />
              For Reels, TikTok and YouTube Shorts
            </span>
            <h1 className="mt-6 animate-fade-up text-4xl font-semibold tracking-tight text-foreground [animation-delay:60ms] sm:text-6xl">
              Plan your next video
              <br />
              <span className="text-muted">in minutes, not hours.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl animate-fade-up text-base leading-relaxed text-muted [animation-delay:120ms] sm:text-lg">
              CreatorKit turns your niche into video ideas, scripts and shot lists — specific to your audience and ready to film.
            </p>
            <div className="mt-9 flex animate-fade-up flex-col items-center justify-center gap-3 [animation-delay:180ms] sm:flex-row">
              <Link href="/signup" className={buttonClass("primary", "group h-11 w-full px-5 sm:w-auto")}>
                Create your account
                <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link href="/login" className={buttonClass("secondary", "h-11 w-full px-5 sm:w-auto")}>
                Log in
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted">All you need is an email and a password.</p>
          </div>
        </section>

        {/* Tools */}
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div className="grid gap-4 md:grid-cols-3">
            {TOOLS.map(({ href, name, description, Icon }) => (
              <Link
                key={href}
                href={href}
                className="group relative flex flex-col rounded-2xl border border-border bg-background p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-lg hover:shadow-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <div className="flex size-10 items-center justify-center rounded-xl border border-border bg-surface text-foreground transition-colors group-hover:border-accent/40 group-hover:text-accent">
                  <Icon className="size-5" />
                </div>
                <h2 className="mt-5 text-base font-semibold text-foreground">{name}</h2>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted">{description}</p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-foreground">
                  Open
                  <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="border-y border-border bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="max-w-xl">
              <p className="text-xs font-medium uppercase tracking-wider text-accent-fg">How it works</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">From blank page to shot list.</h2>
            </div>
            <ol className="mt-10 grid gap-8 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.title} className="relative">
                  <span className="font-mono text-xs text-muted">0{i + 1}</span>
                  <div className="mt-3 h-px w-full bg-border">
                    <div className="h-px w-10 bg-accent" />
                  </div>
                  <h3 className="mt-5 text-base font-semibold text-foreground">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-inverse px-6 py-10 text-inverse-fg sm:px-10 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Ready for your next video?</h2>
              <p className="mt-1.5 text-sm opacity-70">Create an account and get your first 10 ideas in under a minute.</p>
            </div>
            <Link
              href="/signup"
              className="group inline-flex h-11 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-medium text-white transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-inverse active:scale-[0.98]"
            >
              Get started
              <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-xs text-muted sm:flex-row sm:px-6">
          <Logo />
          <p>AI-generated content can be imperfect — review before you post.</p>
        </div>
      </footer>
    </div>
  );
}
