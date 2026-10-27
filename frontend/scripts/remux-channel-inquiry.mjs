import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { INQUIRY_VIDEOS, TRAILER_SCENES, TRAILER_VOICE_OFFSET_SECONDS } from "./channel-inquiry-video.mjs";
import { DEFAULT_FFMPEG, probeAudio, runFFmpeg } from "./voiceover-audio.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const FPS = 30;
export const VOICE_OFFSET_SECONDS = TRAILER_VOICE_OFFSET_SECONDS;

export function buildRetimingPlan(sourceScenes, targetScenes, { fps = FPS } = {}) {
  if (!Array.isArray(sourceScenes) || !Array.isArray(targetScenes) ||
      sourceScenes.length === 0 || sourceScenes.length !== targetScenes.length) {
    throw new Error("Source and target must contain the same complete scene set.");
  }
  const validate = (scenes) => {
    let previousEnd = 5;
    for (const scene of scenes) {
      if (!Number.isFinite(scene.start) || !Number.isFinite(scene.end) ||
          scene.end <= scene.start || Math.abs(scene.start - previousEnd) > 0.001) {
        throw new Error("Trailer scenes must be continuous after the five-second splash.");
      }
      previousEnd = scene.end;
    }
  };
  validate(sourceScenes);
  validate(targetScenes);
  const segments = [{ sourceStart: 0, sourceDuration: 5, targetStart: 0, targetDuration: 5, frames: 5 * fps }];
  for (let i = 0; i < sourceScenes.length; i++) {
    const source = sourceScenes[i];
    const target = targetScenes[i];
    if (source.number !== target.number || source.id !== target.id) throw new Error("Scene identities differ between the source and target.");
    const startFrame = Math.round(target.start * fps);
    const endFrame = Math.round(target.end * fps);
    if (endFrame <= startFrame) throw new Error("Every scene needs at least one output frame.");
    segments.push({
      sourceStart: source.start,
      sourceDuration: source.end - source.start,
      targetStart: startFrame / fps,
      targetDuration: (endFrame - startFrame) / fps,
      frames: endFrame - startFrame,
      number: target.number,
    });
  }
  return {
    fps,
    segments,
    frames: Math.round(targetScenes.at(-1).end * fps),
    durationSeconds: Math.round(targetScenes.at(-1).end * fps) / fps,
    changed: sourceScenes.some((source, i) =>
      Math.abs(source.start - targetScenes[i].start) > 0.001 ||
      Math.abs(source.end - targetScenes[i].end) > 0.001),
  };
}

export async function inspectVideo(inputPath, { ffmpeg = DEFAULT_FFMPEG } = {}) {
  const { stderr } = await runFFmpeg([
    "-i", inputPath, "-map", "0:v:0", "-frames:v", "1", "-an", "-f", "null", "-",
  ], { ffmpeg });
  const stream = stderr.split("\n").find((line) => line.includes("Video:"));
  const dimensions = stream?.match(/\b(\d{2,5})x(\d{2,5})\b/);
  const duration = stderr.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
  if (!dimensions || !duration) throw new Error("The source has no readable video stream or duration.");
  return {
    width: Number(dimensions[1]), height: Number(dimensions[2]),
    codec: stream.match(/Video:\s*([^,\s]+)/)?.[1],
    durationSeconds: Number(duration[1]) * 3600 + Number(duration[2]) * 60 + Number(duration[3]),
  };
}

