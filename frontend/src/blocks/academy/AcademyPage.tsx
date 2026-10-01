import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BookOpen, Compass, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";

import {
  academyAreasFor,
  academyPrograms,
} from "../../content/academy/academyData";
import { PageHeader } from "../../shared/PageShell";
import { FocusNav } from "../../attention-os/focus-nav/FocusNav";
import "./academy.css";

const invariants = [
  {
    index: "01",
    title: "The Observer in the Inquiry",
    role: "Consciousness is not a footnote to physical cosmology. The inquiry integrates the experiencing agent into the foundational architecture of reality.",
  },
  {
    index: "02",
    title: "Sovereign Attention",
    role: "No engagement feeds, infinite scrolls, or vanity metrics. Genuine intellectual progress requires stillness, intention, and cognitive sovereignty.",
  },
  {
    index: "03",
    title: "Epistemic Discipline",
    role: "Every assertion must explicitly declare its burden: Observation, Model, Hypothesis, or Speculation. No speculation may masquerade as fact.",
  },
  {
    index: "04",
    title: "Permanent Dissent & Open Seams",
    role: "Counter-arguments, unresolved debts, and negative results remain permanently in the public record rather than being quietly deleted.",
  },
] as const;

const standards = [
  {
    label: "Kind",
    value: "Definition · Diagram · Hypothesis · Objection · Response · Experiment · Excerpt · Essay",
  },
  {
    label: "Claim level",
    value: "Observation · Model · Hypothesis · Speculation",
  },
  {
    label: "Provenance",
    value: "Source · edition · relationship to earlier work",
  },
  {
    label: "Disposition",
    value: "Open · revised · inconclusive · not supported",
  },
] as const;

export default function AcademyPage() {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    document.title = "DOT Academy — Digital Organism Theory";
  }, []);

  const reveal = reducedMotion
    ? {}
    : {
        initial: { y: 12 },
        whileInView: { y: 0 },
        viewport: { once: true, margin: "-50px" },
        transition: { duration: 0.5 },
      };

  return (
    <div className="academy-page min-h-screen">
      <a
        href="#academy-main"
        className="sr-only z-[60] rounded-md bg-background px-4 py-2 text-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to the Academy
      </a>

      <PageHeader
        right={
          <Link
            to="/book/digital-organism-theory"
            className="academy-header-publication"
          >
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Book One</span>
          </Link>
        }
      />

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

        {/* ── Pillars of the Revolution ──────────────────────────────────── */}
        <motion.section
          {...reveal}
          className="academy-section academy-invariants-section"
          aria-labelledby="academy-invariants-title"
        >
          <div className="dot-page-container dot-page-wide">
            <header className="academy-section-heading">
              <div>
                <p className="dot-label">The Intellectual Charter</p>
                <h2 id="academy-invariants-title">Four invariants of the new inquiry.</h2>
              </div>
              <p>
                An institution is defined by what it refuses to compromise. These
                principles govern every contribution, experiment, and debate.
              </p>
            </header>

            <div className="academy-invariants-grid">
              {invariants.map((item) => (
                <div key={item.index} className="academy-invariant-card">
                  <span className="academy-invariant-index">{item.index}</span>
                  <h3>{item.title}</h3>
                  <p>{item.role}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ── Programs Under Assembly ────────────────────────────────────── */}
        <motion.section
          {...reveal}
          id="academy-programs"
          className="academy-section academy-programs-section scroll-mt-16"
          aria-labelledby="academy-programs-title"
        >
          <div className="dot-page-container dot-page-wide">
            <header className="academy-section-heading">
              <div>
                <p className="dot-label">The Emerging Architecture</p>
                <h2 id="academy-programs-title">Three programs. Eight forms of work.</h2>
              </div>
              <p>
                The Academy organizes intellectual labor into three structured programs.
                Each form of work serves a distinct epistemic purpose.
              </p>
            </header>

            <div className="academy-programs-overview">
              {academyPrograms.map((program) => {
                const areas = academyAreasFor(program.id);
                return (
                  <div key={program.id} className="academy-program-card">
                    <header className="academy-program-card__header">
                      <span className="academy-program-card__index">{program.index}</span>
                      <div>
                        <h3>{program.title}</h3>
                        <p>{program.purpose}</p>
                      </div>
                    </header>

                    <div className="academy-program-card__areas">
                      {areas.map((area) => (
                        <div
                          key={area.id}
                          className="academy-program-card__area-item"
                          data-phase={area.phase}
                        >
                          <div className="academy-program-card__area-head">
                            <span className="academy-program-card__area-title">{area.title}</span>
                            <span className="academy-program-card__area-status dot-label">
                              {area.phase === "available" ? "Available" : "In development"}
                            </span>
                          </div>
                          <p className="academy-program-card__area-role">{area.currentState}</p>
                          {area.href && (
                            <Link to={area.href} className="academy-program-card__area-link group">
                              <span>{area.action}</span>
                              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.section>

        {/* ── Epistemic Standards ────────────────────────────────────────── */}
        <motion.section
          {...reveal}
          className="academy-section academy-standard-section"
          aria-labelledby="academy-standard-title"
        >
          <div className="dot-page-container dot-page-wide">
            <header className="academy-section-heading">
              <div>
                <p className="dot-label">The Academy Standard</p>
                <h2 id="academy-standard-title">Every contribution must show its burden.</h2>
              </div>
              <p>
                Readers must never guess what a work is, where it originated, or what
                evidence could overturn it.
              </p>
            </header>

            <dl className="academy-standards">
              {standards.map((standard, index) => (
                <div key={standard.label}>
                  <dt>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    {standard.label}
                  </dt>
                  <dd>{standard.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </motion.section>

        {/* ── The Fixed Canon ───────────────────────────────────────────── */}
        <motion.section
          {...reveal}
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

        {/* ── Epilogue / Dispatch ───────────────────────────────────────── */}
        <section className="academy-end" aria-label="Continue studying">
          <div className="dot-page-container">
            <span className="dot-mark academy-end__mark" aria-hidden="true" />
            <p className="dot-label">Continue the inquiry</p>
            <h2>The work begins in stillness.</h2>
            <p>
              The Academy will open its doors progressively. Until then, explore the
              existing conceptual map and the open seams already declared in the
              foundational edition.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
              <Link to="/doctrine" className="academy-text-link">
                Begin with definitions
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link to="/applied" className="academy-text-link">
                Review open questions
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
