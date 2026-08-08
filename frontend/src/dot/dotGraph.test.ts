import { describe, expect, it } from "vitest";
import { dotGraph } from "./dotGraph";
import type { DotNode } from "./types";

/**
 * The seed graph is a payload the orchestrator validates (`ProfileNode`). These
 * mirror the server's rules so a design mistake fails here rather than as a 422
 * the first time it is published, and pin the movement's anatomy (ADR-0017).
 */

const ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
const KINDS = new Set(["self", "attribute", "page", "external"]);
const SURFACES = new Set(["publications", "circle", "vault", "support", "twin"]);
const SAFE_HREF = /^(\/|https?:\/\/|mailto:|tel:)/;

const MAX_DEPTH = 8;
const MAX_NODES = 512;

function walk(
  node: DotNode,
  depth = 0,
  path = "",
  out: { node: DotNode; depth: number; path: string }[] = [],
) {
  const here = path ? `${path}/${node.id}` : node.id;
  out.push({ node, depth, path: here });
  for (const child of node.children ?? []) walk(child, depth + 1, here, out);
  return out;
}

const all = walk(dotGraph);

describe("the movement graph seed", () => {
  it("is rooted in the theory, not a person", () => {
    expect(dotGraph.id).toBe("dot");
    expect(dotGraph.kind).toBe("self");
    expect(dotGraph.children?.length).toBeGreaterThan(0);
  });

  it("uses ids the server will accept", () => {
    const bad = all.filter(({ node }) => !ID.test(node.id)).map(({ path }) => path);
    expect(bad).toEqual([]);
  });

  it("has unique ids among siblings", () => {
    const clashes: string[] = [];
    for (const { node, path } of all) {
      const seen = new Set<string>();
      for (const child of node.children ?? []) {
        if (seen.has(child.id)) clashes.push(`${path}/${child.id}`);
        seen.add(child.id);
      }
    }
    expect(clashes).toEqual([]);
  });

  it("only uses known kinds and surfaces", () => {
    const badKind = all
      .filter(({ node }) => node.kind !== undefined && !KINDS.has(node.kind))
      .map(({ path }) => path);
    const badSurface = all
      .filter(({ node }) => node.surface !== undefined && !SURFACES.has(node.surface))
      .map(({ path }) => path);
    expect({ badKind, badSurface }).toEqual({ badKind: [], badSurface: [] });
  });

  it("links only to internal paths or safe schemes", () => {
    const unsafe = all
      .filter(({ node }) => node.href !== undefined && !SAFE_HREF.test(node.href))
      .map(({ path, node }) => `${path} -> ${node.href}`);
    expect(unsafe).toEqual([]);
  });

  it("stays inside the server's size and depth limits", () => {
    expect(all.length).toBeLessThanOrEqual(MAX_NODES);
    expect(Math.max(...all.map(({ depth }) => depth))).toBeLessThanOrEqual(MAX_DEPTH);
  });

  it("keeps the first ring small enough to choose from", () => {
    // Orientation, not a menu: the ring is a decision surface (L10).
    expect(dotGraph.children!.length).toBeLessThanOrEqual(8);
  });

  it("gives every limb a one-line essence", () => {
    const silent = dotGraph.children!.filter((child) => !child.description).map((c) => c.id);
    expect(silent).toEqual([]);
  });

  it("is the movement's anatomy, canon first", () => {
    // ADR-0017: fixed text, living theory, what to do, what was built, who carries it.
    expect(dotGraph.children!.map((child) => child.id)).toEqual([
      "canon",
      "theory",
      "practice",
      "applied",
      "movement",
    ]);
  });

  it("keeps the founder inside the movement rather than at the centre", () => {
    const steward = all.find(({ node }) => node.id === "henok");

    expect(steward, "steward node must exist").toBeDefined();
    expect(steward!.path.startsWith("dot/movement/")).toBe(true);
  });

  it("opens the applied limb onto the register that enforces claim levels", () => {
    // ADR-0017 requires a declared claim level on every applied entry. That
    // guarantee lives in content/applied/openSeams.test.ts, checked against the
    // released reader contract; the limb's job is to route there. Asserting it
    // here keeps the two from drifting apart into a rule nothing carries.
    const applied = dotGraph.children!.find((child) => child.id === "applied")!;

    expect(applied.href).toBe("/applied");
    expect(applied.description).not.toBe("Coming soon");
  });

  it("states how every node relates to its parent", () => {
    const relations = new Set([
      "depends-on",
      "leads-to",
      "contrasts",
      "defines",
      "applies",
    ]);
    const unstated = all
      .filter(({ node, depth }) => depth > 0 && !node.relation)
      .map(({ path }) => path);
    const invalid = all
      .filter(({ node }) => node.relation && !relations.has(node.relation))
      .map(({ path }) => path);

    expect({ unstated, invalid }).toEqual({ unstated: [], invalid: [] });
  });
});
