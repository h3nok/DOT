import { beforeEach, describe, expect, it } from "vitest";
import {
  addChild,
  clearGraph,
  draftToNode,
  findNode,
  genNodeId,
  GRAPH_STORAGE_KEY,
  loadGraph,
  removeNode,
  resolveChain,
  saveGraph,
  updateNode,
} from "./graphStore";
import type { DotNode } from "./types";

const seed = (): DotNode => ({
  id: "self",
  label: "Root",
  kind: "self",
  children: [
    { id: "a", label: "A", children: [{ id: "a1", label: "A1" }] },
    { id: "b", label: "B" },
  ],
});

describe("graphStore tree operations", () => {
  it("finds nodes at any depth and reports misses", () => {
    expect(findNode(seed(), "a1")?.label).toBe("A1");
    expect(findNode(seed(), "nope")).toBeNull();
  });

  it("resolves a path into a chain and stops at the first break", () => {
    expect(resolveChain(seed(), ["self", "a", "a1"]).map((n) => n.id)).toEqual([
      "self",
      "a",
      "a1",
    ]);
    expect(resolveChain(seed(), ["self", "ghost", "a1"]).map((n) => n.id)).toEqual(["self"]);
  });

  it("adds a child without mutating the original tree", () => {
    const original = seed();
    const next = addChild(original, "b", { id: "b1", label: "B1" });

    expect(findNode(next, "b")?.children?.map((c) => c.id)).toEqual(["b1"]);
    expect(findNode(original, "b")?.children).toBeUndefined();
  });

  it("updates a node without touching its siblings", () => {
    const next = updateNode(seed(), "a1", { label: "renamed" });

    expect(findNode(next, "a1")?.label).toBe("renamed");
    expect(findNode(next, "b")?.label).toBe("B");
  });

  it("removes a node and everything beneath it", () => {
    const next = removeNode(seed(), "a");

    expect(findNode(next, "a")).toBeNull();
    expect(findNode(next, "a1")).toBeNull();
    expect(next.children?.map((c) => c.id)).toEqual(["b"]);
  });

  it("never removes the root", () => {
    expect(removeNode(seed(), "self").id).toBe("self");
  });

  it("derives ids the server will accept, even from unfriendly labels", () => {
    const pattern = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
    for (const label of ["Stay Whole", "  ", "Ünïcodé!!", "a/b?c"]) {
      expect(genNodeId(label)).toMatch(pattern);
    }
  });

  it("gives two nodes with the same label distinct ids", () => {
    expect(genNodeId("Work")).not.toBe(genNodeId("Work"));
  });

  it("turns a draft into a node, dropping blank optional fields", () => {
    const node = draftToNode({ label: "  Work  ", description: "   ", href: "/work" });

    expect(node.label).toBe("Work");
    expect(node.description).toBeUndefined();
    expect(node.href).toBe("/work");
    expect(node.kind).toBe("attribute");
  });

  it("falls back to a usable label when the draft is empty", () => {
    expect(draftToNode({ label: "   " }).label).toBe("Untitled");
  });
});

describe("graphStore persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns the seed when nothing is cached", () => {
    expect(loadGraph(seed()).id).toBe("self");
  });

  it("round-trips a saved graph", () => {
    const tree = addChild(seed(), "self", { id: "c", label: "C" });
    saveGraph(tree, seed());

    expect(loadGraph(seed()).children?.map((c) => c.id)).toEqual(["a", "b", "c"]);
  });

  it("ignores an envelope saved for an older seed anatomy", () => {
    window.localStorage.setItem(
      GRAPH_STORAGE_KEY,
      JSON.stringify({
        fingerprint: "self(old())",
        graph: { id: "self", label: "Old", children: [] },
      }),
    );

    expect(loadGraph(seed()).label).toBe("Root");
  });

  it("ignores cached values that are not graph nodes", () => {
    window.localStorage.setItem(
      GRAPH_STORAGE_KEY,
      JSON.stringify({ fingerprint: "self(a(a1()),b())", graph: { id: "self" } }),
    );

    expect(loadGraph(seed()).label).toBe("Root");
  });

  it("falls back to the seed when the cache is corrupt", () => {
    window.localStorage.setItem(GRAPH_STORAGE_KEY, "{not json");

    expect(loadGraph(seed()).id).toBe("self");
  });

  it("clears the cache", () => {
    saveGraph(seed(), seed());
    clearGraph();

    expect(window.localStorage.getItem(GRAPH_STORAGE_KEY)).toBeNull();
  });
});
