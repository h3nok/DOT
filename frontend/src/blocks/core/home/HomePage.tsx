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
            emergence over time
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

            <p className="home-hero-lede mt-5 max-w-lg">
              A practical framework for understanding what you are,
              how you got here, and what you can still change.
            </p>

            <div className="mt-8 w-full max-w-xl">
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
                className="dot-graph-destination group inline-flex min-h-12 items-center justify-center gap-2.5 rounded-lg border px-6 text-sm font-semibold text-foreground transition-all active:scale-[0.98]"
              >
                <Network
                  className="h-4 w-4 text-[color:var(--organism-accent-strong)]"
                  aria-hidden="true"
                />
                <span>
                  <span className="hidden sm:inline">Explore the </span>Concept Map
                </span>
              </Link>
            </div>

          </div>
        </div>

        <a className="home-scroll-cue" href="#unlearning-experiment">
          <span>Begin with a lived claim</span>
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
          <div>
            <span className="home-inverse-label dot-label">The Reality Frame</span>
            <h2 className="home-inverse-heading mt-4 text-balance">
              You are already playing.
            </h2>
          </div>
          <div className="home-reality-copy">
            <p className="text-balance">
              DOT models the physical world as a developmental environment — a
              Reality Frame where every action meets real consequence. You cannot
              spectate this. You are in it. The only question is whether you see
              the rules or are governed by them without knowing.
            </p>
            <p className="mt-5 text-balance text-sm leading-relaxed opacity-70 sm:text-base">
              Book One does not ask you to believe this. It marks each claim as
              observation, model, or hypothesis so you can see exactly what is
              being proposed and where the argument is still open.
            </p>
            <Link
              to="/applied"
              className="home-inverse-link mt-7 inline-flex min-h-11 items-center gap-2 text-sm font-semibold"
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
        className="home-environment home-language-environment scroll-mt-24"
      >
        <div className="dot-page-container dot-page-wide">
          <div className="home-section-heading-row">
            <div>
              <span className="dot-label">A working vocabulary · 10 concepts</span>
              <h2
                id="orientation-title"
                className="dot-page-heading mt-3 text-balance"
              >
                The terms the argument depends on.
              </h2>
            </div>
            <p className="dot-lede max-w-lg">
              Move through the vocabulary before deciding whether the framework
              holds. Each term retains the claim level assigned in Book One.
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
            Two ways into the work.
          </h2>
          <p className="dot-lede mx-auto mt-4 max-w-xl">
            Read the sustained argument, or inspect its structure before deciding
            where to begin.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-2">
          <Link
            to="/book/digital-organism-theory"
            className="home-entrance group"
          >
            <span className="home-entrance-icon">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <h3 className="dot-section-heading">Read Book One</h3>
              <p className="dot-caption mt-1">The complete argument, in its intended order and with its notes.</p>
            </span>
            <ArrowRight className="home-entrance-arrow" aria-hidden="true" />
          </Link>

          <Link
            to="/doctrine"
            className="home-entrance group"
          >
            <span className="home-entrance-icon">
              <Network className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <h3 className="dot-section-heading">Explore the Concept Map</h3>
              <p className="dot-caption mt-1">Definitions, claim levels, and exact links back to the source text.</p>
            </span>
            <ArrowRight className="home-entrance-arrow" aria-hidden="true" />
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
        <div className="max-w-3xl">
          <span className="dot-label">Open inquiry</span>
          <h2
            id="invitation-title"
            className="dot-page-heading mt-3 text-balance"
          >
            Stay with the work.
          </h2>
          <p className="dot-lede mt-4 max-w-2xl text-balance">
            DOT is being built in public as a book, a critical practice, and a
            community for people who want to learn without surrendering their
            attention. You do not need to agree to take part; honest scrutiny is
            part of the work.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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
