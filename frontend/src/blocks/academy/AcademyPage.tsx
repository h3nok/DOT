import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BookOpen, Compass, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";

import { AcademyGovernance } from "./AcademyGovernance";
import { SiteColophon } from "../../shared/SiteColophon";
import { PageHeader } from "../../shared/PageShell";
import { FocusNav } from "../../attention-os/focus-nav/FocusNav";
import "./academy.css";

export default function AcademyPage() {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    document.title = "DOT Academy — Digital Organism Theory";
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
        {/* ── The inquiry and its available starting points ───────────────── */}
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
                <span>Study the theory.</span>{" "}
                <span>Question its claims.</span>
              </h1>

              <p className="academy-hero__lede">
                DOT Academy brings the study of conscious experience together
                with the practice of attention. Explore the model’s definitions
                and unresolved questions, and compare its claims with the evidence.
              </p>

              <FocusNav
                className="academy-hero__actions"
                label="Begin exploring the Academy"
                primary={{
                  to: "/doctrine",
                  label: "Explore the concept map",
                  description: "Definitions linked to Book One",
                  icon: <Compass />,
                }}
                secondary={[
                  { to: "/applied", label: "Review open questions", icon: <ShieldAlert /> },
                  { to: "/book/digital-organism-theory", label: "Read Book One", icon: <BookOpen /> },
                ]}
              />
            </motion.div>

            <motion.aside
              initial={reducedMotion ? false : { y: 8 }}
              animate={{ y: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.6, delay: 0.12 }}
              className="academy-manifesto-card"
              aria-label="What is available"
            >
              <span className="academy-manifesto-card__tag dot-label">
                Start here
              </span>
              <h2>Available to read now</h2>
              <p>
                Book One, the concept map, and the open questions are public.
                New Academy responses, experiments, and essays are still in
                development.
              </p>
              <div className="academy-manifesto-card__foot">
                <span>Core Canon</span>
                <strong>Book One · Fixed Edition</strong>
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
              <h2 id="academy-book-title">Book One remains a book.</h2>
              <p>
                Read it as a complete, unified argument. Cite its exact edition. When
                the text evolves, the next release will state its provenance and diffs
                in full public view.
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
