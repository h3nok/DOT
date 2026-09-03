import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

import { EpistemicBadge } from "../../../shared/EpistemicBadge";
import { HERO_ARGUMENT, HERO_TYPE_INTERVAL_MS } from "./heroData";

/**
 * The homepage's opening proposition.
 *
 * Keeping the claim, its epistemic qualifier, and its two deliberate exits in
 * one component prevents the diagram beside it from diluting the editorial
 * hierarchy.
 *
 * The observation types once and then remains still.
 */
interface HeroPropositionProps {
  reducedMotion?: boolean;
  inquiry?: ReactNode;
}

export function HeroProposition({
  reducedMotion = false,
  inquiry,
}: HeroPropositionProps) {
  const [typedLength, setTypedLength] = useState(0);
  const fullyTyped = typedLength >= HERO_ARGUMENT.text.length;

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    const startedAt = performance.now();
    let frame = 0;

    const type = (now: number) => {
      const nextLength = Math.min(
        HERO_ARGUMENT.text.length,
        Math.floor((now - startedAt) / HERO_TYPE_INTERVAL_MS),
      );
      setTypedLength(nextLength);
      if (nextLength < HERO_ARGUMENT.text.length) {
        frame = window.requestAnimationFrame(type);
      }
    };

    frame = window.requestAnimationFrame(type);
    return () => window.cancelAnimationFrame(frame);
  }, [reducedMotion]);

  const visibleText = reducedMotion
    ? HERO_ARGUMENT.text
    : HERO_ARGUMENT.text.slice(0, typedLength);

  const observation = (
    <div
      className="home-hero-statement home-hero-arguments"
      role="group"
      aria-label="An observation underlying the theory"
      data-settled={reducedMotion || fullyTyped || undefined}
    >
      <div className="home-hero-argument">
        <p className="home-hero-argument-stance dot-label">
          <span>{HERO_ARGUMENT.stance}</span>
        </p>
        {reducedMotion ? (
          <p className="home-hero-argument-text">{HERO_ARGUMENT.text}</p>
        ) : (
          <>
            <p className="sr-only">{HERO_ARGUMENT.text}</p>
            <p className="home-hero-argument-text" aria-hidden="true">
              <span>{visibleText}</span>
              {!fullyTyped && <span className="home-hero-typewriter-cursor" />}
            </p>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="home-hero-proposition">
      <div className="home-hero-kicker dot-label flex items-center gap-2">
        <span className="dot-mark" aria-hidden="true" />
        <span className="home-hero-kicker-copy">
          Digital Organism Theory · Open Academy
        </span>
      </div>

      <h1 className="home-hero-title">
        <span>The observer belongs</span>
        {" "}
        <span>in the inquiry.</span>
      </h1>

      <aside className="home-hero-reversal" aria-label="DOT's central thesis">
        <span>
          <span>The thesis</span>
          <EpistemicBadge status="hypothesis">Held as hypothesis · Open to challenge</EpistemicBadge>
        </span>
        <p>
          Consciousness is fundamental. This universe is a generated Reality
          Frame. Your body is the interface — not the source — of the
          person reading this.
        </p>
      </aside>

      {observation}

      <nav className="home-hero-actions" aria-label="Begin exploring DOT">
        {/* The book is the one complete action today; the Academy is in assembly. */}
        <Link
          to="/book/digital-organism-theory/preface"
          className="dot-reading-action home-hero-primary-action group"
        >
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          <span>Read Book One</span>
          <ArrowRight aria-hidden="true" />
        </Link>

        <Link
          to="/academy"
          className="appearance-ui-control home-hero-secondary-action group"
        >
          <span>Preview the Academy</span>
          <ArrowRight aria-hidden="true" />
        </Link>
      </nav>

      {inquiry}
    </div>
  );
}

export default HeroProposition;
