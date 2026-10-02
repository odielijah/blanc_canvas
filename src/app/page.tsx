import Link from "next/link";
import LoadingLink from "./LoadingLink";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[var(--app-bg)] text-[var(--text)]">
      <section className="landing-shell relative mx-auto flex min-h-screen w-full max-w-[1400px] flex-col px-5 py-5 sm:px-8 lg:px-10">
        <div
          aria-hidden="true"
          className="landing-loader"
        >
          <span>Blanc.</span>
        </div>

        <header className="landing-reveal flex items-center justify-between">
          <Link
            href="/"
            aria-label="Go to home page"
            className="brand-blanc text-4xl leading-none text-[var(--accent-strong)] transition-transform duration-300 hover:scale-105 sm:text-5xl"
          >
            Blanc.
          </Link>
        </header>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(20rem,0.55fr)]">
          <div className="max-w-3xl">
            <p className="landing-reveal mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)] [animation-delay:980ms]">
              Visual query builder
            </p>
            <h1 className="landing-reveal max-w-2xl text-5xl font-semibold leading-[0.95] text-[var(--text)] [animation-delay:1060ms] sm:text-6xl lg:text-8xl">
              Build{" "}
              <span className="font-[var(--font-yellowtail)] text-[var(--accent-strong)]">
                precise filters
              </span>{" "}
              without writing query syntax.
            </h1>
            <p className="landing-reveal mt-6 max-w-xl text-base leading-7 text-[var(--text-soft)] [animation-delay:1140ms] sm:text-lg">
              Compose nested rules, preview generated logic, and inspect matching
              results in one focused workspace.
            </p>
          </div>

          <div
            aria-hidden="true"
            className="landing-panel relative min-h-[22rem] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-2xl shadow-black/20"
          >
            <div className="grid h-full grid-rows-[auto_1fr_auto] gap-4">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                <div className="h-3 w-24 bg-[var(--accent)]" />
                <div className="flex gap-2">
                  <div className="h-3 w-3 bg-[var(--mint)]" />
                  <div className="h-3 w-3 bg-[var(--surface-subtle)]" />
                  <div className="h-3 w-3 bg-[var(--accent-strong)]" />
                </div>
              </div>

              <div className="grid gap-3">
                <div className="border border-[var(--border)] bg-[var(--surface-raised)] p-3">
                  <div className="mb-3 h-2 w-16 bg-[var(--text-muted)]" />
                  <div className="grid grid-cols-[1fr_0.65fr] gap-2">
                    <div className="h-9 bg-[var(--input-bg)]" />
                    <div className="h-9 bg-[var(--accent-soft)]" />
                  </div>
                </div>
                <div className="border border-[var(--border)] bg-[var(--surface-raised)] p-3">
                  <div className="mb-3 h-2 w-20 bg-[var(--text-muted)]" />
                  <div className="grid grid-cols-3 gap-2">
                    <div className="h-9 bg-[var(--input-bg)]" />
                    <div className="h-9 bg-[var(--input-bg)]" />
                    <div className="h-9 bg-[var(--accent-soft)]" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[0.7fr_1fr] gap-3">
                <div className="h-16 bg-[var(--mint)]" />
                <div className="h-16 border border-[var(--border)] bg-[var(--control-bg)]" />
              </div>
            </div>
          </div>
        </div>

        <div className="landing-reveal flex justify-end pb-2 [animation-delay:1220ms]">
          <LoadingLink
            href="/builder"
            className="accent-button inline-flex h-12 min-w-32 items-center justify-center px-7 text-sm font-semibold uppercase tracking-[0.14em] transition"
          >
            Start
          </LoadingLink>
        </div>
      </section>
    </main>
  );
}
