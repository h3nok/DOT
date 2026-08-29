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

    expect(source).toContain("config.stillness");
    expect(source).toContain("config.enabled");
  });

  it("composes hero controls from the shared Appearance contracts", () => {
    const proposition = readFileSync(join(HERE, "HeroProposition.tsx"), "utf8");
    const inquiry = readFileSync(join(HERE, "HeroAsk.tsx"), "utf8");
    const styles = readFileSync(join(HERE, "home.css"), "utf8");

    expect(proposition).toContain("dot-reading-action home-hero-primary-action");
    expect(proposition).toContain("appearance-ui-control home-hero-secondary-action");
    expect(inquiry).toContain("appearance-ui-control home-ask");
    expect(inquiry).toContain("home-ask__lenses");
    expect(inquiry).toContain("home-ask__prompts");
    expect(inquiry).not.toContain("home-ask-command-menu");
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

    expect(architecture).not.toContain("<tspan");
    expect(architecture).not.toContain("home-architecture-label-backplane");
    expect(architecture).toContain('viewBox="30 0 830 700"');
    expect(architecture).toContain('home-architecture-label-spine" d="M660 54V500"');
    expect(architecture).toContain('className="home-architecture-label-key" x="676"');
    expect(styles).toContain(".home-hero-architecture__svg path");
    expect(styles).toContain("vector-effect: non-scaling-stroke");
    expect(styles).toMatch(
      /html\[data-ui-style="neural"\] \.home-architecture-causal-trace path[\s\S]*?filter: none;/,
    );
    expect(styles).toMatch(
      /\.home-architecture-frame-boundary\s*\{[\s\S]*?stroke-width: 1\.5;/,
    );
  });

  it("keeps causal pressure and reflection arrows local to Little c", () => {
    const architecture = readFileSync(join(HERE, "HeroArchitecture.tsx"), "utf8");
    const styles = readFileSync(join(HERE, "home.css"), "utf8");

    expect(architecture).toContain("M282 309C298 318 311 328 322 338");
    expect(architecture).toContain("M414 309C398 318 385 328 374 338");
    expect(architecture).toContain("M411 400C397 393 386 383 377 373");
    expect(architecture).not.toContain("M184 252C232 270 270 298 308 324");
    expect(styles).toContain(".home-architecture-frame-pressure path");
    expect(styles).toContain(".home-architecture-reflection path");
  });

  it("uses geometry rather than a Reflection label to communicate spatial return", () => {
    const architecture = readFileSync(join(HERE, "HeroArchitecture.tsx"), "utf8");
    const styles = readFileSync(join(HERE, "home.css"), "utf8");

    expect(architecture).not.toContain('data-label="reflection"');
    expect(architecture).not.toContain("home-architecture-spatial-lattice");
    expect(architecture).not.toContain("home-architecture-rim-highlight");
    expect(architecture).not.toContain("home-architecture-depth-shells");
    expect(architecture).not.toContain("home-architecture-frame-depth");
    expect(architecture).toContain("home-architecture-projection-marks");
    expect(architecture).toContain('data-depth={depth}');
    expect(styles).toContain("--peer-depth-opacity");
    expect(styles).toContain("opacity: var(--peer-depth-opacity, 1)");
  });

  it("changes the architecture's geometry with the selected UI style", () => {
    const architecture = readFileSync(join(HERE, "HeroArchitecture.tsx"), "utf8");
    const styles = readFileSync(join(HERE, "home.css"), "utf8");

    for (const style of ["neural", "minimal", "organic", "editorial", "cinematic"]) {
      expect(architecture).toContain(`home-architecture-style--${style}`);
      expect(styles).toContain(`data-ui-style="${style}"`);
    }

    expect(architecture).toContain("home-architecture-peer-disc");
    expect(architecture).toContain("home-architecture-peer-diamond");
    expect(architecture).toContain("home-architecture-editorial-measure");
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
