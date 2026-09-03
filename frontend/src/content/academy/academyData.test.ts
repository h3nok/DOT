import { describe, expect, it } from "vitest";

import { academyAreas, academyAreasFor, academyPrograms } from "./academyData";

describe("Academy information architecture", () => {
  it("contains the eight finite forms of Academy work exactly once", () => {
    expect(academyAreas.map((area) => area.id)).toEqual([
      "definitions",
      "diagrams",
      "hypotheses",
      "objections",
      "responses",
      "experiments",
      "excerpts",
      "essays",
    ]);
    expect(new Set(academyAreas.map((area) => area.id)).size).toBe(8);
  });

  it("places every area in one declared program", () => {
    const programIds = new Set(academyPrograms.map((program) => program.id));
    expect(academyAreas.every((area) => programIds.has(area.programId))).toBe(true);
    expect(
      academyPrograms.flatMap((program) => academyAreasFor(program.id)),
    ).toHaveLength(academyAreas.length);
  });

  it("never links an opening collection to an invented destination", () => {
    expect(
      academyAreas
        .filter((area) => area.phase === "opening")
        .every((area) => area.href === undefined && area.action === undefined),
    ).toBe(true);
  });

  it("keeps Book One outside the living Academy object map", () => {
    expect(academyAreas.some((area) => area.id === ("book" as never))).toBe(false);
    expect(academyAreas.some((area) => area.href === "/book/digital-organism-theory")).toBe(
      false,
    );
  });
});
