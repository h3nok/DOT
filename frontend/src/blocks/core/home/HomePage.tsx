import { AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Mail,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import { SignIn } from "../../../dot/SignIn";
import { TwinSurface } from "../../../dot/TwinSurface";
import { useAuth } from "../../../dot/useAuth";
import { useReaderList } from "../../../dot/useReaderList";
import { AppearanceControl, useOrganism } from "../../../organism";
import { EditModeToggle } from "../../../content/editable";
import { DoWordmark } from "../../../shared/DoWordmark";
import { SiteNav } from "../../../shared/SiteNav";
import { FocusNav } from "../../../attention-os/focus-nav/FocusNav";
import { author } from "../../../content/author";
import { HeroAsk } from "./HeroAsk";
import { HeroArchitecture } from "./HeroArchitecture";
import { HeroProposition } from "./HeroProposition";
import type { HeroAskRequest } from "./heroData";
import { HomeJourneyNav } from "./HomeJourneyNav";
import { HomeFilmSection } from "./HomeFilmSection";
import { TheoryLayerJourney } from "./TheoryLayerJourney";
import { Consciousness101 } from "./Consciousness101";
import "./home.css";
import "./home-editorial.css";

export default function HomePage() {
  const { isOwner, logout } = useAuth();
  const readerListOpen = useReaderList().available === true;
  const { config, reducedMotion: organismReducedMotion } = useOrganism();
  const [signInOpen, setSignInOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [heroCompanionRequest, setHeroCompanionRequest] = useState<
    (HeroAskRequest & { id: number }) | null
  >(null);
  const [heroCompanionOpen, setHeroCompanionOpen] = useState(false);

  useEffect(() => {
    // Other routes set their own titles; restore the home title on return.
    document.title = `${author.name} — Builder, writing & inquiry`;
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
      <a
        href="#threshold"
        className="sr-only z-[60] rounded-md bg-background px-4 py-2 text-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to the introduction
      </a>
      {/* ── Dynamic Scroll-Aware Header ───────────────────────────────────────── */}
      <header
        aria-label="Site Header"
        className={`home-site-header fixed top-0 left-0 right-0 z-30 transition-[background-color,border-color] duration-200 motion-reduce:transition-none ${
          scrolled
            ? "bg-background/75 py-3.5 backdrop-blur-xl border-b border-border/40"
            : "bg-transparent py-5"
        }`}
      >
        <div className="home-header-layout dot-page-container dot-page-wide flex flex-wrap items-center justify-between gap-y-1">
          <Link
            to="/"
            aria-label="DOT — Home"
            // -my-2.5 keeps the header its original height while the link itself
            // reaches a thumb-sized target.
            className="do-wordmark-link -my-2.5 flex min-h-11 items-center gap-2.5 py-2.5 text-xs font-medium tracking-wide text-foreground/80 transition-colors hover:text-foreground"
          >
            <DoWordmark emerge={!reducedMotion} />
          </Link>

          <SiteNav />

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
            ) : readerListOpen ? (
              // Strangers are readers, not members: the open door is the
              // readers' list (ADR-0025). Members sign in from the footer.
              <Link
                to="/readers"
                className="home-header-action dot-pill text-foreground/80"
                title="Hear by email when there is more DOT to read"
              >
                <Mail className="h-3 w-3" aria-hidden="true" />
                <span className="sr-only sm:not-sr-only">Readers’ list</span>
              </Link>
            ) : null}
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
            reducedMotion={reducedMotion}
            inquiry={<HeroAsk className="home-hero-ask" onAsk={askFromHero} />}
            stage={
              <div className="home-hero-stage">
                <HeroArchitecture />
              </div>
            }
          />
        </div>
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

      {/* Cultural conditioning gives readers a way into the proposed architecture. */}
      <Consciousness101 />
      {/* The architecture keeps its outside-to-inside causal order. */}
      <TheoryLayerJourney reducedMotion={reducedMotion} />
      {/* Visual synthesis & Little c's inner Experience Loop (Canvas, Fear, Love). */}
      <HomeFilmSection />

      {/* ── Further reading ──────────────────────────────────────────── */}
      <section
        id="choose-path"
        aria-label="Further reading"
        className="home-reading-links dot-page-container"
      >
        <FocusNav
          label="Further reading"
          className="mx-auto max-w-sm"
          primary={{
            to: "/book/digital-organism-theory",
            label: "Read Book One",
            description: "Complete and free · Fixed edition",
            icon: <BookOpen />,
          }}
          secondary={[
            {
              to: "/academy",
              label: "Explore the Academy",
            },
            {
              to: "/doctrine",
              label: "Explore the interactive Doctrine",
            },
            {
              to: "/amm",
              label: "Read the American Millennial Manifesto",
            },
          ]}
        />
        <p className="mx-auto mt-6 max-w-xl text-center text-xs text-muted-foreground">
          Related work includes Thomas Campbell’s <cite>My Big TOE</cite>,
          Bernardo Kastrup’s analytic idealism, and Donald Hoffman’s theory
          of conscious agents.{" "}
          Naming these thinkers does not mean they endorse DOT.
        </p>
      </section>

      {/* ── Colophon ─────────────────────────────────────────────────── */}
      <footer className="site-colophon py-12 dot-page-container">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
          <DoWordmark compact />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Written by Henok Ghebrechristos · offered as a construction, not a revelation.
            No ads, no profiling, no data sales.
          </p>          {/* One quiet door: the readers' list (ADR-0025). Funding is asked
              deeper in, at the book's access page, never here (ADR-0022). */}
          <nav aria-label="Quiet links" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs">
            <Link to="/academy" className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline">Academy</Link>
            <Link to="/doctrine" className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline">Doctrine</Link>
            <Link to="/blog" className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline">Essays</Link>
            <Link to="/amm" className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline">AMM</Link>
            <Link to="/about" className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline">About</Link>
            <Link to="/contact" className="text-muted-foreground underline-offset-4 hover:underline">Contact Henok</Link>
            <Link
              to="/readers"
              className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              Join the readers’ list
            </Link>
            <Link to="/privacy" className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline">Privacy</Link>
            <Link to="/terms" className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline">Terms</Link>
            {!isOwner && (
              // Membership is by invitation (ADR-0001); its sign-in stays quiet.
              <button
                type="button"
                onClick={() => setSignInOpen(true)}
                className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                Member sign-in
              </button>
            )}
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
