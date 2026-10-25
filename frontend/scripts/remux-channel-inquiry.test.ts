import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  buildRetimingPlan, chapterMetadata, inspectVideo, mixVoiceover,
  narrationSubtitles, remuxTrailer, videoEncoderArguments,
} from "./remux-channel-inquiry.mjs";
import { DEFAULT_FFMPEG, probeAudio, runFFmpeg } from "./voiceover-audio.mjs";

const sourceScenes = [
  { number: 1, id: "scene-1", start: 5, end: 5.5, actHeader: "01 // FIRST", primaryStatement: "First passage." },
  { number: 2, id: "scene-2", start: 5.5, end: 6, actHeader: "02 // SECOND", primaryStatement: "Second passage." },
];
const targets = sourceScenes.map((scene, i) => ({ ...scene, start: i === 0 ? 5 : 5.7, end: i === 0 ? 5.7 : 6.3 }));
const ffmpegAvailable = spawnSync(DEFAULT_FFMPEG, ["-version"], { stdio: "ignore" }).status === 0;
const directories: string[] = [];

async function fixture() {
  const directory = await mkdtemp(path.join(os.tmpdir(), "dot-remux-test-"));
  directories.push(directory);
  const masterDir = path.join(directory, "private-masters");
  await mkdir(masterDir);
  for (const scene of sourceScenes) {
    await runFFmpeg([
      "-y", "-f", "lavfi", "-i", `sine=frequency=${scene.number * 440}:duration=0.25`,
      "-ar", "48000", "-ac", "1", "-c:a", "pcm_s24le", path.join(masterDir, `scene-${scene.number}.wav`),
    ]);
  }
  return { directory, masterDir };
}

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("trailer retiming", () => {
  it("preserves the five-second splash and allocates exactly the new frame count", () => {
    const plan = buildRetimingPlan(sourceScenes, targets);
    expect(plan.changed).toBe(true);
    expect(plan.durationSeconds).toBe(6.3);
    expect(plan.frames).toBe(189);
    expect(plan.segments[0]).toMatchObject({ sourceDuration: 5, targetDuration: 5, frames: 150 });
    expect(plan.segments.map((segment) => segment.frames)).toEqual([150, 21, 18]);
    expect(buildRetimingPlan(sourceScenes, sourceScenes).changed).toBe(false);
  });

  it("rejects missing scenes, gaps, and mismatched identities", () => {
    expect(() => buildRetimingPlan(sourceScenes, targets.slice(1))).toThrow("same complete scene set");
    expect(() => buildRetimingPlan(sourceScenes, [{ ...targets[0], start: 4 }, targets[1]])).toThrow("continuous");
    expect(() => buildRetimingPlan(sourceScenes, [{ ...targets[0], number: 12 }, targets[1]])).toThrow("identities");
  });

  it("uses explicit encoder choices with quality controls and no hardware fallback", () => {
    expect(videoEncoderArguments("libx264", 8)).toEqual(["-c:v", "libx264", "-preset", "fast", "-crf", "18", "-threads", "8"]);
    expect(videoEncoderArguments("h264_nvenc")).toEqual(expect.arrayContaining(["-cq", "18", "-preset", "p6", "-rc", "vbr"]));
    expect(videoEncoderArguments("h264_nvenc")).not.toContain("-crf");
    expect(() => videoEncoderArguments("auto")).toThrow("explicitly requested");
  });

  it("writes chapter times and narration-only captions with safe metadata escaping", () => {
    const metadata = chapterMetadata([{ ...targets[0], actHeader: "01 // Trust = care; #1" }], 5.7);
    expect(metadata).toContain("START=5000\nEND=5700");
    expect(metadata).toContain("title=Trust \\= care\\; \\#1");
    expect(narrationSubtitles([{ scene: targets[0], start: 5.18, durationSeconds: 0.25 }]))
      .toBe("1\n00:00:05,180 --> 00:00:05,430\nFirst passage.\n");
  });
});

describe.skipIf(!ffmpegAvailable)("actual narration/video remux", () => {
  it("mixes un-stretched narration and rejects a scene window that would cut it", async () => {
    const { directory, masterDir } = await fixture();
    const outputPath = path.join(directory, "mix.wav");
    const masters = await mixVoiceover({ scenes: targets, masterDir, outputPath, durationSeconds: 6.3 });
    expect(masters.map((master) => master.durationSeconds)).toEqual([0.25, 0.25]);
    expect((await probeAudio(outputPath)).durationSeconds).toBeCloseTo(6.3, 2);
    await expect(mixVoiceover({
      scenes: [{ ...targets[0], end: 5.2 }], masterDir, outputPath, durationSeconds: 6.3,
    })).rejects.toThrow("do not shorten the voice");
  });

  it.each([false, true])("finishes a decodable original-resolution video (retimed=%s) with chapters and source provenance", async (changed) => {
    const { directory, masterDir } = await fixture();
    const sourcePath = path.join(directory, "source.mp4");
    const destinationPath = path.join(directory, "finished.mp4");
    await runFFmpeg([
      "-y", "-f", "lavfi", "-i", "testsrc2=size=128x72:rate=30:duration=6",
      "-an", "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", sourcePath,
    ]);
    const original = await readFile(sourcePath);
    const result = await remuxTrailer({
      sourcePath, destinationPath, sourceScenes, targetScenes: changed ? targets : sourceScenes,
      masterDir, threads: 1,
    });
    expect(result.frames).toBe(changed ? 189 : 180);
    expect(result.provenance.method).toContain(changed ? "scene-retiming" : "video-copy");
    expect(result.provenance.source_video_sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(result.provenance.voiceover_masters).toHaveLength(2);
    expect(result.max_volume_dbfs).toBeLessThan(-1);
    expect(await inspectVideo(destinationPath)).toMatchObject({ width: 128, height: 72, codec: "h264" });
    expect(await readFile(sourcePath)).toEqual(original);
    const chapters = path.join(directory, "chapters.txt");
    await runFFmpeg(["-y", "-i", destinationPath, "-f", "ffmetadata", chapters]);
    expect((await readFile(chapters, "utf8")).match(/\[CHAPTER\]/g)).toHaveLength(3);
    expect((await readdir(directory)).some((name) => name.startsWith(".remux-"))).toBe(false);
  }, 30_000);

  it("keeps the previous destination intact when a required master is missing", async () => {
    const { directory, masterDir } = await fixture();
    const sourcePath = path.join(directory, "source.mp4");
    const destinationPath = path.join(directory, "finished.mp4");
    await runFFmpeg([
      "-y", "-f", "lavfi", "-i", "color=size=128x72:rate=30:duration=6",
      "-an", "-c:v", "libx264", "-preset", "ultrafast", sourcePath,
    ]);
    await writeFile(destinationPath, "previous delivery");
    await rm(path.join(masterDir, "scene-2.wav"));
    await expect(remuxTrailer({ sourcePath, destinationPath, sourceScenes, targetScenes: targets, masterDir })).rejects.toThrow("FFmpeg failed");
    expect(await readFile(destinationPath, "utf8")).toBe("previous delivery");
  });
});
