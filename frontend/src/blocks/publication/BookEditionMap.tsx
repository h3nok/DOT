import { useMemo, useState } from "react";
import { ArrowRight, Compass, Network } from "lucide-react";
import { Link } from "react-router-dom";
import { BookAction, BookCard } from "./BookPrimitives";
import {
  bookSectionRoute,
  groupBookSectionsByPart,
  type BookReleaseSection,
  type DotBookOneManifest,
} from "../../content/publications/dotBookOne";

const nodePositions = [
  { x: 18, y: 24 },
  { x: 42, y: 12 },
  { x: 70, y: 16 },
  { x: 86, y: 40 },
  { x: 82, y: 70 },
  { x: 61, y: 86 },
  { x: 34, y: 84 },
  { x: 14, y: 63 },
];

function sectionLabel(section: BookReleaseSection): string {
  if (section.kind === "chapter") return `Chapter ${section.number}`;
  if (section.kind === "preface") return "Preface";
  return "Sources";
}

function conceptLabel(concept: string): string {
  return concept
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function sharedConcepts(
  selected: BookReleaseSection,
  candidate: BookReleaseSection,
): string[] {
  const candidateConcepts = new Set(candidate.related_concepts);
  return selected.related_concepts.filter((concept) =>
    candidateConcepts.has(concept),
  );
}

function EditionInspector({
  manifest,
  section,
}: {
  manifest: DotBookOneManifest;
  section: BookReleaseSection | null;
}) {
  const firstSection = manifest.sections[0];

  if (!section) {
    return (
      <BookCard className="book-map-inspector grid gap-7 p-5 sm:p-7 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="book-overline">The thesis</p>
          <h3 className="mt-2 font-serif text-3xl font-semibold leading-tight text-[var(--book-ink)]">
            The observer belongs in the inquiry.
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--book-muted)]">
            This edition moves from method to architecture, then returns to the
            human instance: Canvas, Painting, Fear, Love, and conscious
            authorship.
          </p>
        </div>
        <BookAction asChild>
          <Link to={bookSectionRoute(firstSection)}>
            Read the preface
            <ArrowRight className="h-4 w-4" />
          </Link>
        </BookAction>
      </BookCard>
    );
  }

  const connectedSections = manifest.sections
    .filter((candidate) => candidate.id !== section.id)
    .map((candidate) => ({
      section: candidate,
      concepts: sharedConcepts(section, candidate),
    }))
    .filter((connection) => connection.concepts.length > 0)
    .sort((left, right) => right.concepts.length - left.concepts.length)
    .slice(0, 3);

  return (
    <BookCard className="book-map-inspector grid gap-7 p-5 sm:p-7 lg:grid-cols-[1fr_0.8fr_auto] lg:items-end">
      <div>
        <p className="book-overline text-[var(--book-cinnabar)]">
          {sectionLabel(section)} · {section.part}
        </p>
        <h3 className="mt-2 font-serif text-3xl font-semibold leading-tight text-[var(--book-ink)]">
          {section.title}
        </h3>
        {section.subtitle ? (
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--book-muted)]">
            {section.subtitle}
          </p>
        ) : null}
        <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--book-muted)]">
          About {section.reading_time_minutes} min ·{" "}
          {section.related_concepts.map(conceptLabel).join(" · ")}
        </p>
      </div>

      <div>
        <p className="book-overline">Resonant sections</p>
        <div className="mt-3 space-y-3">
          {connectedSections.length > 0 ? (
            connectedSections.map((connection) => (
              <p key={connection.section.id} className="text-sm leading-relaxed text-[var(--book-muted)]">
                <span className="font-medium text-[var(--book-ink)]">
                  {connection.section.title}
                </span>{" "}
                · {connection.concepts.map(conceptLabel).join(", ")}
              </p>
            ))
          ) : (
            <p className="text-sm text-[var(--book-muted)]">
              A terminal reference point.
            </p>
          )}
        </div>
      </div>

      <BookAction asChild>
        <Link to={bookSectionRoute(section)}>
          Read this section
          <ArrowRight className="h-4 w-4" />
        </Link>
      </BookAction>
    </BookCard>
  );
}

