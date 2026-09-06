import { type ReactNode } from "react";
import { ArrowRight, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

import { EpistemicBadge } from "../../../shared/EpistemicBadge";

/**
 * The homepage's opening proposition.
 *
 * Keeping the claim, its epistemic qualifier, and its two deliberate exits in
 * one component prevents the diagram beside it from diluting the editorial
 * hierarchy.
 */
interface HeroPropositionProps {
  reducedMotion?: boolean;
  inquiry?: ReactNode;
  /** The architecture plate; rendered between the masthead and the dossier. */
  stage?: ReactNode;
}

export function HeroProposition({
  inquiry,
  stage,
}: HeroPropositionProps) {
  return (
    <div className="home-hero-proposition">
      <div className="home-hero-masthead">
        <div className="home-hero-kicker dot-label flex items-center justify-center gap-2">
          <span className="dot-mark" aria-hidden="true" />
          <span className="home-hero-kicker-copy">
            Digital Organism Theory · Open Academy
          </span>
        </div>

        <h1 className="home-hero-title">
          <span>A theory of reality</span>
          {" "}
          <span>has to account for you.</span>
        </h1>

        <p className="home-hero-lede">
          We can map brain activity and still ask why any of it feels like
          something. Your fear, love, and ability to change belong in that
          question. Digital Organism Theory explores what follows if
          consciousness is part of reality’s foundation.
        </p>
      </div>

      <nav className="home-hero-entry" aria-label="Begin exploring DOT">
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

      {stage}

      <div className="home-hero-dossier">
        <div className="home-hero-dossier-claim">
          <aside className="home-hero-reversal" aria-label="DOT's central thesis">
            <span>
              <span>The thesis</span>
              <EpistemicBadge status="hypothesis">Held as hypothesis · Open to challenge</EpistemicBadge>
            </span>
            <p>
              Consciousness means there is something it feels like to be you.
              DOT proposes that it precedes the physical universe: a larger
              conscious organism generates our world, and your body connects
              your experience to it.
            </p>
          </aside>
        </div>

        <div className="home-hero-dossier-act">
          {inquiry}
        </div>
      </div>
    </div>
  );
}

export default HeroProposition;
