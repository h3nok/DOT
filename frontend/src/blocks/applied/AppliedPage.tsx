import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  CircleDashed,
  Map,
} from "lucide-react";
import { PageHeader, PageShell } from "../../shared/PageShell";
import { SiteColophon } from "../../shared/SiteColophon";
import { EpistemicBadge, type EpistemicStatus } from "../../shared/EpistemicBadge";
import {
  OPEN_SEAMS_EDITION,
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

const CLAIM_STATUS: Record<ClaimLevel, EpistemicStatus> = {
  Observation: "observation",
  "External model": "model",
  "DOT derivation": "hypothesis",
  "Speculative extension": "speculation",
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
    <EpistemicBadge
      status={CLAIM_STATUS[level]}
      title={`Book One assigns this claim the level: ${level}`}
    >
      {level}
    </EpistemicBadge>
  );
}

function Field({ label, children }: { label: string; children: string }) {
  return (
    <div className="mt-5">
      <p className="dot-label">
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
          No work recorded yet.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 border-t border-border/50 pt-5">
      <p className="dot-label">
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
              <span className="dot-label">
                {entry.kind} · {OUTCOME_LABEL[entry.outcome]}
              </span>
            </div>
            <p className="mt-2 text-sm font-medium text-foreground">
              {entry.title}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {entry.summary}
            </p>
            <p className="mt-2 dot-label">
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
    <motion.li
      id={seam.id}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
      className="scroll-mt-24"
    >
      <article className="grid gap-5 border-t border-border/70 py-9 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-8 sm:py-11">
        <div>
          <span className="dot-label">
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
          {seam.accountToRecover && (
            <Field label="Established account DOT must recover">
              {seam.accountToRecover}
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
    </motion.li>
  );
}

export default function AppliedPage() {
  // Each seam is citable on its own; the app's route scroll manager lands
  // /applied#seam-id on the seam rather than the top of the register.
  useEffect(() => {
    document.title = "Open Questions — Digital Organism Theory";
  }, []);

  const recorded = openSeams.reduce(
    (total, seam) => total + seam.work.length,
    0,
  );

  return (
    <PageShell
      skipLink={false}
      footer={<SiteColophon />}
      header={
        <>
          <a
            href="#applied-main"
            className="sr-only z-[60] rounded-md bg-background px-4 py-2 text-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
          >
            Skip to the register
          </a>
          <PageHeader
            right={
              <>
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
              </>
            }
          />
        </>
      }
    >
      <div id="applied-main">
        <p className="dot-label">Open seams · Edition v{OPEN_SEAMS_EDITION}</p>
        <h1 className="dot-page-heading mt-4 max-w-2xl">
          Open questions
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
          What Book One does not establish, in its own words, with the claim
          level each carries and what would settle it.
        </p>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Every entry is drawn from a passage in the released edition and links
          to it.
        </p>

        <dl className="mt-10 grid border-y border-border/70 sm:grid-cols-3 sm:divide-x sm:divide-border/70">
          {[
            ["Seams", String(openSeams.length)],
            ["Work recorded", String(recorded)],
            ["Edition", `v${OPEN_SEAMS_EDITION} · digital edition`],
          ].map(([label, value]) => (
            <div key={label} className="border-b border-border/50 px-1 py-4 last:border-b-0 sm:border-b-0 sm:px-5 sm:first:pl-0 sm:last:pr-0">
              <dt className="dot-label">
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
            End of register
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {openSeams.length} open questions. Recorded work appears under its
            question with a claim level and outcome. Outcomes that do not support
            the claim remain listed.
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Recorded work is not ranked or scored. Submissions from outside the
            project are not open yet.
          </p>
          <Link
            to="/doctrine/limits-and-debts"
            className="mt-6 inline-flex items-center gap-2 text-sm text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-[color:var(--organism-accent-strong)]"
          >
            Limits and Unpaid Debts in the concept map
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </section>
      </div>
    </PageShell>
  );
}
