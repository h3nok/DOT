/**
 * The entry surface must not own a colour.
 *
 * The Appearance panel is the member's, not the page's: light/dark, accent
 * tint, stillness, and the living field all have to govern the front door the
 * same way they govern every reading surface. A literal colour anywhere in
 * these files is how that breaks — an earlier pass painted the hero on an
 * opaque black stage, which looked deliberate and silently overrode both the
 * theme and the member's tint.
 *
 * So this scans the hero for literals rather than trusting review to catch it.
 * Colour belongs in `var(--organism-accent*)`, `var(--background)`,
 * `var(--foreground)`, or a Tailwind token that resolves to them.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const HERO_FILES = [
  "HomePage.tsx",
  "EmergenceMark.tsx",
  "HeroConcepts.tsx",
  "HeroAsk.tsx",
  "HeroArchitecture.tsx",
  "HeroProposition.tsx",
  "TheoryLayerJourney.tsx",
  "HomeJourneyNav.tsx",
  "ArchitectureDiagram.tsx",
  "StepOneUnlearning.tsx",
] as const;

const HERE = join(process.cwd(), "src", "blocks", "core", "home");

/** `#fff`, `#f2ead9`, `rgb(...)`, `rgba(...)`, `hsl(...)` written literally. */
const LITERAL_COLOUR = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/;

