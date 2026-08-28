import { ArrowRight, Compass } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  HERO_STATEMENT_DWELL_MS,
  HERO_STATEMENTS,
  HERO_TYPE_INTERVAL_MS,
} from "./heroData";

/**
 * The homepage's opening proposition.
 *
 * Keeping the claim, its epistemic qualifier, and its two deliberate exits in
 * one component prevents the hero's editorial hierarchy from being diluted by
 * the diagram or the inquiry tool beside it.
 */
export function HeroProposition({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const [statementIndex, setStatementIndex] = useState(0);
  const [typedLength, setTypedLength] = useState(0);
  const [paused, setPaused] = useState(false);
  const lastStatementIndex = HERO_STATEMENTS.length - 1;
  const currentStatement = HERO_STATEMENTS[statementIndex];

  useEffect(() => {
    if (reducedMotion || paused) return;

    if (typedLength < currentStatement.length) {
      const timer = window.setTimeout(
        () => setTypedLength((current) => current + 1),
        HERO_TYPE_INTERVAL_MS,
      );
      return () => window.clearTimeout(timer);
    }

    if (statementIndex >= lastStatementIndex) return;

    const timer = window.setTimeout(
      () => {
        setStatementIndex((current) => current + 1);
        setTypedLength(0);
      },
      HERO_STATEMENT_DWELL_MS,
    );
    return () => window.clearTimeout(timer);
  }, [currentStatement, lastStatementIndex, paused, reducedMotion, statementIndex, typedLength]);

  const visibleStatement = reducedMotion
    ? HERO_STATEMENTS[0]
    : currentStatement.slice(0, typedLength);
  const sequenceSettled =
    statementIndex === lastStatementIndex && typedLength >= currentStatement.length;

  return (
    <div className="home-hero-proposition">
      <div className="home-hero-kicker dot-label flex items-center gap-2">
        <span
          className="inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--organism-accent-strong)] shadow-[0_0_8px_var(--organism-accent-soft)]"
          aria-hidden="true"
        />
        <span>Digital Organism Theory</span>
        <span aria-hidden="true">·</span>
        <span>Book One</span>
      </div>

      <h1 className="home-hero-title">
        <span>The observer belongs</span>
        <span>in the inquiry.</span>
      </h1>

      <div
        className="home-hero-statement"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <ul className="sr-only">
          {HERO_STATEMENTS.map((statement) => <li key={statement}>{statement}</li>)}
        </ul>

        <p
          className="home-hero-lede home-hero-statement-copy"
          data-motion={reducedMotion ? "still" : "full"}
          data-settled={sequenceSettled ? "true" : "false"}
          aria-hidden="true"
        >
          <span>{visibleStatement}</span>
          {!reducedMotion && !sequenceSettled && (
            <span className="home-hero-typewriter-cursor" />
          )}
        </p>
      </div>

      <nav className="home-hero-actions" aria-label="Begin exploring Book One">
        <Link
          to="/book/digital-organism-theory/preface"
          className="dot-reading-action home-hero-primary-action group"
        >
          <span>Read Book One</span>
          <ArrowRight aria-hidden="true" />
        </Link>

        <Link
          to="/doctrine"
          className="appearance-ui-control home-hero-secondary-action group"
        >
          <Compass className="h-3.5 w-3.5 opacity-70 transition-transform duration-300 group-hover:rotate-45" aria-hidden="true" />
          <span>Concept map</span>
          <ArrowRight aria-hidden="true" />
        </Link>
      </nav>
    </div>
  );
}

export default HeroProposition;
