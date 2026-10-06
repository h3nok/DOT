import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown } from "lucide-react";

import { FocusNav } from "../../../attention-os/focus-nav/FocusNav";
import { NucleusMark } from "../../../dot";
import { Disclosure } from "../../../shared/Disclosure";
import { ArchitectureFocusContext, type ArchitectureFocus } from "./architectureFocus";
import type { ArchitecturePartId } from "./heroData";
import { HeroConceptSlideshow } from "./HeroConceptSlideshow";

interface HeroPropositionProps {
  inquiry?: ReactNode;
  reducedMotion?: boolean;
  /** The proposed architecture accompanies the reading invitation. */
  stage?: ReactNode;
}

export function HeroProposition({
  inquiry,
  stage,
  reducedMotion,
}: HeroPropositionProps) {
  const [focus, setFocus] = useState<ArchitecturePartId | null>(null);
  const [requested, setRequested] = useState<ArchitectureFocus["requested"]>(null);
  const architecture = useMemo<ArchitectureFocus>(() => ({
    focus,
    setFocus,
    requested,
    request: (part) => setRequested({ part, at: Date.now() }),
  }), [focus, requested]);

  return (
    <ArchitectureFocusContext.Provider value={architecture}>
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

            <HeroConceptSlideshow reducedMotion={reducedMotion} />
          </div>

          <FocusNav
            className="home-hero-entry"
            label="Begin exploring DOT"
            primary={{
              to: "/book/digital-organism-theory/preface?path=start-where-you-live",
              label: "Begin with lived experience",
              description: "The preface · Free to read",
              icon: <NucleusMark size={24} reducedMotion />,
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
    </ArchitectureFocusContext.Provider>
  );
}

export default HeroProposition;
