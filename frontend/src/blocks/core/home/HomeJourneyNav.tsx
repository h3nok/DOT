import { useEffect, useState } from "react";

const HOME_SECTIONS = [
  { id: "threshold", label: "An invitation to examine experience" },
  { id: "consciousness-101", label: "The culture inside us" },
  { id: "possibility-field", label: "The model’s starting assumption" },
  { id: "big-c", label: "An account of consciousness" },
  { id: "reality-frame", label: "A shared world" },
  { id: "little-c", label: "Your point of view" },
  { id: "visual-inquiry", label: "Personal exploration in film" },
  { id: "choose-path", label: "Keep exploring" },
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