describe("home entry theme compatibility", () => {
  for (const file of HERO_FILES) {
    it(`${file} carries no literal colour`, () => {
      const source = readFileSync(join(HERE, file), "utf8");

      const offenders = source
        .split("\n")
        .map((line, index) => ({ line: line.trim(), number: index + 1 }))
        .filter(({ line }) => LITERAL_COLOUR.test(line));

      expect(
        offenders,
        `Use a theme or organism-accent variable instead:\n${offenders
          .map((o) => `  ${file}:${o.number}  ${o.line}`)
          .join("\n")}`,
      ).toEqual([]);
    });
  }

  it("keeps the hero transparent so the living field shows through", () => {
    const source = readFileSync(join(HERE, "HomePage.tsx"), "utf8");

    // An opaque stage on the section itself would seal the membrane out. The
    // one permitted `bg-background` is the veil, which animates away.
    expect(source).not.toMatch(/<section[^>]*\sclassName="[^"]*\bbg-(?!background\b)\S/);
  });

  it("treats Appearance-panel stillness as a reason not to animate", () => {
    const source = readFileSync(join(HERE, "HomePage.tsx"), "utf8");
    const styles = readFileSync(join(HERE, "home.css"), "utf8");

    expect(source).toContain("config.stillness");
    expect(source).toContain("config.enabled");
    expect(styles).toContain('html[data-field="off"] .home-hero-environment::before');
  });

  it("composes hero controls from the shared Appearance contracts", () => {
    const home = readFileSync(join(HERE, "HomePage.tsx"), "utf8");
    const proposition = readFileSync(join(HERE, "HeroProposition.tsx"), "utf8");
    const styles = readFileSync(join(HERE, "home.css"), "utf8");

    expect(proposition).toContain("dot-reading-action home-hero-primary-action");
    expect(proposition).toContain("appearance-ui-control home-hero-secondary-action");
    expect(proposition).not.toContain("<ul");
    expect(home).toContain("<HeroAsk");
    expect(home).toContain("<TwinSurface");
    expect(home).toContain('className="home-hero-ask"');
    expect(styles).toContain("var(--appearance-ui-control-radius)");
    expect(styles).toContain("var(--appearance-ui-control-background)");
    expect(styles).toContain("var(--appearance-ui-backdrop)");
    expect(styles).toContain('html[data-ui-style="neural"] .home-hero-stage');
    expect(styles).toContain('html[data-ui-style="minimal"] .home-hero-stage');
    expect(styles).toContain('html[data-ui-style="organic"] .home-hero-stage');
    expect(styles).toContain('html[data-ui-style="editorial"] .home-hero-stage');
    expect(styles).toContain('html[data-ui-style="cinematic"] .home-hero-stage');
  });

  it("keeps the inquiry field neutral and open until the reader acts", () => {
    const styles = readFileSync(join(HERE, "home.css"), "utf8");
    const field = styles.match(/\.home-ask\s*\{([\s\S]*?)\n\}/)?.[1];
    const inquiry = styles.match(/\.home-inquiry\s*\{([\s\S]*?)\n\}/)?.[1];
    const selectedLens = styles.match(
      /\.home-ask__lenses button\[aria-pressed="true"\]\s*\{([\s\S]*?)\n\}/,
    )?.[1];

    expect(field).toContain("border: 0;");
    expect(styles).toContain(".home-ask::after");
    expect(inquiry).toContain("--ask-ink: color-mix");
    expect(inquiry).not.toContain("--ask-ink: var(--organism-accent-strong)");
    expect(selectedLens).toContain("color: var(--foreground)");
    expect(selectedLens).not.toContain("var(--ask-active)");
    expect(styles).toContain('html[data-ui-style="minimal"] .home-inquiry');
    expect(styles).toContain('html[data-ui-style="organic"] .home-inquiry');
  });

  it("keeps the architecture optically sharp at fractional SVG scales", () => {
    const architecture = readFileSync(join(HERE, "HeroArchitecture.tsx"), "utf8");
    const styles = readFileSync(join(HERE, "home.css"), "utf8");

    expect(architecture).toContain("home-architecture-label-subscript");
    expect(architecture).not.toContain("home-architecture-label-backplane");
    expect(architecture).toContain('viewBox="0 0 700 700"');
    expect(architecture).toContain("home-architecture-ring-labels");
    expect(architecture).toContain("home-architecture-ring-label");
    // The drawing stands alone: no visible legend or heading chrome.
    expect(architecture).not.toContain("home-architecture-flow-key");
    expect(styles).not.toContain("home-architecture-flow-key");
    expect(styles).toContain(".home-hero-architecture__svg path");
    expect(styles).toContain("vector-effect: non-scaling-stroke");
    expect(styles).toContain("paint-order: stroke fill");
    expect(styles).toContain("baseline-shift: sub");
    expect(styles).toMatch(
      /html\[data-ui-style="neural"\] \.home-architecture-causal-trace path[\s\S]*?filter: none;/,
    );
    expect(styles).toMatch(
      /\.home-architecture-frame-boundary\s*\{[\s\S]*?stroke-width: 1\.5;/,
    );
  });

  it("keeps the two arrow vocabularies distinct and the intent trace singular", () => {
    const architecture = readFileSync(join(HERE, "HeroArchitecture.tsx"), "utf8");
    const styles = readFileSync(join(HERE, "home.css"), "utf8");

    // Inbound options arrive at the awareness radius; the chevron stays open.
    expect(architecture).toContain("AWARENESS_RADIUS = 72");
    expect(architecture).toContain("OPTION_ANGLES");
    expect(architecture).toContain('d="M1 0L6 3L1 6"');
    expect(architecture).not.toContain('d="M0 0L6 3L0 6Z"');
    // The chosen option sits where the merged awareness & potential trace crosses the ring.
    expect(architecture).toContain('data-chosen="true"');
    expect(architecture).toContain("AWARENESS_TRACE_D");
    expect(architecture).toContain("POTENTIAL_TRACE_D");
    expect(architecture).toContain("home-architecture-awareness-trace");
    expect(architecture).toContain("home-architecture-potential-trace");
    expect(architecture).not.toContain("M184 252C232 270 270 298 308 324");
    expect(architecture).not.toContain("home-architecture-reflection");
    expect(styles).toContain(".home-architecture-frame-pressure line");
    expect(styles).toContain(".home-architecture-awareness-ring");
    expect(styles).toContain(".home-architecture-awareness-trace");
    expect(styles).toContain(".home-architecture-potential-trace");
    // Potential arcs in the free quadrant.
    expect(architecture).toContain("AWARENESS_POTENTIAL_RADII");
    expect(architecture).toContain("AWARENESS_ARC_SPAN");
    expect(styles).toContain(".home-architecture-awareness-potential path");
    expect(styles).toMatch(/\.home-architecture-pressure-arrow\s*\{[\s\S]*?fill: none;/);
    expect(styles).not.toContain(".home-architecture-reflection path");
  });

  it("uses geometry rather than a Reflection label to communicate spatial return", () => {
    const architecture = readFileSync(join(HERE, "HeroArchitecture.tsx"), "utf8");

    expect(architecture).not.toContain('data-label="reflection"');
    expect(architecture).not.toContain("home-architecture-spatial-lattice");
    expect(architecture).not.toContain("home-architecture-rim-highlight");
    expect(architecture).not.toContain("home-architecture-depth-shells");
    expect(architecture).not.toContain("home-architecture-frame-depth");
    expect(architecture).toContain("home-architecture-projection-marks");
    expect(architecture).not.toContain("PEER_FRAMES");
    expect(architecture).not.toContain('data-depth={depth}');
    expect(architecture).not.toContain("home-architecture-frame-horizon");
    // Coupling semantics live in the accessible caption now, not a legend.
    expect(architecture).toContain("constraint · consequence");
  });

  it("states the theory's epistemic status without overclaiming the ontology", () => {
    const architecture = readFileSync(join(HERE, "HeroArchitecture.tsx"), "utf8");

    // The visible heading is gone; the caption still declares the status.
    expect(architecture).toContain("stated as hypothesis");
    expect(architecture).toContain("T · E");
    expect(architecture).toContain("Big C");
    expect(architecture).toContain("RF₀");
    expect(architecture).toContain("Little c");
    expect(architecture).toContain("T and E precede Big C");
    expect(architecture).toMatch(/conceptual\s+domains,\s+not\s+spatial\s+boundaries/);
    expect(architecture).toContain("Intent · embodied action");
    expect(architecture).not.toContain("possibility within Big C");
    expect(architecture).not.toContain("ONE OF MANY");
    expect(architecture).not.toContain("RFᵢ");
    expect(architecture).not.toContain("acts on RF");
    expect(architecture).not.toContain("BIG C");
    expect(architecture).not.toContain("LITTLE c");
  });

  it("depicts RF₀ as a social environment that can brighten awareness", () => {
    const architecture = readFileSync(join(HERE, "HeroArchitecture.tsx"), "utf8");
    const styles = readFileSync(join(HERE, "home.css"), "utf8");

    expect(architecture).toContain("SOCIAL_CENTRES");
    expect(architecture).toContain("social environment");
    expect(architecture).toContain("home-architecture-peer-centre");
    expect(architecture).toContain("home-architecture-awareness-brightening");
    expect(architecture).not.toContain("toward Love");
    expect(styles).toContain(".home-architecture-social-relations line");
    expect(styles).toContain(".home-architecture-peer-awareness");
    expect(styles).toContain(".home-architecture-awareness-brightening");
  });

  it("labels the rings through protected gaps and keys each layer by colour", () => {
    const architecture = readFileSync(join(HERE, "HeroArchitecture.tsx"), "utf8");
    const styles = readFileSync(join(HERE, "home.css"), "utf8");

    expect(architecture).toContain('data-layer="origin"');
    expect(architecture).toContain('data-layer="big-c"');
    expect(architecture).toContain('data-layer="reality-frame"');
    expect(architecture).toContain('data-layer="little-c"');
    expect(architecture).toContain('data-layer="awareness-radius"');
    // The concept labels deep-link into their theory dossiers.
    expect(architecture).toContain('href="#possibility-field"');
    expect(architecture).toContain('href="#big-c"');
    expect(architecture).toContain('href="#reality-frame"');
    expect(architecture).toContain('href="#little-c"');
    expect(styles).toContain(".home-architecture-ring-label a");
    expect(architecture).toContain("home-architecture-awareness-callout");
    expect(architecture).not.toContain('data-potential="true"');
    expect(architecture.match(/className="home-architecture-ring-label"/g) ?? []).toHaveLength(5);
    expect(architecture).not.toContain('className="home-architecture-ring-label" data-layer="origin">\n            <rect');
    expect(styles).not.toContain(".home-architecture-ring-label rect");
    expect(styles).toContain(".home-architecture-ring-label text");
    expect(styles).toContain("stroke: var(--background)");
    expect(styles).toContain(".home-architecture-label-leader");
    expect(styles).toContain("--architecture-origin");
    expect(styles).toContain("--architecture-big-c");
    expect(styles).toContain("--architecture-rf");
    expect(styles).toContain("--architecture-local");
    expect(styles).toContain(".home-architecture-origin-boundary");
    expect(styles).toContain(".home-architecture-big-c-zone");
    expect(styles).toContain(".home-architecture-frame-zone");
  });

  it("changes the architecture's geometry with the selected UI style", () => {
    const architecture = readFileSync(join(HERE, "HeroArchitecture.tsx"), "utf8");
    const styles = readFileSync(join(HERE, "home.css"), "utf8");

    for (const style of ["neural", "minimal", "organic", "editorial", "cinematic"]) {
      expect(architecture).toContain(`home-architecture-style--${style}`);
      expect(styles).toContain(`data-ui-style="${style}"`);
    }

    expect(architecture).toContain("home-architecture-neural-lattice");
    expect(architecture).toContain("home-architecture-organic-rings");
    expect(architecture).toContain("home-architecture-minimal-axis");
    expect(architecture).toContain("home-architecture-editorial-measure");
    expect(architecture).toContain("home-architecture-cinematic-field");
    expect(architecture).not.toContain("home-architecture-field-traces");
    expect(architecture).not.toContain("M348 155V549M151 352H545");
    expect(
      architecture.match(/className="home-architecture-local-ring"/g) ?? [],
    ).toHaveLength(1);
  });

  it("keeps the architecture presentational rather than cursor-driven", () => {
    const architecture = readFileSync(join(HERE, "HeroArchitecture.tsx"), "utf8");
    const styles = readFileSync(join(HERE, "home.css"), "utf8");

    expect(architecture).not.toContain("onPointer");
    expect(architecture).not.toContain("requestAnimationFrame");
    expect(architecture).not.toContain("home-architecture-cursor");
    expect(styles).not.toContain("home-architecture-cursor");
  });
});
