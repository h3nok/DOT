import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  HeartHandshake,
  LogIn,
  Network,
  UserPlus,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import { SignIn } from "../../../dot/SignIn";
import { TwinSurface } from "../../../dot/TwinSurface";
import { useAuth } from "../../../dot/useAuth";
import { SUPPORT_PAYMENT_LINK } from "../../../dot/supportLink";
import {
  AppearanceControl,
  useOrganism,
  useOrganismPulse,
} from "../../../organism";
import { EditModeToggle } from "../../../content/editable";
import { DotWordmark } from "../../../shared/DotWordmark";
import { EmergenceMark } from "./EmergenceMark";
import { HeroConcepts } from "./HeroConcepts";
import { HeroAsk } from "./HeroAsk";
import { HomeJourneyNav } from "./HomeJourneyNav";
import type { HeroAskRequest } from "./heroData";
import { StepOneUnlearning } from "./StepOneUnlearning";
import { ArchitectureDiagram } from "./ArchitectureDiagram";
import "./home.css";

const HERO_STATEMENTS = [
  {
    full: "Feeling is data, but feeling is not automatically truth.",
    compact: "Feeling is data—not automatically truth.",
  },
  {
    full: "No method removes the observer from existence.",
    compact: "Science cannot remove the observer.",
  },
  {
    full: "Fear can narrow the hypothesis space.",
    compact: "Fear narrows the questions we can ask.",
  },
  {
    full: "You can notice a proposed action without becoming it.",
    compact: "An impulse is not your only option.",
  },
  {
    full: "Love is the condition in which Fear no longer governs you.",
    compact: "Love means Fear no longer governs.",
  },
] as const;

