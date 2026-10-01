import type { ReactNode } from "react";
import { ArrowDown, BookOpen } from "lucide-react";

import { FocusNav } from "../../../attention-os/focus-nav/FocusNav";
import { Disclosure } from "../../../shared/Disclosure";
import { EpistemicBadge } from "../../../shared/EpistemicBadge";

interface HeroPropositionProps {
  inquiry?: ReactNode;
  /** The proposed architecture accompanies the reading invitation. */
  stage?: ReactNode;
}

export function HeroProposition({
  inquiry,
  stage,
}: HeroPropositionProps) {
  return (
    <div className="home-hero-proposition">
      <div className="home-hero-opening">
        <div className="home-hero-margin">
          <div className="home-hero-kicker">
            <span className="dot-mark" aria-hidden="true" />
            <span>Digital Organism Theory</span>
          </div>

          <div className="home-hero-masthead">
            <h1 className="dot-page-heading home-hero-title">
              <span>What shapes</span>
              {" "}
              <span>the life you live?</span>
            </h1>

            <p className="dot-lede home-hero-lede">
              DOT proposes that consciousness precedes the physical universe we
              inhabit, and that this universe is an environment for conscious
              learning and development.
            </p>
            <EpistemicBadge status="hypothesis" presentation="text">
              Held as hypothesis · Open to challenge
            </EpistemicBadge>
          </div>

          <FocusNav
            className="home-hero-entry"
            label="Begin exploring DOT"
            primary={{
              to: "/book/digital-organism-theory/preface",
              label: "Read Book One",
              description: "Begin with the preface · Free to read",
              icon: <BookOpen />,
            }}
            secondary={[{
              href: "#possibility-field",
              label: "Explore the model",
              endIcon: <ArrowDown />,
            }]}
          />
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
