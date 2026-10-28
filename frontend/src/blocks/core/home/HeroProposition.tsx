import type { ReactNode } from "react";
import { BookOpen } from "lucide-react";

import { FocusNav } from "../../../attention-os/focus-nav/FocusNav";
import HOME from "../../../content/home.json";
import { Disclosure } from "../../../shared/Disclosure";

interface HeroPropositionProps {
  inquiry?: ReactNode;
  /** The proposed architecture is the centre of the opening composition. */
  stage?: ReactNode;
}

export function HeroProposition({ inquiry, stage }: HeroPropositionProps) {
  return (
    <div className="home-hero-proposition">
      <div className="home-hero-opening">
        <div className="home-hero-margin">
          <div className="home-hero-byline">
            <div className="home-hero-kicker">
              <span className="dot-mark" aria-hidden="true" />
              <span>Digital Organism Theory</span>
            </div>
          </div>

          <div className="home-hero-masthead">
            <h1 className="dot-page-heading home-hero-title">
              <span>{HOME.title}</span>
            </h1>
            <p className="home-hero-subtitle">
              {HOME.criticalLine}
            </p>
          </div>

          <div className="home-hero-entrances">
            <FocusNav
              className="home-hero-entry"
              label="Begin exploring DOT"
              primary={{
                to: "/book/digital-organism-theory/preface?path=start-where-you-live",
                label: HOME.primaryAction,
                icon: <BookOpen strokeWidth={1.5} />,
              }}
            />

            <nav className="home-entry-links" aria-label="More ways to explore">
              <a href="#possibility-field">{HOME.explore.architectureLabel}</a>
              <a href="#visual-inquiry">{HOME.explore.filmLabel}</a>
            </nav>
          </div>
        </div>

        {stage}
      </div>

      {inquiry && (
        <Disclosure className="home-hero-inquiry" summary="Have a question about Book One?">
          {inquiry}
        </Disclosure>
      )}
    </div>
  );
}

export default HeroProposition;
