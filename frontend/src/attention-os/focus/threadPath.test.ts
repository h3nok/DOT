import { describe, expect, it } from "vitest";
import {
  appendStep,
  clearThread,
  current,
  MAX_THREAD_STEPS,
  origin,
  type ThreadStep,
  walkBackTo,
} from "./threadPath";

const step = (id: string): ThreadStep => ({ id, label: id.toUpperCase() });

describe("the Thread (doc 12 §3)", () => {
  it("records the path of attention in order", () => {
    const thread = [step("a"), step("b")].reduce(appendStep, [] as ThreadStep[]);

    expect(thread.map((entry) => entry.id)).toEqual(["a", "b"]);
  });

  it("does not treat re-entering the current node as a move", () => {
    const thread = appendStep([step("a")], step("a"));

    expect(thread.map((entry) => entry.id)).toEqual(["a"]);
  });

  it("rewinds rather than looping when returning to an earlier node", () => {
    const thread = ["a", "b", "c"].map(step);

    expect(appendStep(thread, step("a")).map((entry) => entry.id)).toEqual(["a"]);
  });

  it("keeps a beginning and a current position", () => {
    const thread = ["a", "b", "c"].map(step);

    expect(origin(thread)?.id).toBe("a");
    expect(current(thread)?.id).toBe("c");
  });

  it("is finite: it compresses from the start instead of growing forever", () => {
    let thread: ThreadStep[] = [];
    for (let i = 0; i < MAX_THREAD_STEPS + 5; i++) {
      thread = appendStep(thread, step(`n${i}`));
    }

    expect(thread).toHaveLength(MAX_THREAD_STEPS);
    expect(current(thread)?.id).toBe(`n${MAX_THREAD_STEPS + 4}`);
  });

  it("walks back to a step already on the thread", () => {
    const thread = ["a", "b", "c"].map(step);

    expect(walkBackTo(thread, "b").map((entry) => entry.id)).toEqual(["a", "b"]);
  });

  it("ignores a walk-back to somewhere it has not been", () => {
    const thread = ["a", "b"].map(step);

    expect(walkBackTo(thread, "z")).toEqual(thread);
  });

  it("clears in one gesture", () => {
    expect(clearThread()).toEqual([]);
    expect(origin([])).toBeNull();
    expect(current([])).toBeNull();
  });
});
