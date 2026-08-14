import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BookOpen, Compass, HeartHandshake, LogIn, MessageCircleQuestion, UserPlus } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import { SignIn } from "../../../dot/SignIn";
import { TwinSurface } from "../../../dot/TwinSurface";
import { useAuth } from "../../../dot/useAuth";
import { SUPPORT_PAYMENT_LINK } from "../../../dot/supportLink";
import { useOrganism, useOrganismPulse } from "../../../organism";
import { EditModeToggle } from "../../../content/editable";
import { DotWordmark } from "../../../shared/DotWordmark";
import { EmergenceMark } from "./EmergenceMark";
import { HeroConcepts } from "./HeroConcepts";
import { HeroAsk } from "./HeroAsk";
import type { HeroAskRequest } from "./heroData";
import { StepOneUnlearning } from "./StepOneUnlearning";
import { ArchitectureDiagram } from "./ArchitectureDiagram";

/** Play the emergence once per tab. A returning reader gets the settled mark. */
const SEEN_KEY = "dot.hero.seen";

function alreadySeen(): boolean {
  try {
    return window.sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

export default function HomePage() {
  const navigate = useNavigate();
  const { isOwner, logout, refresh: refreshAuth } = useAuth();
  const { config, reducedMotion: organismReducedMotion } = useOrganism();
  const pulse = useOrganismPulse();
  const [signInOpen, setSignInOpen] = useState(false);
  const [ask, setAsk] = useState<(HeroAskRequest & { id: number }) | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // "Hold the field still" in the Appearance panel is a request about this
  // page too, so treat it as equivalent to reduced motion for the emergence.
  const reducedMotion = organismReducedMotion || config.stillness || !config.enabled;

  const [hasSeen] = useState<boolean>(alreadySeen);

  return (
    <main className="relative min-h-screen">
      {/* ── Dynamic Scroll-Aware Header ───────────────────────────────────────── */}
      <header
        aria-label="Site Header"
        className={`fixed top-0 left-0 right-0 z-30 flex items-center justify-between transition-all duration-300 dot-page-container ${
          scrolled
            ? "bg-background/70 py-3.5 backdrop-blur-xl border-b border-border/30 shadow-sm"
            : "bg-transparent py-5"
        }`}
      >
        <Link
          to="/"
          // -my-2.5 keeps the header its original height while the link itself
          // reaches a thumb-sized target.
          className="-my-2.5 flex min-h-11 items-center gap-2.5 py-2.5 text-xs font-medium tracking-wide text-foreground/80 transition-colors hover:text-foreground"
        >
          <DotWordmark className="font-mono uppercase tracking-[0.14em]" />
        </Link>

        <div className="flex items-center gap-3">
          <EditModeToggle />

          {isOwner ? (
            <div className="flex items-center gap-2">
              <Link
                to="/studio"
                className="dot-pill dot-label text-foreground/80"
              >
                Studio
              </Link>
              <button
                type="button"
                onClick={() => void logout()}
                className="dot-pill dot-label"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setSignInOpen(true)}
              className="dot-pill text-foreground/80"
            >
              <LogIn className="h-3 w-3" aria-hidden="true" />
              <span>Sign in</span>
            </button>
          )}
        </div>
      </header>

      {/* ── The Hero: Clean Interactive Agentic Threshold ────────────────────── */}
      <motion.section
        aria-label="Introduction"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative mx-auto flex min-h-[80vh] w-full flex-col items-center justify-center pt-28 pb-20 text-center dot-page-container"
      >
        <div className="flex flex-col items-center w-full max-w-4xl">
          <EmergenceMark settled={hasSeen || reducedMotion} />

          <p className="dot-label mt-7">
            <span className="text-[color:var(--organism-accent-strong)] font-bold">D</span>igital{" "}
            <span className="text-[color:var(--organism-accent-strong)] font-bold">O</span>rganism{" "}
            <span className="text-[color:var(--organism-accent-strong)] font-bold">T</span>heory
          </p>

          <h1 className="mt-2.5 text-balance font-serif text-4xl font-normal leading-tight text-foreground sm:text-5xl lg:text-6xl">
            We are <span className="font-mono tracking-tight">digital</span>. Reality is information.
          </h1>

          <p className="mt-4 max-w-2xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
            A reality model that treats consciousness as fundamental — not a byproduct of matter. Our universe is a developmental virtual environment.
          </p>

          <div className="mt-8 w-full max-w-xl text-center">
            <HeroAsk
              className="w-full"
              onAsk={(request) => {
                pulse(0.8);
                setAsk({ ...request, id: Date.now() });
              }}
            />
          </div>

          <div className="mt-6 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Link
              to="/book/digital-organism-theory"
              className="dot-reading-action group inline-flex items-center justify-center gap-2.5 rounded-xl px-6 py-3.5 text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.98]"
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              <span>Read Book One</span>
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>

            <Link
              to="/doctrine"
              className="dot-graph-destination group inline-flex items-center justify-center gap-2.5 rounded-xl border px-6 py-3.5 text-sm font-semibold text-foreground transition-all hover:scale-[1.01] active:scale-[0.98]"
            >
              <Compass
                className="h-4 w-4 text-[color:var(--organism-accent-strong)]"
                aria-hidden="true"
              />
              <span>Concept Map</span>
            </Link>
          </div>
        </div>
      </motion.section>

      {/* ── Step 1: Perceptual Unlearning Experiment ─────────────────── */}
      <StepOneUnlearning />

      {/* ── Visual Model Architecture Diagram ────────────────────────── */}
      <ArchitectureDiagram />

      {/* ── Honest Warning / The Mandate ─────────────────────────────── */}
      <motion.section
        id="mandate"
        aria-label="An Honest Warning"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5 }}
        className="mx-auto w-full scroll-mt-24 border-t border-border/40 py-20 dot-page-container"
      >
        <div className="dot-surface mx-auto max-w-3xl rounded-2xl border border-border/30 bg-foreground/[0.02] p-8 backdrop-blur-sm sm:p-10">
          <div className="mx-auto max-w-2xl text-center">
            <span className="dot-label">The Reality Frame</span>
            <h2 className="dot-page-heading mt-4 text-balance">
              You are already playing.
            </h2>
            <p className="dot-lede mx-auto mt-5 max-w-xl text-balance">
              DOT models the physical world as a developmental environment — a
              Reality Frame where every action meets real consequence. You cannot
              spectate this. You are in it. The only question is whether you see
              the rules or are governed by them without knowing.
            </p>
            <p className="dot-caption mx-auto mt-4 max-w-xl text-balance">
              Book One does not ask you to believe this. It marks each claim as
              observation, model, or hypothesis so you can see exactly what is
              being proposed and where the argument is still open.
            </p>
            <Link
              to="/applied"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-[color:var(--organism-accent-strong)]"
            >
              See where the argument is open
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </motion.section>

      {/* ── Orientation: 10 Core Claims ─────────────────────────────── */}
      <motion.section
        id="orientation"
        aria-labelledby="orientation-title"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5 }}
        className="mx-auto w-full scroll-mt-24 py-20 dot-page-container border-t border-border/40"
      >
        <div className="mx-auto max-w-2xl text-center">
          <span className="dot-label">A working vocabulary · 10 concepts</span>
          <h2
            id="orientation-title"
            className="dot-page-heading mt-2 text-balance"
          >
            The terms the argument depends on.
          </h2>
          <p className="dot-lede mx-auto mt-4 max-w-xl">
            Move through the vocabulary before deciding whether the framework holds.
            Each term retains the claim level assigned in Book One.
          </p>
        </div>
        <div className="mt-8">
          <HeroConcepts autoAdvance={!reducedMotion} />
        </div>
      </motion.section>

      {/* ── Choose Your Door / Visitor Intent Pathways ───────────────── */}
      <motion.section
        id="choose-path"
        aria-label="How to approach this work"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5 }}
        className="mx-auto w-full scroll-mt-24 border-t border-border/40 py-20 dot-page-container"
      >
        <div className="mx-auto max-w-2xl text-center">
          <span className="dot-label">Continue from here</span>
          <h2 className="dot-page-heading mt-2 text-balance">
            Choose the depth you need.
          </h2>
          <p className="dot-lede mx-auto mt-4 max-w-xl">
            Read the argument in order, inspect how its terms connect, or bring a
            precise question to the companion.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <Link
            to="/book/digital-organism-theory"
            className="dot-surface group flex flex-col gap-4 rounded-2xl border border-border/30 bg-foreground/[0.02] p-6 backdrop-blur-sm transition-all hover:border-[color:var(--organism-accent-strong)]/30 hover:bg-foreground/[0.04] hover:shadow-lg hover:shadow-[color:var(--organism-accent-strong)]/5"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--organism-accent-strong)] text-background shadow-lg shadow-[color:var(--organism-accent-strong)]/20">
                <BookOpen className="h-4 w-4" />
              </div>
              <span className="dot-label text-[color:var(--organism-accent-strong)]">01</span>
            </div>
            <div>
              <h3 className="dot-section-heading">Read Book One</h3>
              <p className="dot-caption mt-1">The complete argument, in its intended order and with its notes.</p>
            </div>
            <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-foreground transition-colors group-hover:text-[color:var(--organism-accent-strong)]">
              Begin reading
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </Link>

          <Link
            to="/doctrine"
            className="dot-surface group flex flex-col gap-4 rounded-2xl border border-border/30 bg-foreground/[0.02] p-6 backdrop-blur-sm transition-all hover:border-[color:var(--organism-accent-strong)]/30 hover:bg-foreground/[0.04] hover:shadow-lg hover:shadow-[color:var(--organism-accent-strong)]/5"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--organism-accent-strong)] text-background shadow-lg shadow-[color:var(--organism-accent-strong)]/20">
                <Compass className="h-4 w-4" />
              </div>
              <span className="dot-label text-[color:var(--organism-accent-strong)]">02</span>
            </div>
            <div>
              <h3 className="dot-section-heading">Trace the concepts</h3>
              <p className="dot-caption mt-1">Definitions, claim levels, and exact links back to the source text.</p>
            </div>
            <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-foreground transition-colors group-hover:text-[color:var(--organism-accent-strong)]">
              Open the map
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </Link>

          <button
            type="button"
            onClick={() => {
              pulse(0.6);
              setAsk({ query: "What does DOT claim?", lens: "ground", id: Date.now() });
            }}
            className="dot-surface group flex flex-col gap-4 rounded-2xl border border-border/30 bg-foreground/[0.02] p-6 text-left backdrop-blur-sm transition-all hover:border-[color:var(--organism-accent-strong)]/30 hover:bg-foreground/[0.04] hover:shadow-lg hover:shadow-[color:var(--organism-accent-strong)]/5"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--organism-accent-strong)] text-background shadow-lg shadow-[color:var(--organism-accent-strong)]/20">
                <MessageCircleQuestion className="h-4 w-4" />
              </div>
              <span className="dot-label text-[color:var(--organism-accent-strong)]">03</span>
            </div>
            <div>
              <h3 className="dot-section-heading">Question the framework</h3>
              <p className="dot-caption mt-1">Ask Minty to locate, ground, or test a claim against Book One.</p>
            </div>
            <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-foreground transition-colors group-hover:text-[color:var(--organism-accent-strong)]">
              Ask Minty
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </button>
        </div>
      </motion.section>

      {/* ── An Invitation ──────────────────────────────────────────── */}
      <motion.section
        aria-labelledby="invitation-title"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5 }}
        className="mx-auto w-full border-t border-border/40 py-20 dot-page-container"
      >
        <div className="mx-auto max-w-3xl text-center">
          <span className="dot-label">Open inquiry</span>
          <h2
            id="invitation-title"
            className="dot-page-heading mt-3 text-balance"
          >
            Stay with the work.
          </h2>
          <p className="dot-lede mx-auto mt-4 max-w-2xl text-balance">
            DOT is being built in public as a book, a critical practice, and a
            community for people who want to learn without surrendering their
            attention. You do not need to agree to take part; honest scrutiny is
            part of the work.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/join"
              className="dot-reading-action inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold"
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Join
            </Link>
            {SUPPORT_PAYMENT_LINK ? (
              <a
                href={SUPPORT_PAYMENT_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="dot-graph-destination inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border px-6 text-sm font-semibold"
              >
                <HeartHandshake className="h-4 w-4" aria-hidden="true" />
                Support the work
              </a>
            ) : (
              <Link
                to="/support"
                className="dot-graph-destination inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border px-6 text-sm font-semibold"
              >
                <HeartHandshake className="h-4 w-4" aria-hidden="true" />
                Support the work
              </Link>
            )}
          </div>
        </div>
      </motion.section>

      {/* ── Colophon ─────────────────────────────────────────────────── */}
      <footer className="border-t border-border/20 py-12 dot-page-container">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
          <DotWordmark className="font-mono text-sm uppercase tracking-[0.14em] text-muted-foreground/40" />
          <p className="text-xs leading-relaxed text-muted-foreground/50">
            Written by Henok Ghebrechristos · offered as a construction, not a revelation.
            No ads, no tracking, no data sales.
          </p>
        </div>
      </footer>

      <AnimatePresence>
        {signInOpen && (
          <SignIn
            reducedMotion={reducedMotion}
            onClose={() => setSignInOpen(false)}
            onSignedIn={() => {
              setSignInOpen(false);
              void refreshAuth();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {ask && (
          <TwinSurface
            reducedMotion={reducedMotion}
            initialRequest={ask}
            onClose={() => setAsk(null)}
            onOpenNode={(nodeId) => {
              setAsk(null);
              navigate(`/doctrine/${encodeURIComponent(nodeId)}`);
            }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
