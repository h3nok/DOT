import { useEffect, useState } from "react";

const HOME_SECTIONS = [
  { id: "threshold", label: "The proposition" },
  { id: "unlearning-experiment", label: "Love and inquiry" },
  { id: "architecture-diagram", label: "Architecture of experience" },
  { id: "mandate", label: "The Reality Frame" },
  { id: "orientation", label: "Working vocabulary" },
  { id: "choose-path", label: "Enter the work" },
  { id: "invitation", label: "Join the inquiry" },
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
      <ol>
        {HOME_SECTIONS.map((section) => {
          const active = section.id === activeId;
          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                aria-label={section.label}
                aria-current={active ? "location" : undefined}
                title={section.label}
              >
                <span aria-hidden="true" />
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default HomeJourneyNav;
