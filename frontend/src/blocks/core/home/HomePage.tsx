import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BookOpen, Compass, LogIn, MessageCircleQuestion, UserPlus } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import { SignIn } from "../../../dot/SignIn";
import { TwinSurface } from "../../../dot/TwinSurface";
import { useAuth } from "../../../dot/useAuth";
import { useOrganism } from "../../../organism";
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

  const scrollToAnchor = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

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
            ? "bg-transparent py-3.5 backdrop-blur-md border-b border-transparent"
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
        className="relative mx-auto flex min-h-[75vh] w-full flex-col items-center justify-center pt-24 pb-16 text-center dot-page-container"
      >
        <div className="flex flex-col items-center w-full max-w-4xl">
          <EmergenceMark settled={hasSeen || reducedMotion} />

          <p className="dot-label mt-7">
            Digital Organism Theory
          </p>

          <h1 className="mt-2.5 text-balance font-serif text-4xl font-normal leading-tight text-foreground sm:text-5xl lg:text-6xl">
            A model of life as a process, not an object.
          </h1>

          <p className="mt-3 max-w-xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
            How conditioning forms, how it governs what you perceive, and what it takes to act outside it.
          </p>

          {/* ── Interactive Agentic Chat Threshold (Ask Minty) ────────────────── */}
          <div className="mt-6 w-full max-w-2xl text-center">
            <HeroAsk
              className="w-full"
              onAsk={(request) => setAsk({ ...request, id: Date.now() })}
            />
          </div>

          {/* Two doors, both leaving the page. The sections further down this
              page are reached by scrolling, so a button that only scrolls to
              them competes with the scroll cue below for the same move.

              They wear the organism's own action styles rather than local ones:
              `dot-reading-action` is the filled commitment used wherever the
              site sends a reader into the text, and `dot-graph-destination` is
              the door into the graph. Both carry the member's accent tint and
              respond to the Appearance panel's UI style, so this pair restyles
              itself with every other surface instead of drifting out of step. */}
          <div className="mt-7 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center">
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
              <span>Explore the Concept Map</span>
              <ArrowRight
                className="h-4 w-4 text-[color:var(--organism-accent-strong)] transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </div>

          {/* Subtle ambient scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            // Hidden on phones. A "scroll" hint is for a viewport that looks
            // finished at the fold; on mobile the next section is already
            // visibly cut off, so the cue only costs height where height is
            // scarcest.
            className="mt-10 hidden flex-col items-center gap-2 text-muted-foreground/50 sm:flex"
          >
            <a
              href="#unlearning-experiment"
              onClick={scrollToAnchor("unlearning-experiment")}
              aria-label="Scroll to Step 1"
              className="flex flex-col items-center gap-1.5 transition-colors hover:text-foreground/80"
            >
              <span className="dot-label text-[10px] tracking-widest text-muted-foreground/60">SCROLL TO OBSERVE</span>
              <motion.div
                animate={{ y: [0, 4, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="h-1.5 w-1.5 rounded-full bg-[color:var(--organism-accent-strong)]/60"
              />
            </a>
          </motion.div>
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
        className="mx-auto grid w-full scroll-mt-24 gap-8 border-t border-border/40 py-16 dot-page-container sm:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] sm:items-start sm:text-left"
      >
        <div>
          <span className="dot-label">The claim boundary</span>
          <h2 className="dot-page-heading mt-4 text-balance">
            Reading this is not the same as testing it.
          </h2>
        </div>
        <div>
          <p className="dot-lede max-w-2xl text-balance">
            Digital Organism Theory is a developing model, not a completed account.
            Book One marks each major claim as observation, model, or hypothesis so
            a reader can see what is being noticed, proposed, or left uncertain.
          </p>
          <p className="dot-caption mt-4 max-w-xl text-balance">
            Lived experience can reveal whether a practice changes what you notice.
            It cannot, by itself, prove the book's larger claims. Those require
            comparison, criticism, and evidence beyond the framework.
          </p>
          <Link
            to="/applied"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-[color:var(--organism-accent-strong)]"
          >
            Examine the open questions
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
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
        className="mx-auto w-full scroll-mt-24 border-t border-border/40 py-16 dot-page-container"
      >
        <div className="max-w-2xl">
          <span className="dot-label">Continue from here</span>
          <h2 className="dot-page-heading mt-2 text-balance">
            Choose the depth you need.
          </h2>
          <p className="dot-lede mt-4 max-w-xl">
            Read the argument in order, inspect how its terms connect, or bring a
            precise question to the companion.
          </p>
        </div>

        <div className="mt-9 divide-y divide-border/50 border-y border-border/50">
          <div className="group grid gap-4 py-6 sm:grid-cols-[3rem_1fr_auto] sm:items-center">
            <span className="font-mono text-xs text-[color:var(--organism-accent-strong)]">01</span>
            <div>
              <h3 className="dot-section-heading">Read Book One</h3>
              <p className="dot-caption mt-1">The complete argument, in its intended order and with its notes.</p>
            </div>
            <Link
              to="/book/digital-organism-theory"
              className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-[color:var(--organism-accent-strong)]"
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              Begin reading
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="group grid gap-4 py-6 sm:grid-cols-[3rem_1fr_auto] sm:items-center">
            <span className="font-mono text-xs text-[color:var(--organism-accent-strong)]">02</span>
            <div>
              <h3 className="dot-section-heading">Trace the concepts</h3>
              <p className="dot-caption mt-1">Definitions, claim levels, and exact links back to the source text.</p>
            </div>
            <Link
              to="/doctrine"
              className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-[color:var(--organism-accent-strong)]"
            >
              <Compass className="h-4 w-4" aria-hidden="true" />
              Open the map
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="group grid gap-4 py-6 sm:grid-cols-[3rem_1fr_auto] sm:items-center">
            <span className="font-mono text-xs text-[color:var(--organism-accent-strong)]">03</span>
            <div>
              <h3 className="dot-section-heading">Question the framework</h3>
              <p className="dot-caption mt-1">Ask Minty to locate, ground, or test a claim against Book One.</p>
            </div>
            <button
              type="button"
              onClick={() => setAsk({ query: "What does DOT claim?", lens: "ground", id: Date.now() })}
              className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-[color:var(--organism-accent-strong)]"
            >
              <MessageCircleQuestion className="h-4 w-4" aria-hidden="true" />
              Ask Minty
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </motion.section>

      {/* ── Orientation Rotator: 10 Core Claims ─────────────────────────── */}
      <motion.section
        id="orientation"
        aria-labelledby="orientation-title"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5 }}
        className="mx-auto w-full scroll-mt-24 py-16 dot-page-container border-t border-border/40"
      >
        <span className="dot-label">A working vocabulary · 10 concepts</span>
        <h2
          id="orientation-title"
          className="dot-page-heading mt-2 max-w-2xl text-balance"
        >
          The terms the argument depends on.
        </h2>
        <p className="dot-lede mt-4 max-w-xl">
          Move through the vocabulary before deciding whether the framework holds.
          Each term retains the claim level assigned in Book One.
        </p>
        <div className="mt-8">
          <HeroConcepts autoAdvance={!reducedMotion} />
        </div>
      </motion.section>

      {/* ── An Invitation, Not a Demand ──────────────────────────────── */}
      <motion.section
        aria-labelledby="invitation-title"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5 }}
        className="mx-auto w-full border-t border-border/40 py-16 dot-page-container"
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
              className="dot-reading-action inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-6 text-sm font-semibold"
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Ask to join
            </Link>
            <Link
              to="/support"
              className="dot-graph-destination inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border px-6 text-sm font-semibold"
            >
              Support the work
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-12 border-t border-border/40 pt-6">
            <p className="font-mono text-xs text-muted-foreground">
              Written by Henok Ghebrechristos · offered as a construction, not a revelation
            </p>
            <p className="mt-2 text-xs text-muted-foreground/70">
              No ads, no tracking, no data sales. Reader support funds the next edition and platform.
            </p>
          </div>
        </div>
      </motion.section>

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
