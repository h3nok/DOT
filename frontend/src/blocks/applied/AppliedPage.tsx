import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CircleDashed,
  Map,
} from "lucide-react";
import {
  openSeams,
  seamWork,
  type AppliedWork,
  type ClaimLevel,
  type OpenSeam,
} from "../../content/applied/openSeams";

/**
 * The applied layer — open seams first.
 *
 * ADR-0017 makes the applied layer the difference between a readership and a
 * movement, and makes negative results and open seams permanent first-class
 * citizens. The honest first content is therefore not a list of achievements
 * but the register of what the book owes.
 *
 * This surface is deliberately not built from the reader's typography. Canon
 * and commentary must be structurally separable, and a reader must never be
 * able to mistake a register entry for a sentence of Book One: the book is set
 * in a serif at reading measure, and this is set in the interface register,
 * closer to a ledger than to a page.
 */

const CLAIM_TONE: Record<ClaimLevel, string> = {
  Observation: "border-emerald-500/35 text-emerald-700 dark:text-emerald-300",
  Model: "border-sky-500/35 text-sky-700 dark:text-sky-300",
  Hypothesis: "border-amber-500/40 text-amber-700 dark:text-amber-300",
  Speculation: "border-rose-500/35 text-rose-700 dark:text-rose-300",
};

const OUTCOME_LABEL: Record<AppliedWork["outcome"], string> = {
  supported: "Supported",
  mixed: "Mixed",
  "not-supported": "Not supported",
  inconclusive: "Inconclusive",
  "in-progress": "In progress",
};

function ClaimChip({ level }: { level: ClaimLevel }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] ${CLAIM_TONE[level]}`}
      title={`Book One assigns this claim the level: ${level}`}
    >
      {level}
    </span>
  );
}

function Field({ label, children }: { label: string; children: string }) {
  return (
    <div className="mt-5">
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-foreground/85">
        {children}
      </p>
    </div>
  );
}

function RecordedWork({ seam }: { seam: OpenSeam }) {
  const work = seamWork(seam);

  if (work.length === 0) {
    return (
      <div className="mt-6 flex items-start gap-2.5 border-t border-border/50 pt-5">
        <CircleDashed
          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <p className="text-xs leading-relaxed text-muted-foreground">
          No work recorded against this seam yet. That is the current state of
          the register, not a gap in this page.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 border-t border-border/50 pt-5">
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
        Recorded work
      </p>
      {/* In recorded order. Never sorted or filtered by outcome. */}
      <ul className="mt-3 space-y-3">
        {work.map((entry) => (
          <li
            key={entry.id}
            className="border-l-2 border-[color:var(--organism-accent-soft)] py-1 pl-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <ClaimChip level={entry.claimLevel} />
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                {entry.kind} · {OUTCOME_LABEL[entry.outcome]}
              </span>
            </div>
            <p className="mt-2 text-sm font-medium text-foreground">
              {entry.title}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {entry.summary}
            </p>
            <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
              {entry.steward} · {entry.recordedAt}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Seam({ seam, index }: { seam: OpenSeam; index: number }) {
  return (
    <li id={seam.id} className="scroll-mt-24">
      <article className="grid gap-5 border-t border-border/70 py-9 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-8 sm:py-11">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Seam {String(index + 1).padStart(2, "0")}
          </span>
          <div className="mt-3">
            <ClaimChip level={seam.claimLevel} />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold leading-snug text-foreground sm:text-2xl">
            {seam.title}
          </h2>

          <Field label="Not established">{seam.notEstablished}</Field>
          {seam.alternative && (
            <Field label="The account this does not defeat">
              {seam.alternative}
            </Field>
          )}
          <Field label="What would settle it">{seam.wouldSettleIt}</Field>

          <Link
            to={seam.source.href}
            className="mt-5 inline-flex items-center gap-2 text-xs text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-[color:var(--organism-accent-strong)]"
          >
            Read the passage this comes from
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>

          <RecordedWork seam={seam} />
        </div>
      </article>
    </li>
  );
}

export default function AppliedPage() {
  const { hash } = useLocation();

  useEffect(() => {
    document.title = "Open Seams — Digital Organism Theory";
  }, []);

  // Each seam is meant to be citable on its own, and the app's route scroll
  // manager returns every navigation to the top. Without this, /applied#seam-id
  // lands on the register but not on the seam.
  useEffect(() => {
    if (!hash) return;
    const frame = window.requestAnimationFrame(() => {
      document
        .getElementById(hash.slice(1))
        ?.scrollIntoView({ block: "start", behavior: "auto" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [hash]);

  const recorded = openSeams.reduce(
    (total, seam) => total + seam.work.length,
    0,
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#applied-main"
        className="sr-only z-[60] rounded-md bg-background px-4 py-2 text-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to the register
      </a>

      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            DOT
          </Link>
          <nav aria-label="Applied context" className="flex items-center gap-1">
            <Link
              to="/book/digital-organism-theory"
              className="inline-flex min-h-9 items-center gap-2 rounded-md px-2.5 text-xs text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
            >
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Book One</span>
            </Link>
            <Link
              to="/doctrine"
              className="inline-flex min-h-9 items-center gap-2 rounded-md px-2.5 text-xs text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
            >
              <Map className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Concept Map</span>
            </Link>
          </nav>
        </div>
      </header>

      <main id="applied-main" className="mx-auto max-w-5xl px-5 pb-24 pt-12 sm:px-8 sm:pt-16">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          Open seams · Edition v2
        </p>
        <h1 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight tracking-[-0.02em] text-foreground sm:text-4xl">
          What Book One does not establish
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
          A framework that displays the places it is weakest can be argued with.
          One that hides them can only be believed or refused. This register
          lists what the book says it still owes — in its own words, with the
          claim level it currently carries and what would have to be shown to
          move it.
        </p>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Nothing here is a critic's framing. Every entry is drawn from a passage
          in the released edition and links back to it.
        </p>

        <dl className="mt-10 grid border-y border-border/70 sm:grid-cols-3 sm:divide-x sm:divide-border/70">
          {[
            ["Seams", String(openSeams.length)],
            ["Work recorded", String(recorded)],
            ["Edition", "v2 · line-edited"],
          ].map(([label, value]) => (
            <div key={label} className="border-b border-border/50 px-1 py-4 last:border-b-0 sm:border-b-0 sm:px-5 sm:first:pl-0 sm:last:pr-0">
              <dt className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                {label}
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <ol className="mt-14 border-b border-border/70">
          {openSeams.map((seam, index) => (
            <Seam key={seam.id} seam={seam} index={index} />
          ))}
        </ol>

        <section className="mt-14 border-t border-border/60 pt-8">
          <h2 className="text-lg font-semibold text-foreground">
            That is the whole register.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {openSeams.length} seams, all open. When work is recorded against
            one it appears beneath that seam with its claim level and its
            outcome — including outcomes that do not support the claim, which
            stay in the register permanently rather than being retired once they
            become inconvenient.
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Work is recorded by stewards, never ranked. There are no scores, no
            leaderboards, and no reputation attached to contribution here, and
            there will not be. The intake path for work from outside the project
            is not open yet; when it is, it will run through the same release
            pipeline as the book, with the same provenance and versioning.
          </p>
          <Link
            to="/doctrine/limits-and-debts"
            className="mt-6 inline-flex items-center gap-2 text-sm text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-[color:var(--organism-accent-strong)]"
          >
            See how the book states its limits in the concept map
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </section>
      </main>
    </div>
  );
}
