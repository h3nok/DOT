import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BookOpen, Compass, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";

import { AcademyGovernance } from "./AcademyGovernance";
import { SiteColophon } from "../../shared/SiteColophon";
import { PageHeader } from "../../shared/PageShell";
import { FocusNav } from "../../attention-os/focus-nav/FocusNav";
import landing from "../../content/academy/landing.json";
import "./academy.css";

export default function AcademyPage() {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    document.title = landing.title;
  }, []);

  return (
    <div className="academy-page min-h-screen">
      <a
        href="#academy-main"
        className="sr-only z-[60] rounded-md bg-background px-4 py-2 text-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to the Academy
      </a>

      <PageHeader />

      <main id="academy-main">
        {/* ── The Academy's purpose and its starting point ───────────────── */}
        <section className="academy-hero" aria-labelledby="academy-title">
          <div className="academy-hero__inner dot-page-container dot-page-wide">
            <motion.div
              initial={reducedMotion ? false : { y: 10 }}
              animate={{ y: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.55 }}
              className="academy-hero__copy"
            >
              <div className="academy-hero__status-badge">
                <span className="dot-mark" aria-hidden="true" />
                <span className="dot-label">DOT Academy · In development</span>
              </div>

              <h1 id="academy-title" className="academy-title">
                <span>{landing.heading[0]}</span>{" "}
                <span>{landing.heading[1]}</span>
              </h1>

              <p className="academy-hero__lede">
                {landing.introduction}
              </p>

              <FocusNav
                className="academy-hero__actions"
                label="Begin exploring the Academy"
                primary={{
                  to: landing.start.href,
                  label: landing.start.label,
                  description: landing.start.description,
                  icon: <BookOpen />,
                }}
                secondary={[
                  { to: "/doctrine", label: "Explore the concept map", icon: <Compass /> },
                  { to: "/applied", label: "Review open questions", icon: <ShieldAlert /> },
                ]}
              />
            </motion.div>

            <motion.aside
              initial={reducedMotion ? false : { y: 8 }}
              animate={{ y: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.6, delay: 0.12 }}
              className="academy-manifesto-card"
              aria-label="DOT’s working hypothesis"
            >
              <span className="academy-manifesto-card__tag dot-label">
                {landing.hypothesis.label}
              </span>
              <h2>{landing.hypothesis.heading}</h2>
              <p>
                {landing.hypothesis.body}
              </p>
              <div className="academy-manifesto-card__foot">
                <span>Trace the claim</span>
                <Link to={landing.hypothesis.sourceHref} className="academy-text-link">
                  {landing.hypothesis.sourceLabel}
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                </Link>
              </div>
            </motion.aside>
          </div>
        </section>

        {/* ── The Fixed Canon ───────────────────────────────────────────── */}
        <motion.section
          className="academy-section academy-book-section"
          aria-labelledby="academy-book-title"
        >
          <div className="academy-book dot-page-container dot-page-wide">
            <div className="academy-book__mark" aria-hidden="true">
              <span>DOT</span>
              <i />
              <span>01</span>
            </div>
            <div className="academy-book__copy">
              <p className="dot-label">Publication · Fixed edition</p>
              <h2 id="academy-book-title">{landing.publication.heading}</h2>
              <p>
                {landing.publication.body}
              </p>
              <Link to="/book/digital-organism-theory" className="academy-book__action">
                Open the released edition
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </motion.section>

        <AcademyGovernance />
      </main>
      <SiteColophon />
    </div>
  );
}
