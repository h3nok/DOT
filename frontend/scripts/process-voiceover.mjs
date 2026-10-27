import { existsSync } from "node:fs";
import { copyFile, mkdir, mkdtemp, readdir, rename, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TRAILER_SCENES } from "./channel-inquiry-video.mjs";
import {
  DEFAULT_FFMPEG,
  encodeVoiceoverDelivery,
  masterVoiceover,
  probeAudio,
  runFFmpeg,
} from "./voiceover-audio.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const PRIVATE_DIR = path.join(ROOT, "artifacts/voiceover");
const AUDIO_DIR = path.join(ROOT, "frontend/public/audio");

/**
 * Scene separators must be deliberate pauses. Every detected separator is used;
 * an ambiguous count is rejected instead of silently dropping later scenes.
 * Splitting at the middle preserves the complete recording, including its pauses.
 */
export function recordingSceneSegments(durationSeconds, silenceIntervals, expectedCount) {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || !Number.isInteger(expectedCount) || expectedCount < 1) {
    throw new Error("A positive duration and scene count are required.");
  }
  const separators = silenceIntervals
    .filter(({ start, end }) => Number.isFinite(start) && Number.isFinite(end) &&
      start > 0.05 && end < durationSeconds - 0.05 && end > start)
    .map(({ start, end }) => (start + end) / 2)
    .sort((a, b) => a - b);
  const boundaries = [0, ...separators, durationSeconds];
  const segments = boundaries.slice(0, -1).map((start, i) => ({ start, end: boundaries[i + 1] }));
  if (segments.length !== expectedCount) {
    throw new Error(
      `Detected ${segments.length} scenes; expected ${expectedCount}. Use separate numbered recordings, or set --scene-pause to match deliberate scene breaks. No audio was replaced.`,
    );
  }
  return segments;
}

export async function detectRecordingScenes(inputPath, expectedCount, {
  ffmpeg = DEFAULT_FFMPEG,
  minSilenceSeconds = 1.5,
} = {}) {
  if (!Number.isFinite(minSilenceSeconds) || minSilenceSeconds < 0.5 || minSilenceSeconds > 30) {
    throw new Error("Scene-pause seconds must be between 0.5 and 30.");
  }
  const { durationSeconds } = await probeAudio(inputPath, { ffmpeg });
  const { stderr } = await runFFmpeg([
    "-i", inputPath, "-map", "0:a:0", "-vn",
    "-af", `silencedetect=noise=-42dB:d=${minSilenceSeconds}`, "-f", "null", "-",
  ], { ffmpeg });
  const intervals = [];
  let start = null;
  for (const line of stderr.split("\n")) {
    const beginning = line.match(/silence_start:\s*([\d.]+)/);
    if (beginning) start = Number(beginning[1]);
    const ending = line.match(/silence_end:\s*([\d.]+)/);
    if (ending && start !== null) {
      intervals.push({ start, end: Number(ending[1]) });
      start = null;
    }
  }
  if (start !== null) intervals.push({ start, end: durationSeconds });
  return recordingSceneSegments(durationSeconds, intervals, expectedCount);
}

export function findSceneRecording(files, number) {
  const pattern = new RegExp(`^(?:(?:raw-scene-|raw-|take-|scene-|voice[\\s_-]*)?0*)${number}\\.(?:m4a|wav|mp3|aac|ogg|flac|mp4)$`, "i");
  const matches = files.filter((file) => pattern.test(file));
  if (matches.length !== 1) {
    throw new Error(
      `Scene ${number} needs exactly one numbered recording; found ${matches.length}. No audio was replaced.`,
    );
  }
  return matches[0];
}

async function publishFile(stagedPath, destinationPath) {
  await mkdir(path.dirname(destinationPath), { recursive: true });
  const stageDir = await mkdtemp(path.join(path.dirname(destinationPath), ".voiceover-stage-"));
  try {
    const copied = path.join(stageDir, path.basename(destinationPath));
    await copyFile(stagedPath, copied);
    await rename(copied, destinationPath);
  } finally {
    await rm(stageDir, { recursive: true, force: true });
  }
}

