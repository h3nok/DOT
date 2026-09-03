import { useEffect, useState } from "react";

const HOME_SECTIONS = [
  { id: "threshold", label: "The proposed architecture" },
  { id: "possibility-field", label: "T · E: continuity and possibility" },
  { id: "big-c", label: "Big C: the foundation" },
  { id: "reality-frame", label: "RF₀: the physical universe" },
  { id: "little-c", label: "Little c: the local experiencer" },
  { id: "epistemic-boundary", label: "The evidence boundary" },
  { id: "choose-path", label: "Continue the inquiry" },
] as const;

type HomeSectionId = (typeof HOME_SECTIONS)[number]["id"];

/** A finite map of this page, kept peripheral until the reader asks for it. */
export function HomeJourneyNav() {
  const [activeId, setActiveId] = useState<HomeSectionId>(HOME_SECTIONS[0].id);

  useEffect(() => {
    let frame = 0;

    const updateActiveSection = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const readingLine = window.innerHeight * 0.42;
        let current: HomeSectionId = HOME_SECTIONS[0].id;

        for (const section of HOME_SECTIONS) {
          const element = document.getElementById(section.id);
          if (element && element.getBoundingClientRect().top <= readingLine) {
            current = section.id;
          }
        }

        setActiveId(current);
      });
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, []);

  return (
    <nav className="home-journey-nav" aria-label="On this page">
      <div className="home-journey-nav__links">
        {HOME_SECTIONS.map((section) => {
          const active = section.id === activeId;
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              aria-label={section.label}
              aria-current={active ? "location" : undefined}
              title={section.label}
            >
              <span aria-hidden="true" />
            </a>
          );
        })}
      </div>
    </nav>
  );
}

export default HomeJourneyNav;
