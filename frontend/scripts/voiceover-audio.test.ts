import { spawnSync } from "node:child_process";
import { copyFile, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { TRAILER_SCENES } from "./channel-inquiry-video.mjs";
import {
  detectRecordingScenes,
  findSceneRecording,
  processVoiceover,
  recordingSceneSegments,
} from "./process-voiceover.mjs";
import { DEFAULT_FFMPEG, masterVoiceover, measureAudioLoudness, probeAudio, runFFmpeg } from "./voiceover-audio.mjs";

const ffmpegAvailable = spawnSync(DEFAULT_FFMPEG, ["-version"], { stdio: "ignore" }).status === 0;
const temporaryDirectories: string[] = [];

async function fixtureDirectory() {
  const directory = await mkdtemp(path.join(os.tmpdir(), "dot-voiceover-test-"));
  temporaryDirectories.push(directory);
  return directory;
}

// Two audible passages with a two-second internal pause; no author's audio is used.
function recordingFixture() {
  const sampleRate = 48000;
  const samples = sampleRate * 4;
  const wav = Buffer.alloc(44 + samples * 2);
  wav.write("RIFF", 0);
  wav.writeUInt32LE(36 + samples * 2, 4);
  wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(samples * 2, 40);
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const frequency = t >= 0.2 && t < 0.8 ? 440 : t >= 2.8 && t < 3.7 ? 900 : 0;
    wav.writeInt16LE(frequency ? Math.round(0.15 * 32767 * Math.sin(2 * Math.PI * frequency * t)) : 0, 44 + i * 2);
  }
  return wav;
}

