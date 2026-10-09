import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Blocks,
  PenLine,
  Mail,
  Network,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import { SignIn } from "../../../dot/SignIn";
import { TwinSurface } from "../../../dot/TwinSurface";
import { useAuth } from "../../../dot/useAuth";
import { useReaderList } from "../../../dot/useReaderList";
import { AppearanceControl, useOrganism } from "../../../organism";
import { EditModeToggle } from "../../../content/editable";
import { DotWordmark } from "../../../shared/DotWordmark";
import { SiteNav } from "../../../shared/SiteNav";
import { FocusNav } from "../../../attention-os/focus-nav/FocusNav";
import { IntentCard } from "../../../attention-os/focus-nav/IntentCard";
import { author } from "../../../content/author";
import HOME from "../../../content/home.json";
import { HeroAsk } from "./HeroAsk";
import { HeroArchitecture } from "./HeroArchitecture";
import { HeroProposition } from "./HeroProposition";
import type { HeroAskRequest } from "./heroData";
import { HomeJourneyNav } from "./HomeJourneyNav";
import { TheoryLayerJourney } from "./TheoryLayerJourney";
import { Consciousness101 } from "./Consciousness101";
import "./home.css";

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
        className={`home-site-header fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${
          scrolled
            ? "bg-background/70 py-3.5 backdrop-blur-xl border-b border-border/30 shadow-sm"
            : "bg-transparent py-5"
        }`}
      >
        <div className="home-header-layout dot-page-container dot-page-wide flex flex-wrap items-center justify-between gap-y-1">
          <Link
            to="/"
            // -my-2.5 keeps the header its original height while the link itself
            // reaches a thumb-sized target.
            className="-my-2.5 flex min-h-11 items-center gap-2.5 py-2.5 text-xs font-medium tracking-wide text-foreground/80 transition-colors hover:text-foreground"
          >
            <DotWordmark className="font-mono uppercase tracking-[0.14em]" />
          </Link>

          <SiteNav className="order-last w-full sm:order-none sm:w-auto" />

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
                <span>Readers’ list</span>
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

      <section id="personal-platform" className="home-personal-section" aria-labelledby="home-personal-title">
        <div className="dot-page-container dot-page-wide">
          <header className="home-personal-heading">
            <div><p className="dot-label">Henok Ghebrechristos, PhD</p><h2 id="home-personal-title" className="dot-page-heading">Things built.<br />Ideas explored.</h2></div>
            <p>AI and product architecture, independent building, and an open inquiry into consciousness. Choose what brings you here.</p>
          </header>
          <nav className="home-personal-doors" aria-label="Work, writing and conversation">
            <IntentCard to="/about#about-products" title="Build something useful." label="Work · Digital assets" description="Products, AI systems, selected projects, and the experience behind them." icon={<Blocks />} tone="forest" />
            <IntentCard to="/blog" title="Follow an idea." label="Writing · Open inquiry" description="Technical work, essays, and The Millennial Manifesto, together in one archive." icon={<PenLine />} tone="copper" />
            <IntentCard to="/contact?purpose=project" title="Start a conversation." label="Contact · Work together" description="Discuss a project, explore a collaboration, or share a question." icon={<Mail />} tone="blue" />
          </nav>
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

      {/* ── The theory, in the same outside-to-inside order as the hero ─ */}
      <TheoryLayerJourney reducedMotion={reducedMotion} />
      <Consciousness101 />

      {/* ── Final reading invitation ─────────────────────────────────── */}
      <motion.section
        id="choose-path"
        aria-label="An invitation to inquire"
        initial={reducedMotion ? false : { y: 12 }}
        whileInView={{ y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: reducedMotion ? 0 : 0.5 }}
        className="home-environment home-entrances-environment scroll-mt-4"
      >
        <div className="dot-page-container">
          <div className="mx-auto max-w-2xl text-center">
            <span className="home-ending-label dot-label">An invitation to inquire</span>
            <h2 className="dot-page-heading mt-2 text-balance">
              {HOME.invitationTitle}
            </h2>
            <p className="dot-lede mx-auto mt-4 max-w-xl">
              {HOME.invitation}
            </p>
            <p className="dot-lede mx-auto mt-4 max-w-xl">
              {HOME.boundary}
            </p>
            <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground">
              {HOME.edition}
            </p>
            <p className="mx-auto mt-4 max-w-xl text-xs text-muted-foreground">
              Related work includes Thomas Campbell’s <cite>My Big TOE</cite>,
              Bernardo Kastrup’s analytic idealism, and Donald Hoffman’s theory
              of conscious agents.{" "}
              Naming these thinkers does not mean they endorse DOT.
            </p>
          </div>

          <FocusNav
            label="Continue the inquiry"
            className="mx-auto mt-10 max-w-sm"
            primary={{
              to: "/book/digital-organism-theory",
              label: "Read Book One",
              description: "Complete and free · Fixed edition",
              icon: <BookOpen />,
            }}
            secondary={[{
              to: "/academy",
              label: "Explore DOT Academy",
              icon: <Network />,
              endIcon: <ArrowRight />,
            }]}
          />
        </div>
      </motion.section>

      {/* ── Colophon ─────────────────────────────────────────────────── */}
      <footer className="py-12 dot-page-container">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
          <DotWordmark className="font-mono text-sm uppercase tracking-[0.14em] text-muted-foreground/40" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Written by Henok Ghebrechristos · offered as a construction, not a revelation.
            No ads, no profiling, no data sales.
          </p>          {/* One quiet door: the readers' list (ADR-0025). Funding is asked
              deeper in, at the book's access page, never here (ADR-0022). */}
          <nav aria-label="Quiet links" className="flex items-center gap-5 text-xs">
            <Link to="/contact" className="text-muted-foreground underline-offset-4 hover:underline">Contact Henok</Link>
            <Link
              to="/readers"
              className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              Join the readers’ list
            </Link>
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