/** All narration stays at its original rate. No background sound masks speech. */
export async function mixVoiceover({
  scenes, masterDir, outputPath, durationSeconds, ffmpeg = DEFAULT_FFMPEG,
  voiceOffsetSeconds = VOICE_OFFSET_SECONDS,
}) {
  const masters = [];
  for (const scene of scenes) {
    const file = path.join(masterDir, `scene-${scene.number}.wav`);
    const information = await probeAudio(file, { ffmpeg });
    const start = Math.round((scene.start + voiceOffsetSeconds) * 1000) / 1000;
    if (start < 0 || start + information.durationSeconds > scene.end + 0.005 || scene.end > durationSeconds + 0.04) {
      throw new Error(`Scene ${scene.number} narration exceeds its new scene window. Retime the visuals; do not shorten the voice.`);
    }
    masters.push({ scene, file, start, ...information });
  }
  const args = ["-y", "-f", "lavfi", "-i", `anullsrc=r=48000:cl=mono:d=${durationSeconds}`];
  const filters = [];
  const labels = ["[0:a]"];
  for (const [index, master] of masters.entries()) {
    args.push("-i", master.file);
    const label = `[voice${index}]`;
    const fadeStart = Math.max(0, master.durationSeconds - 0.1);
    filters.push(`[${index + 1}:a]aresample=48000,aformat=channel_layouts=mono,afade=t=in:d=0.005,afade=t=out:st=${fadeStart}:d=0.08,adelay=${Math.round(master.start * 1000)}:all=1${label}`);
    labels.push(label);
  }
  filters.push(`${labels.join("")}amix=inputs=${labels.length}:duration=first:dropout_transition=0:normalize=0,alimiter=limit=0.79:level=0:latency=1[out]`);
  await runFFmpeg([
    ...args, "-filter_complex", filters.join(";"), "-map", "[out]",
    "-ar", "48000", "-ac", "1", "-c:a", "pcm_s24le", outputPath,
  ], { ffmpeg });
  const mixed = await probeAudio(outputPath, { ffmpeg });
  if (Math.abs(mixed.durationSeconds - durationSeconds) > 0.05) throw new Error("The narration mix has an unexpected duration.");
  return masters;
}

export function videoEncoderArguments(encoder, threads = 0) {
  if (encoder === "libx264") {
    return ["-c:v", "libx264", "-preset", "fast", "-crf", "18", "-threads", String(threads)];
  }
  if (encoder === "h264_nvenc") {
    return [
      "-c:v", "h264_nvenc", "-preset", "p6", "-tune", "hq", "-rc", "vbr", "-cq", "18", "-b:v", "0",
      "-spatial-aq", "1", "-aq-strength", "8", "-rc-lookahead", "20", "-profile:v", "high",
    ];
  }
  throw new Error("Encoder must be libx264 or explicitly requested h264_nvenc.");
}

