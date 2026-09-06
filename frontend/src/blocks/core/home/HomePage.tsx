import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  LogIn,
  Network,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import { SignIn } from "../../../dot/SignIn";
import { TwinSurface } from "../../../dot/TwinSurface";
import { useAuth } from "../../../dot/useAuth";
import { AppearanceControl, useOrganism } from "../../../organism";
import { EditModeToggle } from "../../../content/editable";
import { DotWordmark } from "../../../shared/DotWordmark";
import { HeroAsk } from "./HeroAsk";
import { HeroArchitecture } from "./HeroArchitecture";
import { HeroProposition } from "./HeroProposition";
import type { HeroAskRequest } from "./heroData";
import { HomeJourneyNav } from "./HomeJourneyNav";
import { TheoryLayerJourney } from "./TheoryLayerJourney";
import "./home.css";

export default function HomePage() {
  const { isOwner, logout } = useAuth();
  const { config, reducedMotion: organismReducedMotion } = useOrganism();
  const [signInOpen, setSignInOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [heroCompanionRequest, setHeroCompanionRequest] = useState<
    (HeroAskRequest & { id: number }) | null
  >(null);
  const [heroCompanionOpen, setHeroCompanionOpen] = useState(false);

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

  const askFromHero = (request: HeroAskRequest) => {
    setHeroCompanionRequest({ ...request, id: Date.now() });
    setHeroCompanionOpen(true);
  };

  return (
    <main className="home-journey relative min-h-screen">
      {/* ── Dynamic Scroll-Aware Header ───────────────────────────────────────── */}
      <header
        aria-label="Site Header"
        className={`home-site-header fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${
          scrolled
            ? "bg-background/70 py-3.5 backdrop-blur-xl border-b border-border/30 shadow-sm"
            : "bg-transparent py-5"
        }`}
      >
        <div className="home-header-layout dot-page-container dot-page-wide flex items-center justify-between">
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
            {isOwner && <EditModeToggle />}

            {isOwner ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/studio"
                  className="home-header-action dot-pill dot-label text-foreground/80"
                >
                  Studio
                </Link>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="home-header-action dot-pill dot-label"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSignInOpen(true)}
                className="home-header-action dot-pill text-foreground/80"
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
      <section
        id="threshold"
        aria-label="Introduction"
        data-hero-motion={reducedMotion ? "still" : "full"}
        className="home-environment home-hero-environment"
      >
        <div className="home-hero-layout dot-page-container dot-page-wide">
          <HeroProposition
            reducedMotion={organismReducedMotion}
            inquiry={<HeroAsk className="home-hero-ask" onAsk={askFromHero} />}
            stage={
              <div className="home-hero-stage">
                <HeroArchitecture />
              </div>
            }
          />
        </div>

        <a className="home-scroll-cue" href="#possibility-field">
          <span>Continue</span>
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </a>
      </section>

      <AnimatePresence>
        {heroCompanionOpen && (
          <TwinSurface
            reducedMotion={reducedMotion}
            initialRequest={heroCompanionRequest}
            onClose={() => setHeroCompanionOpen(false)}
            onOpenNode={() => setHeroCompanionOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── The theory, in the same outside-to-inside order as the hero ─ */}
      <TheoryLayerJourney reducedMotion={reducedMotion} />

      {/* ── Final invitation into the living inquiry ─────────────────── */}
      <motion.section
        id="choose-path"
        aria-label="Continue to the DOT Academy"
        initial={reducedMotion ? false : { y: 12 }}
        whileInView={{ y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: reducedMotion ? 0 : 0.5 }}
        className="home-environment home-entrances-environment scroll-mt-4"
      >
        <div className="dot-page-container">
          <div className="mx-auto max-w-2xl text-center">
            <span className="home-ending-label dot-label">The living inquiry</span>
            <h2 className="dot-page-heading mt-2 text-balance">
              Continue with the Academy.
            </h2>
            <p className="dot-lede mx-auto mt-4 max-w-xl">
              Start with a question, compare the claims with the evidence, or
              bring an objection. The Academy is where the ideas can be revised.
              Book One remains a fixed edition.
            </p>
          </div>

          <div className="home-path-actions mx-auto mt-10 max-w-3xl">
            <Link
              to="/academy"
              className="dot-reading-action group inline-flex min-h-12 items-center justify-center gap-2.5 rounded-lg px-6 text-sm font-semibold"
            >
              <Network className="h-4 w-4" aria-hidden="true" />
              Enter DOT Academy
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>

            <Link
              to="/book/digital-organism-theory"
              className="home-path-secondary group"
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              Read Book One as a fixed edition
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </motion.section>

      {/* ── Colophon ─────────────────────────────────────────────────── */}
      <footer className="py-12 dot-page-container">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
          <DotWordmark className="font-mono text-sm uppercase tracking-[0.14em] text-muted-foreground/40" />
          <p className="text-xs leading-relaxed text-muted-foreground/50">
            Written by Henok Ghebrechristos · offered as a construction, not a revelation.
            No ads, no profiling, no data sales.
          </p>          {/* One quiet door: the readers' list (ADR-0025). Funding is asked
              deeper in, at the book's access page, never here (ADR-0022). */}
          <nav aria-label="Quiet links" className="flex items-center gap-5 text-xs">
            <Link
              to="/join"
              className="text-muted-foreground/60 underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              Join the readers’ list
            </Link>
          </nav>
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

    </main>
  );
}