export async function processVoiceover({
  recordingPath = null,
  inputDir = path.join(PRIVATE_DIR, "recordings"),
  masterDir = path.join(PRIVATE_DIR, "masters"),
  deliveryDir = AUDIO_DIR,
  scenes = TRAILER_SCENES,
  ffmpeg = DEFAULT_FFMPEG,
  minSilenceSeconds = 1.5,
} = {}) {
  if (scenes.length === 0) throw new Error("No trailer scenes are configured.");
  let sources;
  if (recordingPath) {
    if (!existsSync(recordingPath)) throw new Error("The input recording was not found.");
    sources = await detectRecordingScenes(recordingPath, scenes.length, { ffmpeg, minSilenceSeconds });
  } else {
    if (!existsSync(inputDir)) {
      throw new Error(
        `Record ${scenes.length} separate scene files in artifacts/voiceover/recordings, or pass one complete recording. Originals stay private.`,
      );
    }
    const files = await readdir(inputDir);
    sources = scenes.map(({ number }) => ({ path: path.join(inputDir, findSceneRecording(files, number)) }));
  }

  await mkdir(PRIVATE_DIR, { recursive: true, mode: 0o700 });
  const temporary = await mkdtemp(path.join(PRIVATE_DIR, ".process-"));
  try {
    const prepared = [];
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const source = sources[i];
      let inputPath = source.path;
      if (recordingPath) {
        inputPath = path.join(temporary, `recording-${scene.number}.wav`);
        await runFFmpeg([
          "-y", "-i", recordingPath, "-map", "0:a:0", "-vn",
          "-af", `atrim=start=${source.start}:end=${source.end},asetpts=PTS-STARTPTS`,
          "-c:a", "pcm_s24le", inputPath,
        ], { ffmpeg });
      }
      const master = path.join(temporary, `scene-${scene.number}.wav`);
      const delivery = path.join(temporary, `scene-${scene.number}.mp3`);
      const information = await masterVoiceover(inputPath, master, { ffmpeg });
      await encodeVoiceoverDelivery(master, delivery, { ffmpeg });
      prepared.push({ scene, master, delivery, information });
    }
    // Validate the entire set before publishing any new scene.
    for (const { scene, master, delivery } of prepared) {
      await publishFile(master, path.join(masterDir, `scene-${scene.number}.wav`));
      await publishFile(delivery, path.join(deliveryDir, `scene-${scene.number}.mp3`));
    }
    return prepared.map(({ scene, information }) => ({ number: scene.number, ...information }));
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

async function main() {
  const args = process.argv.slice(2);
  const unknown = args.find((arg) => arg.startsWith("--") &&
    !arg.startsWith("--input-dir=") && !arg.startsWith("--scene-pause="));
  if (unknown) throw new Error("Use a recording path, --input-dir=directory, and/or --scene-pause=seconds.");
  const recording = args.filter((arg) => !arg.startsWith("--"));
  if (recording.length > 1) throw new Error("Pass only one continuous recording, or use --input-dir.");
  const inputDir = args.find((arg) => arg.startsWith("--input-dir="))?.slice("--input-dir=".length);
  const pause = args.find((arg) => arg.startsWith("--scene-pause="))?.slice("--scene-pause=".length);
  const result = await processVoiceover({
    ...(recording[0] ? { recordingPath: path.resolve(recording[0]) } : {}),
    ...(inputDir ? { inputDir: path.resolve(inputDir) } : {}),
    ...(pause ? { minSilenceSeconds: Number(pause) } : {}),
  });
  for (const scene of result) {
    console.log(`Mastered scene ${scene.number}: ${scene.durationSeconds.toFixed(2)}s, complete narration retained.`);
  }
  console.log(`Finished ${result.length} scenes. Lossless masters are private; delivery MP3s are ready.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
  });
}