export async function retimeVideo(sourcePath, outputPath, plan, { ffmpeg = DEFAULT_FFMPEG, threads = 0, encoder = "libx264" } = {}) {
  const encoderArguments = videoEncoderArguments(encoder, threads);
  if (!plan.changed) {
    await runFFmpeg(["-y", "-i", sourcePath, "-map", "0:v:0", "-an", "-c:v", "copy", outputPath], { ffmpeg });
    return;
  }
  const staging = await mkdtemp(path.join(path.dirname(outputPath), ".retime-"));
  try {
    const files = [];
    for (const [index, segment] of plan.segments.entries()) {
      const file = path.join(staging, `part-${String(index).padStart(3, "0")}.mp4`);
      const rate = segment.targetDuration / segment.sourceDuration;
      await runFFmpeg([
        "-y", "-ss", String(segment.sourceStart), "-t", String(segment.sourceDuration), "-threads", String(threads), "-i", sourcePath,
        "-map", "0:v:0", "-an", "-map_metadata", "-1",
        "-vf", `setpts=(PTS-STARTPTS)*${rate},fps=${plan.fps},tpad=stop_mode=clone:stop_duration=1,trim=duration=${segment.targetDuration}`,
        "-frames:v", String(segment.frames), ...encoderArguments, "-pix_fmt", "yuv420p",
        "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", file,
      ], { ffmpeg });
      files.push(file);
    }
    const listPath = path.join(staging, "parts.txt");
    await writeFile(listPath, files.map((file) => `file '${file.replace(/'/g, "'\\''")}'`).join("\n") + "\n");
    await runFFmpeg([
      "-y", "-f", "concat", "-safe", "0", "-i", listPath, "-map", "0:v:0", "-an", "-c:v", "copy", outputPath,
    ], { ffmpeg });
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

const metadataEscape = (value) => String(value).replace(/[\\=;#\n\r]/g, (character) => `\\${character}`);
export function chapterMetadata(scenes, durationSeconds) {
  const chapters = [{ start: 0, end: 5, title: "DOT" }, ...scenes.map((scene) => ({
    start: scene.start, end: Math.min(scene.end, durationSeconds),
    title: scene.actHeader?.replace(/^\d+\s*\/\/\s*/, "") || `Scene ${scene.number}`,
  }))];
  return ";FFMETADATA1\n" + chapters.map((chapter) =>
    `[CHAPTER]\nTIMEBASE=1/1000\nSTART=${Math.round(chapter.start * 1000)}\nEND=${Math.round(chapter.end * 1000)}\ntitle=${metadataEscape(chapter.title)}\n`,
  ).join("\n");
}

function srtTime(seconds) {
  const milliseconds = Math.round(seconds * 1000);
  return `${String(Math.floor(milliseconds / 3600000)).padStart(2, "0")}:${String(Math.floor(milliseconds / 60000) % 60).padStart(2, "0")}:${String(Math.floor(milliseconds / 1000) % 60).padStart(2, "0")},${String(milliseconds % 1000).padStart(3, "0")}`;
}

export function narrationSubtitles(masters) {
  return masters.map((master, index) =>
    `${index + 1}\n${srtTime(master.start)} --> ${srtTime(master.start + master.durationSeconds)}\n${master.scene.primaryStatement}\n`,
  ).join("\n");
}

async function sha256(file) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}

export async function remuxTrailer({
  sourcePath, destinationPath, sourceScenes, targetScenes = TRAILER_SCENES,
  masterDir = path.join(ROOT, "artifacts/voiceover/masters"),
  ffmpeg = DEFAULT_FFMPEG, threads = 0, encoder = "libx264",
  voiceOffsetSeconds = VOICE_OFFSET_SECONDS,
}) {
  videoEncoderArguments(encoder, threads);
  const plan = buildRetimingPlan(sourceScenes, targetScenes);
  const source = await inspectVideo(sourcePath, { ffmpeg });
  if (Math.abs(source.durationSeconds - sourceScenes.at(-1).end) > 0.1) {
    throw new Error("Source video duration does not match the saved source scene timings.");
  }
  if (path.resolve(sourcePath) === path.resolve(destinationPath)) throw new Error("Use a preserved source backup, separate from the destination.");
  await mkdir(path.dirname(destinationPath), { recursive: true });
  const staging = await mkdtemp(path.join(path.dirname(destinationPath), ".remux-"));
  try {
    const voice = path.join(staging, "voice.wav");
    const masters = await mixVoiceover({ scenes: targetScenes, masterDir, outputPath: voice, durationSeconds: plan.durationSeconds, ffmpeg, voiceOffsetSeconds });
    const visual = path.join(staging, "visual.mp4");
    await retimeVideo(sourcePath, visual, plan, { ffmpeg, threads, encoder });
    const chapters = path.join(staging, "chapters.ffmeta");
    await writeFile(chapters, chapterMetadata(targetScenes, plan.durationSeconds));
    const ready = path.join(staging, "ready.mp4");
    await runFFmpeg([
      "-y", "-i", visual, "-i", voice, "-f", "ffmetadata", "-i", chapters,
      "-map", "0:v:0", "-map", "1:a:0", "-map_metadata", "2", "-map_chapters", "2",
      "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
      "-movflags", "+faststart", ready,
    ], { ffmpeg });
    const { stdout } = await runFFmpeg([
      "-v", "error", "-err_detect", "explode", "-i", ready,
      "-map", "0:v:0", "-map", "0:a:0", "-progress", "pipe:1", "-nostats", "-f", "null", "-",
    ], { ffmpeg });
    const frameCounts = [...stdout.matchAll(/frame=(\d+)/g)];
    if (Number(frameCounts.at(-1)?.[1]) !== plan.frames) throw new Error("Decoded video frame count does not match the new timeline.");
    const audio = await probeAudio(ready, { ffmpeg });
    const video = await inspectVideo(ready, { ffmpeg });
    if (video.width !== source.width || video.height !== source.height ||
        Math.abs(video.durationSeconds - plan.durationSeconds) > 0.1 ||
        Math.abs(audio.durationSeconds - plan.durationSeconds) > 0.1) {
      throw new Error("The completed video failed its resolution or duration check.");
    }
    const { stderr } = await runFFmpeg(["-i", ready, "-vn", "-af", "volumedetect", "-f", "null", "-"], { ffmpeg });
    const maximum = Number(stderr.match(/max_volume: ([-\d.]+) dB/)?.[1]);
    if (!Number.isFinite(maximum) || maximum >= -1) throw new Error("The finished narration needs more peak headroom.");
    const sourceHash = await sha256(sourcePath);
    const masterHashes = await Promise.all(masters.map(async (master) => ({ number: master.scene.number, sha256: await sha256(master.file) })));
    const result = {
      ...plan, width: video.width, height: video.height, codec: "H.264", audio: "AAC stereo 48 kHz",
      max_volume_dbfs: maximum, video_sha256: await sha256(ready),
      provenance: { method: plan.changed ? "scene-retiming-and-lossless-voice-remix" : "video-copy-and-lossless-voice-remix", video_encoder: plan.changed ? encoder : "copy", source_video_sha256: sourceHash, voiceover_masters: masterHashes },
      subtitles: narrationSubtitles(masters),
    };
    await rename(ready, destinationPath);
    return result;
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => !/^--(?:source-scenes|source-dir|threads|encoder)=/.test(arg))) {
    throw new Error("Use --source-scenes=snapshot.json --source-dir=private-backup-directory [--threads=N] [--encoder=libx264|h264_nvenc].");
  }
  const value = (name) => args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
  if (!value("source-scenes") || !value("source-dir")) throw new Error("Both the saved source scenes and private source directory are required.");
  const sourceScenes = JSON.parse(await readFile(path.resolve(value("source-scenes")), "utf8"));
  const sourceDir = path.resolve(value("source-dir"));
  const threads = Number(value("threads") || 0);
  const encoder = value("encoder") || "libx264";
  if (!Number.isInteger(threads) || threads < 0 || threads > 256) throw new Error("Threads must be an integer from 0 to 256.");
  videoEncoderArguments(encoder, threads);
  const outputDir = path.join(ROOT, "design/youtube");
  const video = INQUIRY_VIDEOS.find((item) => item.name === "inquiry-trailer");
  for (const theme of ["dark", "light"]) {
    const name = theme === "dark" ? "inquiry-trailer" : "inquiry-trailer-light";
    console.log(`Rebuilding ${theme} trailer with complete lossless narration...`);
    const metadataPath = path.join(outputDir, "assets", `${name}.json`);
    let parent = {};
    try { parent = JSON.parse(await readFile(metadataPath, "utf8")); } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    const result = await remuxTrailer({
      sourcePath: path.join(sourceDir, `${name}.mp4`),
      destinationPath: path.join(outputDir, `${name}.mp4`), sourceScenes, threads, encoder,
    });
    const { subtitles, segments, changed, provenance, ...details } = result;
    const manifest = {
      ...parent, ...video, ...details, duration: result.durationSeconds, name, theme, file: `${name}.mp4`,
      render_provenance: { ...provenance, parent_render_sha256: parent.render_sha256 || null, source_scene_timings: sourceScenes.map(({ number, start, end }) => ({ number, start, end })) },
      render_sha256: createHash("sha256").update(JSON.stringify({ segments, provenance })).digest("hex"),
      remixed_at: new Date().toISOString(),
    };
    const stagedMetadata = `${metadataPath}.ready`;
    await writeFile(stagedMetadata, JSON.stringify(manifest, null, 2) + "\n");
    await rename(stagedMetadata, metadataPath);
    if (theme === "dark") await writeFile(path.join(outputDir, "assets/inquiry-trailer.srt"), subtitles);
    console.log(`${theme}: ${result.durationSeconds.toFixed(2)}s, ${result.frames} frames, ${changed ? "visuals retimed" : "video stream preserved"}, ${result.max_volume_dbfs} dBFS peak.`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
  });
}