export default function BookEditionMap({
  manifest,
}: {
  manifest: DotBookOneManifest;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedSection =
    manifest.sections.find((section) => section.id === selectedId) ?? null;
  const groups = useMemo(
    () => groupBookSectionsByPart(manifest.sections),
    [manifest.sections],
  );
  const selectedConnections = selectedSection
    ? manifest.sections.filter(
        (candidate) =>
          candidate.id !== selectedSection.id &&
          sharedConcepts(selectedSection, candidate).length > 0,
      )
    : [];

  return (
    <section
      id="edition-map"
      className="book-map mt-24 scroll-mt-24"
      aria-labelledby="edition-map-title"
    >
      <div className="book-section-heading">
        <div>
          <p className="book-overline">04 / See the whole</p>
          <h2 id="edition-map-title" className="book-section-title">
            An atlas of the argument
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-[var(--book-muted)]">
          Follow the written order, or select a chapter to see the concepts it
          carries across the whole work.
        </p>
      </div>

      <div className="book-map-instrument relative hidden aspect-[16/10] min-h-[640px] w-full overflow-hidden border border-[var(--book-hairline)] md:block">
        <div className="book-map-engraving" aria-hidden="true" />
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          {manifest.sections.slice(0, -1).map((section, index) => {
            const start = nodePositions[index];
            const end = nodePositions[index + 1];
            return (
              <line
                key={section.id}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                vectorEffect="non-scaling-stroke"
                className="book-map-line"
              />
            );
          })}
          {selectedSection
            ? selectedConnections.map((connection) => {
                const startIndex = manifest.sections.findIndex(
                  (section) => section.id === selectedSection.id,
                );
                const endIndex = manifest.sections.findIndex(
                  (section) => section.id === connection.id,
                );
                const start = nodePositions[startIndex];
                const end = nodePositions[endIndex];
                return (
                  <line
                    key={connection.id}
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    vectorEffect="non-scaling-stroke"
                    className="book-map-line book-map-line-selected"
                  />
                );
              })
            : null}
        </svg>

        <button
          type="button"
          onClick={() => setSelectedId(null)}
          aria-pressed={selectedId === null}
          className="book-map-center absolute left-1/2 top-1/2 flex h-40 w-40 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center px-5 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--book-cinnabar)]"
        >
          <Compass className="h-6 w-6 text-[var(--book-cinnabar)]" />
          <span className="mt-3 font-mono text-[8px] uppercase tracking-[0.18em] text-[var(--book-muted)]">
            Book One
          </span>
          <span className="mt-1 font-serif text-base font-semibold leading-tight text-[var(--book-ink)]">
            Construction, not revelation
          </span>
        </button>

        {manifest.sections.map((section, index) => {
          const position = nodePositions[index];
          const active = section.id === selectedId;
          const connected = selectedConnections.some(
            (connection) => connection.id === section.id,
          );
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setSelectedId(section.id)}
              aria-pressed={active}
              className={`book-map-node absolute flex min-h-16 w-36 -translate-x-1/2 -translate-y-1/2 flex-col justify-center border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--book-cinnabar)] lg:w-40 ${
                active
                  ? "book-map-node-active"
                  : connected
                    ? "book-map-node-connected"
                    : ""
              }`}
              style={{ left: `${position.x}%`, top: `${position.y}%` }}
            >
              <span className="font-mono text-[8px] uppercase tracking-[0.14em] opacity-70">
                {sectionLabel(section)}
              </span>
              <span className="mt-1 text-xs font-semibold leading-tight">
                {section.title}
              </span>
            </button>
          );
        })}
      </div>

      <div className="book-map-mobile border border-[var(--book-hairline)] md:hidden">
        {groups.map((group) => (
          <section key={group.part} className="border-b border-[var(--book-hairline)] px-4 py-6 last:border-b-0">
            <h3 className="book-overline">{group.part}</h3>
            <ol className="relative mt-3 space-y-1 border-l border-[var(--book-hairline)] pl-4">
              {group.sections.map((section) => {
                const active = section.id === selectedId;
                return (
                  <li key={section.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(section.id)}
                      aria-pressed={active}
                      className={`book-map-mobile-node relative min-h-11 w-full px-3 py-3 text-left transition-colors before:absolute before:-left-[1.18rem] before:top-1/2 before:h-2 before:w-2 before:-translate-y-1/2 before:border before:bg-[var(--book-paper)] ${
                        active
                          ? "text-[var(--book-ink)] before:border-[var(--book-cinnabar)] before:bg-[var(--book-cinnabar)]"
                          : "text-[var(--book-muted)] before:border-[var(--book-hairline)] hover:text-[var(--book-ink)]"
                      }`}
                    >
                      <span className="block font-mono text-[8px] uppercase tracking-[0.14em] opacity-70">
                        {sectionLabel(section)}
                      </span>
                      <span className="mt-1 block font-serif text-base font-semibold leading-tight">
                        {section.title}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>

      <EditionInspector manifest={manifest} section={selectedSection} />

      <div className="mt-7 flex justify-end">
        <Link
          to="/doctrine"
          className="inline-flex min-h-11 items-center gap-2 text-sm text-[var(--book-muted)] underline decoration-[var(--book-hairline)] underline-offset-4 transition-colors hover:text-[var(--book-ink)]"
        >
          <Network className="h-4 w-4" />
          Open the Book One concept map
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}