function HeroTypewriter({ reducedMotion }: { reducedMotion: boolean }) {
  const [heroStatementIndex, setHeroStatementIndex] = useState(0);
  const [heroTypedLength, setHeroTypedLength] = useState(0);
  const [useCompactStatement, setUseCompactStatement] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 640,
  );

  useEffect(() => {
    const syncStatementLength = () => setUseCompactStatement(window.innerWidth < 640);
    window.addEventListener("resize", syncStatementLength, { passive: true });
    return () => window.removeEventListener("resize", syncStatementLength);
  }, []);

  const heroStatement = HERO_STATEMENTS[heroStatementIndex];
  const displayedStatement = useCompactStatement
    ? heroStatement.compact
    : heroStatement.full;

  useEffect(() => {
    if (reducedMotion) return;

    if (heroTypedLength < displayedStatement.length) {
      const timer = window.setTimeout(() => {
        setHeroTypedLength((current) => current + 1);
      }, 42);

      return () => window.clearTimeout(timer);
    }

    if (heroStatementIndex >= HERO_STATEMENTS.length - 1) return;

    const timer = window.setTimeout(() => {
      setHeroStatementIndex((current) => current + 1);
      setHeroTypedLength(0);
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [displayedStatement, heroStatementIndex, heroTypedLength, reducedMotion]);

  const visibleHeroStatement = reducedMotion
    ? displayedStatement
    : displayedStatement.slice(0, heroTypedLength);
  const heroSequenceSettled =
    heroStatementIndex === HERO_STATEMENTS.length - 1 &&
    visibleHeroStatement.length === displayedStatement.length;

  return (
    <p className="home-hero-lede mt-5" aria-label={heroStatement.full}>
      <span
        className="home-hero-typewriter"
        data-static={reducedMotion ? "true" : "false"}
        data-settled={heroSequenceSettled ? "true" : "false"}
        aria-hidden="true"
      >
        <span className="home-hero-typewriter-text">{visibleHeroStatement}</span>
        <span className="home-hero-typewriter-cursor" />
      </span>
    </p>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { isOwner, logout } = useAuth();
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

  return (
    <main className="home-journey relative min-h-screen">
      {/* ── Dynamic Scroll-Aware Header ───────────────────────────────────────── */}
      <header
        aria-label="Site Header"
        className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${
          scrolled
            ? "bg-background/70 py-3.5 backdrop-blur-xl border-b border-border/30 shadow-sm"
            : "bg-transparent py-5"
        }`}
      >
        <div className="dot-page-container dot-page-wide flex items-center justify-between">
        <Link
          to="/"
          // -my-2.5 keeps the header its original height while the link itself
          // reaches a thumb-sized target.
          className="-my-2.5 flex min-h-11 items-center gap-2.5 py-2.5 text-xs font-medium tracking-wide text-foreground/80 transition-colors hover:text-foreground"
        >
          <DotWordmark className="font-mono uppercase tracking-[0.14em]" />
        </Link>

        <div className="flex items-center gap-3">
          <AppearanceControl placement="inline" />
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
        </div>
      </header>

      <HomeJourneyNav />

      {/* ── The Hero: a proposition inside a living digital field ───────────── */}
      <motion.section
        id="threshold"
        aria-label="Introduction"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="home-environment home-hero-environment"
      >
        <div className="home-hero-stage" aria-hidden="true">
          <span className="home-hero-axis home-hero-axis-horizontal" />
          <span className="home-hero-stage-label home-hero-stage-label-time">
            state persists through change
          </span>
          <div className="home-hero-state-trace">
            <span />
            <span />
            <span />
          </div>
          <div className="home-hero-mark">
            <EmergenceMark size={380} settled={reducedMotion} />
          </div>
        </div>

        <div className="home-hero-content dot-page-container dot-page-wide">
          <div className="home-hero-copy">
            <p className="dot-label">
              <span className="font-bold text-[color:var(--organism-accent-strong)]">D</span>igital{" "}
              <span className="font-bold text-[color:var(--organism-accent-strong)]">O</span>rganism{" "}
              <span className="font-bold text-[color:var(--organism-accent-strong)]">T</span>heory
            </p>

            <h1 className="home-hero-title mt-5 text-balance">
              <span className="block">
                We are <span className="home-hero-title-code">digital.</span>
              </span>
              <span className="mt-2 block">Reality is information.</span>
            </h1>

            <HeroTypewriter reducedMotion={reducedMotion} />

            <div className="home-hero-ask mt-8 w-full max-w-xl">
            <HeroAsk
              className="w-full"
              onAsk={(request) => {
                pulse(0.8);
                setAsk({ ...request, id: Date.now() });
              }}
            />
            </div>

            <div className="home-hero-actions mt-6 w-full">
              <Link
                to="/book/digital-organism-theory"
                className="dot-reading-action group inline-flex min-h-12 items-center justify-center gap-2.5 rounded-lg px-6 text-sm font-semibold transition-all active:scale-[0.98]"
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
                className="home-hero-secondary-link group inline-flex min-h-12 items-center justify-center gap-2.5 px-2 text-sm font-semibold text-foreground transition-colors"
              >
                <Network
                  className="h-4 w-4 text-[color:var(--organism-accent-strong)]"
                  aria-hidden="true"
                />
                <span>Inspect the Concept Map</span>
              </Link>
            </div>

          </div>
        </div>

        <a className="home-scroll-cue" href="#unlearning-experiment">
          <span>Continue</span>
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </a>
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
        className="home-environment home-reality-environment scroll-mt-24"
      >
        <div className="home-reality-layout dot-page-container dot-page-wide">
          <div className="home-reality-heading">
            <span className="home-inverse-label dot-label">The Reality Frame</span>
            <h2 className="home-inverse-heading mt-4 text-balance">
              You are already <span>playing.</span>
            </h2>
          </div>
          <div className="home-reality-copy">
            <p className="text-balance">
              DOT models the physical world as a Reality Frame: a developmental
              environment where action meets consequence. You cannot spectate it.
              You are already inside the conditions that shape you.
            </p>
            <p className="mt-5 text-balance text-sm leading-relaxed opacity-70 sm:text-base">
              Book One marks every claim as observation, model, or hypothesis.
              The point is not belief, but seeing what is proposed and where it
              remains open.
            </p>
            <Link
              to="/applied"
              className="home-inverse-link group mt-7 inline-flex min-h-11 items-center gap-2 text-sm font-semibold"
            >
              See where the argument is open
              <ArrowRight
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
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
        className="home-environment home-language-environment scroll-mt-24"
      >
        <div className="dot-page-container dot-page-wide">
          <div className="home-section-heading-row">
            <div>
              <span className="dot-label">The language of the model · 10 concepts</span>
              <h2
                id="orientation-title"
                className="dot-page-heading mt-3 text-balance"
              >
                Learn the terms before judging the model.
              </h2>
            </div>
            <p className="dot-lede max-w-lg">
              Each concept keeps the claim level assigned in Book One, so a model
              is never presented as an observation or a hypothesis as fact.
            </p>
          </div>
          <div className="mt-10">
            <HeroConcepts autoAdvance={!reducedMotion} />
          </div>
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
        className="home-environment home-entrances-environment scroll-mt-24"
      >
        <div className="dot-page-container">
        <div className="mx-auto max-w-2xl text-center">
          <span className="dot-label">Continue from here</span>
          <h2 className="dot-page-heading mt-2 text-balance">
            Begin with the argument.
          </h2>
          <p className="dot-lede mx-auto mt-4 max-w-xl">
            Book One gives the framework in its intended order. The concept map
            remains available when you need to inspect its structure.
          </p>
        </div>

        <div className="home-path-actions mx-auto mt-10 max-w-3xl">
          <Link
            to="/book/digital-organism-theory"
            className="dot-reading-action group inline-flex min-h-12 items-center justify-center gap-2.5 rounded-lg px-6 text-sm font-semibold"
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            Read Book One
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>

          <Link
            to="/doctrine"
            className="home-path-secondary group"
          >
            <Network className="h-4 w-4" aria-hidden="true" />
            Inspect definitions and claim levels
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        </div>
      </motion.section>

      {/* ── An Invitation ──────────────────────────────────────────── */}
      <motion.section
        id="invitation"
        aria-labelledby="invitation-title"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5 }}
        className="home-environment home-invitation-environment scroll-mt-24"
      >
        <div className="dot-page-container dot-page-wide">
        <div className="home-invitation-content mx-auto max-w-3xl text-center">
          <span className="dot-label">Open inquiry · Optional participation</span>
          <h2
            id="invitation-title"
            className="dot-page-heading mt-3 text-balance"
          >
            Honest scrutiny belongs here.
          </h2>
          <p className="dot-lede mx-auto mt-4 max-w-2xl text-balance">
            DOT is being built in public as a book, a critical practice, and a
            community that protects attention. Agreement is not the price of
            entry; careful disagreement is part of the work.
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
