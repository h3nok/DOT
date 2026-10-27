import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildNarrationCues, narrationCaptionData, narrationSrt, narrationVtt, validateNarrationSources } from "./voiceover-captions.mjs";

function fixture(expected: string, actual = expected, number = 1) {
  const words = actual.split(/\s+/).map((word, index) => ({ word, start: 0.4 + index * 0.32, end: 0.65 + index * 0.32 }));
  return {
    scene: { id: `scene-${number}`, number, start: 5, end: 60, primaryStatement: expected },
    record: { number, expected, actual, segments: [{ words }], source: `scene-${number}.mp3`, sha256: "0".repeat(64) },
  };
}

describe("captions aligned to recorded narration", () => {
  it("keeps the approved wording and punctuation while aligning contractions to actual words", () => {
    const { scene, record } = fixture("I'm here; the model is not the road.", "I am here the model is not the road");
    const cues = buildNarrationCues([scene], [record], { durationSeconds: 70 });
    expect(cues[0].startSeconds).toBeCloseTo(5 + 2.4 + 0.4);
    expect(cues.map((cue: { text: string }) => cue.text).join(" ").replace(/\n/g, " "))
      .toBe(scene.primaryStatement);
    expect(narrationSrt(cues)).toMatch(/^1\n00:00:07,800 -->/);
    expect(narrationVtt(cues)).toMatch(/^WEBVTT\n\n00:00:07\.800 -->/);
  });

  it("makes readable two-line cues and retains every word of a longer passage", () => {
    const text = "A short reply can have more than one explanation. You could pause and ask what the person meant. Experience, interpretation, intent, action, and consequence form a loop. Noticing the loop gives you something concrete to explore in your own life.";
    const { scene, record } = fixture(text);
    const cues = buildNarrationCues([scene], [record], { durationSeconds: 70 });
    expect(cues.length).toBeGreaterThanOrEqual(4);
    for (const cue of cues) {
      const lines = cue.text.split("\n");
      expect(lines.length).toBeLessThanOrEqual(2);
      expect(lines.every((line: string) => line.length <= 42)).toBe(true);
      expect(cue.endSeconds).toBeGreaterThan(cue.startSeconds);
    }
    expect(cues.map((cue: { text: string }) => cue.text.replace(/\n/g, " ")).join(" ")).toBe(text);
  });

  it("aligns a spoken acronym and a small recognition difference without copying ASR errors", () => {
    const text = "The model proposes that we encounter RF-zero through a living body and our experience.";
    const actual = "The model proposes that we encounter R F zero through a living body and our experiences.";
    const { scene, record } = fixture(text, actual);
    const cues = buildNarrationCues([scene], [record], { durationSeconds: 70 });
    expect(cues.map((cue: { text: string }) => cue.text.replace(/\n/g, " ")).join(" ")).toBe(text);
    expect(cues.at(-1).endSeconds).toBeCloseTo(7.4 + record.segments[0].words.at(-1)!.end + 0.14);
  });

  it("keeps a final word with its phrase rather than flashing a one-word orphan", () => {
    const text = "Let your experience inform the inquiry, and let inquiry change how you meet your experience.";
    const { scene, record } = fixture(text);
    const cues = buildNarrationCues([scene], [record], { durationSeconds: 70 });
    expect(cues.every((cue: { text: string }) => cue.text.split(/\s+/).length >= 3)).toBe(true);
    expect(cues.map((cue: { text: string }) => cue.text.replace(/\n/g, " ")).join(" ")).toBe(text);
  });

  it("publishes only player timing and approved text, without ASR or source provenance", () => {
    const data = narrationCaptionData([{
      startSeconds: 5.18000001, endSeconds: 7.89999999, text: "The approved words.",
      sceneId: "scene-1", editRatio: 0.01, source: "/private/audio.mp3", actual: "Recognition text.",
    }]);
    expect(data).toEqual([{ startSeconds: 5.18, endSeconds: 7.9, text: "The approved words." }]);
  });

  it("rejects stale prose and unknown or duplicate scene identifiers", () => {
    const { scene, record } = fixture("Keep the approved words.");
    expect(() => buildNarrationCues([scene], [{ ...record, expected: "An older draft." }], { durationSeconds: 70 })).toThrow("Stale expected narration");
    expect(() => buildNarrationCues([{ ...scene, id: "scene-2" }], [record], { durationSeconds: 70 })).toThrow("Mismatched scene identifier");
    expect(() => buildNarrationCues([scene], [{ ...record, number: 8 }], { durationSeconds: 70 })).toThrow("Missing ASR timestamps");
    expect(() => buildNarrationCues([scene, { ...scene, number: 2, id: "scene-2" }], [record, record], { durationSeconds: 70 })).toThrow("Duplicate or invalid");
  });

  it("rejects unrelated recognition and reversed word timestamps", () => {
    const { scene, record } = fixture("Keep the approved narration clear.", "Completely unrelated words appear right here.");
    expect(() => buildNarrationCues([scene], [record], { durationSeconds: 70 })).toThrow("ASR differs too much");
    const reversed = fixture("Keep the narration clear.");
    reversed.record.segments[0].words[2].start = 0.1;
    expect(() => buildNarrationCues([reversed.scene], [reversed.record], { durationSeconds: 70 })).toThrow("ASR word order changed");
  });

  it("rejects captions extending beyond a scene or into the silent final card", () => {
    const { scene, record } = fixture("Explore at your own pace.");
    expect(() => buildNarrationCues([{ ...scene, end: 6 }], [record], { durationSeconds: 70 })).toThrow("Caption spills beyond");
    expect(() => buildNarrationCues([scene], [record], { durationSeconds: 13 })).toThrow("silent closing card");
  });

  it("checks the current audio bytes and rejects stale hashes or the wrong numbered source", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "dot-caption-test-"));
    try {
      const bytes = Buffer.from("A private audio fixture; no author recording.");
      await writeFile(path.join(directory, "scene-1.mp3"), bytes);
      const { record } = fixture("The source is current.");
      const current = { ...record, sha256: createHash("sha256").update(bytes).digest("hex") };
      await expect(validateNarrationSources([current], { rootDir: directory })).resolves.toBeUndefined();
      await expect(validateNarrationSources([record], { rootDir: directory })).rejects.toThrow("Stale ASR audio hash");
      await expect(validateNarrationSources([{ ...current, source: "scene-2.mp3" }], { rootDir: directory })).rejects.toThrow("Mismatched audio source");
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