function rms(samples: Buffer, start: number, end: number) {
  let sum = 0;
  const first = Math.floor(start * 48000);
  const last = Math.floor(end * 48000);
  for (let sample = first; sample < last; sample++) sum += samples.readFloatLE(sample * 4) ** 2;
  return Math.sqrt(sum / (last - first));
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("recording scene boundaries", () => {
  it("uses the configured scene count and preserves the complete recording timeline", () => {
    const count = TRAILER_SCENES.length;
    const intervals = Array.from({ length: count - 1 }, (_, i) => ({ start: (i + 1) * 4 - 1, end: (i + 1) * 4 + 1 }));
    const segments = recordingSceneSegments(count * 4, intervals, count);
    expect(segments).toHaveLength(count);
    expect(segments[0].start).toBe(0);
    expect(segments.at(-1)?.end).toBe(count * 4);
    expect(segments.reduce((sum, segment) => sum + segment.end - segment.start, 0)).toBe(count * 4);
    for (let i = 1; i < segments.length; i++) expect(segments[i].start).toBe(segments[i - 1].end);
  });

  it("rejects both missing and excess scene separators instead of discarding speech", () => {
    expect(() => recordingSceneSegments(10, [], 2)).toThrow("Detected 1 scenes; expected 2");
    expect(() => recordingSceneSegments(10, [{ start: 4, end: 6 }], 1)).toThrow("Detected 2 scenes; expected 1");
    expect(recordingSceneSegments(10, [{ start: 0, end: 2 }, { start: 8, end: 10 }], 1))
      .toEqual([{ start: 0, end: 10 }]);
  });

  it("requires an unambiguous numbered original for every scene", () => {
    expect(findSceneRecording(["raw-12.wav", "scene-1.mp3"], 12)).toBe("raw-12.wav");
    expect(findSceneRecording(["raw-scene-12.wav", "raw-scene-1.wav"], 12)).toBe("raw-scene-12.wav");
    expect(() => findSceneRecording(["raw-1.wav", "take-1.m4a"], 1)).toThrow("found 2");
    expect(() => findSceneRecording(["raw-11.wav"], 12)).toThrow("found 0");
  });
});

describe.skipIf(!ffmpegAvailable)("lossless narration mastering with FFmpeg", () => {
  it("retains internal silence and the last audible passage without a scene-duration cap", async () => {
    const directory = await fixtureDirectory();
    const original = path.join(directory, "original.wav");
    const master = path.join(directory, "master.wav");
    await writeFile(original, recordingFixture());
    const before = await readFile(original);
    const information = await masterVoiceover(original, master);
    expect(information.durationSeconds).toBeCloseTo(4.5, 2);
    expect(information.codec).toBe("pcm_s24le");
    expect(information.sampleRate).toBe(48000);
    expect(await readFile(original)).toEqual(before);
    const decoded = path.join(directory, "decoded.f32");
    await runFFmpeg(["-y", "-i", master, "-f", "f32le", "-c:a", "pcm_f32le", decoded]);
    const samples = await readFile(decoded);
    expect(rms(samples, 1.4, 2.6)).toBeLessThan(0.00001);
    expect(rms(samples, 3.6, 3.85)).toBeGreaterThan(0.04);
    expect(rms(samples, 4.05, 4.4)).toBeLessThan(0.00001);
    expect((await readdir(directory)).some((name) => name.startsWith(".voiceover-stage-"))).toBe(false);
  });

  it("detects actual scene breaks and rejects an ambiguous count before output changes", async () => {
    const directory = await fixtureDirectory();
    const original = path.join(directory, "original.wav");
    await writeFile(original, recordingFixture());
    const segments = await detectRecordingScenes(original, 2, { minSilenceSeconds: 1.5 });
    expect(segments[0].start).toBe(0);
    expect(segments[0].end).toBeCloseTo(1.8, 1);
    expect(segments[1].start).toBeCloseTo(1.8, 1);
    expect(segments[1].end).toBeCloseTo(4, 2);
    await expect(detectRecordingScenes(original, 12)).rejects.toThrow("expected 12");
  });

  it("reaches the narration loudness target with peak headroom while retaining the full peak-heavy recording", async () => {
    const directory = await fixtureDirectory();
    const original = path.join(directory, "wide-dynamics.wav");
    const fixture = recordingFixture();
    for (let offset = 44; offset < fixture.length; offset += 2) {
      fixture.writeInt16LE(Math.round(fixture.readInt16LE(offset) / 12), offset);
    }
    fixture.writeInt16LE(29000, 44 + 48000 * 2);
    await writeFile(original, fixture);
    const master = path.join(directory, "master.wav");
    const information = await masterVoiceover(original, master);
    const measured = await measureAudioLoudness(master);
    expect(Math.abs(measured.integratedLufs + 17)).toBeLessThanOrEqual(0.3);
    expect(measured.truePeak).toBeLessThanOrEqual(-1.4);
    expect(information.achievedLufs).toBe(measured.integratedLufs);
    expect(information.durationSeconds).toBeCloseTo(4.5, 2);
  });

  it("processes every configured scene while keeping masters private and speech longer than old windows", async () => {
    const directory = await fixtureDirectory();
    const inputDir = path.join(directory, "recordings");
    const masterDir = path.join(directory, "private-masters");
    const deliveryDir = path.join(directory, "public-delivery");
    await mkdir(inputDir);
    const fixture = path.join(directory, "fixture.wav");
    await writeFile(fixture, recordingFixture());
    for (const scene of TRAILER_SCENES) await copyFile(fixture, path.join(inputDir, `raw-${scene.number}.wav`));
    const results = await processVoiceover({
      inputDir, masterDir, deliveryDir,
      scenes: TRAILER_SCENES.map((scene) => ({ ...scene, start: 0, end: 0.25 })),
    });
    expect(results).toHaveLength(TRAILER_SCENES.length);
    expect(results.every((scene) => scene.durationSeconds > 4.4)).toBe(true);
    expect(await readdir(masterDir)).toHaveLength(TRAILER_SCENES.length);
    expect((await readdir(deliveryDir)).every((name) => name.endsWith(".mp3"))).toBe(true);
    expect(await probeAudio(path.join(masterDir, `scene-${TRAILER_SCENES.at(-1)!.number}.wav`)))
      .toMatchObject({ codec: "pcm_s24le", sampleRate: 48000 });
    const previous = await readFile(path.join(deliveryDir, "scene-1.mp3"));
    const silent = recordingFixture();
    silent.fill(0, 44);
    await writeFile(path.join(inputDir, `raw-${TRAILER_SCENES.at(-1)!.number}.wav`), silent);
    await expect(processVoiceover({ inputDir, masterDir, deliveryDir })).rejects.toThrow("silent");
    expect(await readFile(path.join(deliveryDir, "scene-1.mp3"))).toEqual(previous);
    await rm(path.join(inputDir, "raw-1.wav"));
    await expect(processVoiceover({ inputDir, masterDir, deliveryDir })).rejects.toThrow("found 0");
    expect(await readFile(path.join(deliveryDir, "scene-1.mp3"))).toEqual(previous);
  }, 30_000);
});
