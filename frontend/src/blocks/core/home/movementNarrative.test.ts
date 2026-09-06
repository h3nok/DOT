import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const HERE = join(process.cwd(), "src", "blocks", "core", "home");

describe("homepage movement narrative", () => {
  it("teaches the four layers without inserting a second competing diagram", () => {
    const home = readFileSync(join(HERE, "HomePage.tsx"), "utf8");
    const layers = readFileSync(join(HERE, "TheoryLayerJourney.tsx"), "utf8");

    expect(home.indexOf("<TheoryLayerJourney")).toBeLessThan(
      home.indexOf('id="choose-path"'),
    );
    expect(home).not.toContain("<ArchitectureDiagram />");
    expect(layers.indexOf('id: "possibility-field"')).toBeLessThan(
      layers.indexOf('id: "big-c"'),
    );
    expect(layers.indexOf('id: "big-c"')).toBeLessThan(
      layers.indexOf('id: "reality-frame"'),
    );
    expect(layers.indexOf('id: "reality-frame"')).toBeLessThan(
      layers.indexOf('id: "little-c"'),
    );
    expect(layers).toContain("I place T and E before Big C");
    expect(layers).toContain("the Big Bang may mark the beginning of RF₀");
    expect(layers).toContain("not the beginning of everything");
    expect(layers).toContain("Other Reality Frames may exist");
    expect(layers).toContain("RF₀ is exactly the physical universe");
    expect(layers).toContain("DOT calls this world RF₀, or Reality Frame zero");
    expect(layers).toContain("generated does not mean unreal");
    expect(layers).toContain("It forms intent, acts within RF₀");
    expect(layers).toContain("You can examine how the world appears in your own experience");
    expect(layers).toContain("awareness can loosen its identification with the body");
    expect(layers).toContain("DOT needs a repeatable way to distinguish those explanations");
    expect(layers).not.toContain("its generation of Reality Frames have not been publicly measured");
    expect(layers).not.toContain("Neither is an external substance, container, or predecessor");
  });

  it("gives every layer one large identity and the same claim structure", () => {
    const layers = readFileSync(join(HERE, "TheoryLayerJourney.tsx"), "utf8");
    const guidedArgument = readFileSync(
      join(process.cwd(), "src", "shared", "GuidedArgument.tsx"),
      "utf8",
    );

    expect(layers).toContain("home-theory-layer-card");
    expect(layers).toContain("home-theory-layer-term");
    expect(guidedArgument).toContain("What we know");
    expect(guidedArgument).toContain("The open question");
    expect(guidedArgument).toContain("DOT proposes");
    expect(guidedArgument).toContain("What remains unproven");
    expect(layers).toContain("home-theory-layer-human-stakes");
    expect(layers).toContain("home-theory-layer-memory");
    expect(layers).toContain("Continuity carries. Possibility opens.");
    expect(layers).toContain("Consciousness persists, develops, and generates.");
    expect(layers).toContain("A generated world is still a consequential world.");
    expect(layers).toContain("You experience locally, choose through a body");
    expect(layers.match(/memoryWord:/g) ?? []).toHaveLength(4);
    expect(layers.match(/memoryLine:/g) ?? []).toHaveLength(4);
    // The rail identifies each layer with figure, term, and status only; the
    // page nav carries orientation, so no second index or breadcrumb.
    expect(layers).not.toContain("ConceptMemoryPath");
    expect(layers).not.toContain("home-theory-layer-prerequisite");
    expect(layers).toContain("From possibility to persistence");
    expect(layers).toContain("From persistence to consequence");
    expect(layers).toContain("From consequence to choice");
    // The Little c figure reads as a loop, not only a containment diagram.
    expect(layers).toContain("Consequence");
    expect(layers).toContain("returns.");
    expect(layers).toContain("<GuidedArgument");
    expect(layers).toContain("<ReadingPathwayGroup");
    expect(layers).toContain("Starting assumption");
    expect(layers).toContain("Proposed explanation");
    expect(layers).not.toContain("CircleAlert");
    expect(layers).not.toContain("home-theory-layer-progress");
    expect(layers).toContain("home-theory-layer-sources");
    expect(layers).toContain("Research to compare");
    expect(layers).toContain("DOT · Book One");
    expect(layers).toContain("Book One · Fixed edition");
    expect(layers).toContain("Independent source");
    expect(layers).toContain('rel="noopener noreferrer"');
    expect(layers).toContain("Continue to");
    expect(layers).toContain("Planck 2018 Results · Cosmological Parameters");
    expect(layers).toContain("Seth & Bayne · Nature Reviews Neuroscience · 2022");
    expect(layers.match(/term:/g) ?? []).toHaveLength(4);
    expect(layers.match(/conventional:/g) ?? []).toHaveLength(4);
    expect(layers.match(/scope:/g) ?? []).toHaveLength(4);
    expect(layers.match(/question:/g) ?? []).toHaveLength(4);
    expect(layers.match(/bookReading:/g) ?? []).toHaveLength(4);
    expect(layers.match(/externalReading:/g) ?? []).toHaveLength(4);
    expect(layers).not.toContain("Not existential closure");
  });

  it("applies the reader-owned font choice to the public theory dossiers", () => {
    const appearance = readFileSync(
      join(process.cwd(), "src", "organism", "appearance.css"),
      "utf8",
    );

    for (const face of ["serif", "sans", "humanist", "mono"]) {
      expect(appearance).toContain(
        `html[data-reading="${face}"] .home-theory-layer-card`,
      );
    }
  });

  it("closes with the living Academy while keeping the book distinct", () => {
    const home = readFileSync(join(HERE, "HomePage.tsx"), "utf8");

    expect(home).toContain("Continue with the Academy.");
    expect(home).toContain("Enter DOT Academy");
    expect(home).toContain("Read Book One as a fixed edition");
    expect(home).not.toContain("Request an invitation to the circle");
  });

  it("keeps claim levels explicit and the funding ask away from the front door", () => {
    const home = readFileSync(join(HERE, "HomePage.tsx"), "utf8");
    const proposition = readFileSync(join(HERE, "HeroProposition.tsx"), "utf8");
    const layers = readFileSync(join(HERE, "TheoryLayerJourney.tsx"), "utf8");

    expect(proposition).toContain("Held as hypothesis · Open to challenge");
    expect(layers.match(/status:/g) ?? []).toHaveLength(4);
    expect(home).not.toContain("SUPPORT_PAYMENT_LINK");
    expect(home).not.toContain("Support the work");
  });

  it("moves from the theory directly to the Academy invitation", () => {
    const home = readFileSync(join(HERE, "HomePage.tsx"), "utf8");
    const layers = readFileSync(join(HERE, "TheoryLayerJourney.tsx"), "utf8");

    // The standalone boundary section is retired; each panel carries its own
    // test boundary and the hero badge declares the claim level (ADR-0026).
    expect(home).not.toContain('id="epistemic-boundary"');
    expect(home).not.toContain("Publicly grounded");
    expect(layers.match(/boundary:/g) ?? []).toHaveLength(4);
    expect(home).not.toContain('id="orientation"');
    expect(home).not.toContain("Intellectual renewal · Spiritual grounding");
    expect(home).not.toContain("A shared vocabulary · 10 concepts");
    expect(home.toLowerCase()).not.toContain("belief");
    expect(home.toLowerCase()).not.toContain("believe");
  });
});
