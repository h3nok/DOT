import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { existsSync } from "node:fs";
import { copyFile, mkdir, mkdtemp, open, readFile, rename, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { chromium } from "@playwright/test";

// Export the review draft locally. This never changes the live film or old media.
// L1/L8/L10: deterministic frames and soft typing preserve the viewer's single focus.
const arguments_ = process.argv.slice(2);
const option = (name, fallback) => arguments_.find((argument) => argument.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
if (arguments_.includes("--help")) {
  console.log(`Usage: node scripts/render-dark-film.mjs [options]
  --url=http://127.0.0.1:5173/_preview/film-dark?render=1
  --output=/tmp/dot-film-revised-dark
  --fps=30             Frames per second (default: 30)
  --workers=4          Concurrent browser pages (default: up to 4)
  --suffix=revised-dark-v4  Suffix for exported filenames (default: revised-dark)
  --reuse-body=/path/to/previous.mp4  Reuse its unchanged video after --body-start
  --body-start=30      First second of the previous film's body
  --samples=3,12,20,28,40,47,55,62,73  Contact-sheet sample times
  --poster=73          Poster time in seconds
  --excerpt=0:78       Also export this interval from the opening
  --excerpt-name=dot-opening-trailer-dark-v5  Excerpt filename stem
  --opening-only       Export the opening and contact sheet only
  --stills-only        Export the contact sheet only
  DOT_FFMPEG           Path to a local ffmpeg with libx264 and AAC
  DOT_FFPROBE          Optional companion ffprobe path`);
  process.exit(0);
}

const URL = option("url", "http://127.0.0.1:5173/_preview/film-dark?render=1");
const OUTPUT = path.resolve(option("output", "/tmp/dot-film-revised-dark"));
const FPS = Number(option("fps", "30"));
const WORKERS = Number(option("workers", String(Math.min(4, os.availableParallelism()))));
const FFMPEG = process.env.DOT_FFMPEG || (existsSync("/tmp/dot-channel-video-tools/ffmpeg") ? "/tmp/dot-channel-video-tools/ffmpeg" : "ffmpeg");
const FFPROBE = process.env.DOT_FFPROBE || (FFMPEG.includes(path.sep) ? path.join(path.dirname(FFMPEG), "ffprobe") : "ffprobe");
const WIDTH = 1920;
const HEIGHT = 1080;
const OPENING_ONLY = arguments_.includes("--opening-only");
const STILLS_ONLY = arguments_.includes("--stills-only");
const SUFFIX = option("suffix", "revised-dark");
const REUSE_BODY = option("reuse-body", null);
const BODY_START = Number(option("body-start", "30"));
const SAMPLE_TIMES = option("samples", null)?.split(",").map(Number) ?? null;
const POSTER_TIME = option("poster", null) === null ? null : Number(option("poster", null));
const EXCERPT_RAW = option("excerpt", null);
// `--excerpt=opening` exports exactly the trailer, however long its words make it.
const EXCERPT_OPENING = EXCERPT_RAW === "opening";
const EXCERPT = EXCERPT_RAW && !EXCERPT_OPENING ? EXCERPT_RAW.split(":").map(Number) : null;
const EXCERPT_NAME = option("excerpt-name", `dot-introduction-fullscreen-${SUFFIX}`);
const pageErrors = new WeakMap();
assert.ok(Number.isInteger(FPS) && FPS >= 1 && FPS <= 60, "--fps must be an integer from 1 to 60");
assert.ok(Number.isInteger(WORKERS) && WORKERS >= 1 && WORKERS <= 8, "--workers must be an integer from 1 to 8");
assert.match(SUFFIX, /^[a-z0-9-]+$/, "--suffix must contain lowercase letters, numbers, or hyphens");
assert.ok(Number.isFinite(BODY_START) && BODY_START >= 0, "--body-start must be nonnegative");
assert.ok(!REUSE_BODY || existsSync(REUSE_BODY), "--reuse-body must identify an existing local MP4");
assert.ok(!SAMPLE_TIMES || SAMPLE_TIMES.length === 9 && SAMPLE_TIMES.every((time) => Number.isFinite(time) && time >= 0), "--samples must contain nine nonnegative seconds");
assert.ok(POSTER_TIME === null || Number.isFinite(POSTER_TIME) && POSTER_TIME >= 0, "--poster must be nonnegative seconds");
assert.ok(!EXCERPT || EXCERPT.length === 2 && EXCERPT.every(Number.isFinite) && EXCERPT[0] >= 0 && EXCERPT[1] > EXCERPT[0], "--excerpt must be start:end seconds");
assert.match(EXCERPT_NAME, /^[a-z0-9-]+$/, "--excerpt-name must be a simple filename stem");
assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(new globalThis.URL(URL).hostname), "The draft exporter only loads a local preview");

async function command(binary, args) {
  const child = spawn(binary, args, { stdio: ["ignore", "pipe", "pipe"] });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => { stdout += chunk; });
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  const [code] = await once(child, "close");
  assert.equal(code, 0, `${binary} failed: ${stderr.slice(-5000)}`);
  return { stdout, stderr };
}

async function preparePage(context) {
  const page = await context.newPage();
  const errors = [];
  pageErrors.set(page, errors);
  page.on("pageerror", (error) => { errors.push(error.message); });
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForFunction(() => Boolean(window.__DOT_DARK_FILM_PREVIEW__?.renderAt));
  await page.evaluate(() => document.fonts.ready);
  const box = await page.locator("[data-dark-film-render]").boundingBox();
  assert.ok(box && Math.abs(box.width - WIDTH) < 0.1 && Math.abs(box.height - HEIGHT) < 0.1, `Expected a ${WIDTH}×${HEIGHT} render stage; received ${JSON.stringify(box)}`);
  assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= WIDTH && box.y + box.height <= HEIGHT, "The render stage must fit the viewport without scrolling");
  return page;
}

async function frame(page, seconds, quality = 96) {
  // The dev server can reload the preview mid-render; wait for it to return and redraw.
  for (let attempt = 0; ; attempt++) {
    try {
      await page.evaluate(async (time) => {
        await window.__DOT_DARK_FILM_PREVIEW__.renderAt(time);
        await document.fonts.ready;
      }, seconds);
      break;
    } catch (error) {
      if (attempt >= 3 || !/Execution context was destroyed|navigation|renderAt/i.test(String(error?.message))) throw error;
      console.log(`Preview reloaded at ${seconds.toFixed(2)}s; waiting and redrawing.`);
      await page.waitForLoadState("networkidle");
      await page.waitForFunction(() => Boolean(window.__DOT_DARK_FILM_PREVIEW__?.renderAt), null, { timeout: 60000 });
      await page.evaluate(() => document.fonts.ready);
    }
  }
  assert.deepEqual(pageErrors.get(page), [], "The preview must render without browser errors");
  return page.screenshot({ type: "jpeg", quality, clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT }, caret: "hide" });
}

/**
 * Deterministic PCM version of the player's typewriter palette. Rendering a small
 * click/knock for each key avoids a minutes-long native audio graph with thousands
 * of still-connected filters. The same key times and 65 ms spacing are retained.
 */
async function typewriterAudio(_page, file, duration, openingSeconds, keystrokes, trailer) {
  const rate = 48000;
  const count = Math.ceil(duration * rate);
  const mix = new Float32Array(count);
  let seed = 0x444f5446;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const noise = new Float32Array(Math.floor(rate * 0.06));
  for (let i = 0; i < noise.length; i++) noise[i] = (random() * 2 - 1) * (1 - i / noise.length) ** 2;
  const tau = Math.PI * 2;
  const ramp = (from, to, t, end) => from * Math.exp(Math.log(to / from) * Math.min(1, t / end));
  const masterGain = 0.62;
  let lastKey = -Infinity;
  let soundedKeys = 0;
  let openingSoundedKeys = 0;
  for (const { at, kind } of keystrokes) {
    if (at < 0 || at >= duration) continue;
    const start = Math.round(at * rate);
    if (kind === "bell") {
      for (const [frequency, level] of [[2093, 0.09], [3136, 0.03], [4186, 0.035]]) {
        const length = Math.min(count - start, Math.ceil(rate * 1.15));
        for (let i = 0; i < length; i++) {
          const t = i / rate;
          const gain = t < 0.006 ? ramp(0.0001, level, t, 0.006) : ramp(level, 0.0001, t - 0.006, 1.094);
          mix[start + i] += masterGain * gain * Math.sin(tau * frequency * t);
        }
      }
      continue;
    }
    if (at - lastKey < 0.065) continue;
    lastKey = at;
    soundedKeys++;
    if (at < openingSeconds) openingSoundedKeys++;
    const space = kind === "space";
    const playback = 0.9 + random() * 0.25;
    const frequency = (space ? 1300 : 2600) + random() * 600;
    const initialBar = space ? 0.55 : 0.38 + random() * 0.15;
    const initialKnock = space ? 120 : 170 + random() * 30;
    const omega = tau * frequency / rate;
    const alpha = Math.sin(omega) / (2 * 1.4);
    const a0 = 1 + alpha;
    const b0 = alpha / a0;
    const b2 = -b0;
    const a1 = -2 * Math.cos(omega) / a0;
    const a2 = (1 - alpha) / a0;
    let x1 = 0;
    let x2 = 0;
    let y1 = 0;
    let y2 = 0;
    let phase = 0;
    const length = Math.min(count - start, Math.ceil(rate * 0.07));
    for (let i = 0; i < length; i++) {
      const t = i / rate;
      const position = i * playback;
      const base = Math.floor(position);
      const blend = position - base;
      const source = base + 1 < noise.length ? noise[base] * (1 - blend) + noise[base + 1] * blend : 0;
      const filtered = b0 * source + b2 * x2 - a1 * y1 - a2 * y2;
      x2 = x1; x1 = source; y2 = y1; y1 = filtered;
      const bar = filtered * ramp(initialBar, 0.001, t, space ? 0.06 : 0.035);
      let knock = 0;
      if (t < 0.06) {
        phase += tau * ramp(initialKnock, 60, t, 0.04) / rate;
        const triangle = 2 / Math.PI * Math.asin(Math.sin(phase));
        knock = triangle * ramp(space ? 0.26 : 0.14, 0.001, t, 0.05);
      }
      mix[start + i] += masterGain * (bar + knock);
    }
  }
  const scored = addTrailerScore(mix, rate, count, trailer);
  // Normalize once, here, so the published file needs no separate volume pass.
  let rawPeak = 0;
  for (let i = 0; i < count; i++) rawPeak = Math.max(rawPeak, Math.abs(mix[i]));
  const loudness = rawPeak > 0 ? 0.5 / rawPeak : 1;
  for (let i = 0; i < count; i++) mix[i] *= loudness;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0); header.writeUInt32LE(36 + count * 2, 4); header.write("WAVE", 8);
  header.write("fmt ", 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22);
  header.writeUInt32LE(rate, 24); header.writeUInt32LE(rate * 2, 28); header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34);
  header.write("data", 36); header.writeUInt32LE(count * 2, 40);
  const output = await open(file, "w");
  let peak = 0;
  let openingPeak = 0;
  try {
    await output.write(header);
    for (let at = 0; at < count; at += 262144) {
      const length = Math.min(262144, count - at);
      const pcm = Buffer.allocUnsafe(length * 2);
      for (let i = 0; i < length; i++) {
        const value = mix[at + i];
        peak = Math.max(peak, Math.abs(value));
        if (at + i < openingSeconds * rate) openingPeak = Math.max(openingPeak, Math.abs(value));
        pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, value)) * 32767), i * 2);
      }
      await output.write(pcm);
    }
  } finally { await output.close(); }
  assert.ok(openingPeak > 0.05, `The revised opening must have audible typewriter sound (received openingPeak=${openingPeak})`);
  assert.ok(peak < 0.85, `Typewriter sound needs headroom: ${peak}`);
  console.log(`Audio: ${soundedKeys} soft keys (${openingSoundedKeys} in opening); score ${scored ? "on" : "off"}; openingPeak ${openingPeak.toFixed(4)}; peak ${peak.toFixed(4)}`);
  return { sampleRate: rate, soundedKeys, openingSoundedKeys, scored, peak, openingPeak };
}

/**
 * The opening trailer's score, cut to the shots the preview reports: heartbeats under the
 * body, a pad that swells as the senses pour in, a cold hum once the measuring lens closes
 * (faintly dissonant across the lattice, sagging in pitch as stress is sustained), near
 * silence for the pause, and a warm D-major chord that begins as the box dissolves and
 * blooms with the architecture. Pure sines, deterministic, finite; it ends before the
 * concepts (L2).
 */
function addTrailerScore(mix, rate, count, trailer) {
  if (!trailer?.shots?.length) return false;
  const at = Object.fromEntries(trailer.shots.map((shot) => [shot.kind, shot]));
  for (const kind of ["body", "senses", "design", "mistake", "pain", "nudge", "pause", "architecture", "title"]) {
    assert.ok(at[kind], `The trailer score needs the ${kind} shot`);
  }
  const tau = Math.PI * 2;
  const smooth = (t, a, b) => {
    const u = Math.min(1, Math.max(0, (t - a) / (b - a)));
    return u * u * (3 - 2 * u);
  };
  const heartbeats = trailer.heartbeats;
  // Heartbeat: a low "lub" and softer "dub", fading as the senses take over.
  for (const beat of heartbeats) {
    const fade = 1 - 0.75 * smooth(beat, at.senses.start + 1, at.senses.end);
    for (const [hit, level, from, to] of [[beat, 0.42, 62, 38], [beat + 0.3, 0.26, 70, 44]]) {
      const start = Math.round(hit * rate);
      const length = Math.min(count - start, Math.ceil(rate * 0.24));
      let phase = 0;
      for (let i = 0; i < length; i++) {
        const t = i / rate;
        phase += tau * (to + (from - to) * Math.exp(-t * 22)) / rate;
        const envelope = Math.min(1, t / 0.008) * Math.exp(-t * 17);
        mix[start + i] += level * fade * envelope * Math.sin(phase);
      }
    }
  }
  const voices = [
    // Pad (the senses → the interface).
    ...[110, 164.81, 220, 277.18, 329.63].flatMap((f) => [[f - 0.6, 0.017, "pad"], [f + 0.6, 0.017, "pad"]]),
    // Cold hum (the lens) and its dissonance (the lattice); both sag as stress is sustained.
    [98, 0.03, "hum"], [147, 0.012, "hum"], [196, 0.018, "hum"],
    [103.83, 0.014, "ache"], [207.65, 0.014, "ache"],
    // Warm chord (the box dissolving, the architecture, and the title).
    [73.42, 0.03, "chord"], [110, 0.022, "chord"], [146.83, 0.02, "chord"], [185, 0.016, "chord"],
    [220, 0.016, "chord"], [293.66, 0.012, "chord"], [369.99, 0.008, "lift"],
  ];
  const end = at.title.end;
  const settle = at.pause.start + 0.6 * (at.pause.end - at.pause.start);
  const envelopeOf = {
    pad: (t) => smooth(t, at.senses.start, at.senses.start + 5) * (1 - smooth(t, at.design.end - 0.5, at.design.end + 2.5)) * (1 + 0.15 * Math.sin(tau * 0.12 * t)),
    hum: (t) => smooth(t, at.mistake.start + 0.2, at.mistake.start + 2) * (1 - smooth(t, at.pause.start, at.pause.start + 0.6)) * (1 + 0.2 * Math.sin(tau * 0.5 * t)),
    ache: (t) => smooth(t, at.pain.start, at.pain.start + 3) * (1 - smooth(t, at.pause.start, at.pause.start + 0.6)),
    chord: (t) => (0.35 * smooth(t, settle, settle + 2) + 0.65 * smooth(t, at.architecture.start - 0.4, at.architecture.start + 3.5)) * (1 - smooth(t, end - 1.5, end + 1.5)),
    lift: (t) => smooth(t, at.architecture.start + 6, at.architecture.start + 9) * (1 - smooth(t, end - 1.5, end + 1.5)),
  };
  const sag = { hum: true, ache: true };
  const nudgeMiddle = (at.nudge.start + at.nudge.end) / 2;
  const last = Math.min(count, Math.ceil((end + 1.5) * rate));
  for (let i = 0; i < last; i++) {
    const t = i / rate;
    const bend = 1 - 0.035 * smooth(t, nudgeMiddle, at.nudge.end - 0.2);
    let sample = 0;
    for (const [frequency, level, kind] of voices) {
      const envelope = envelopeOf[kind](t);
      if (envelope <= 0) continue;
      const angle = tau * frequency * (sag[kind] ? bend : 1) * t;
      sample += level * envelope * (Math.sin(angle) + 0.22 * Math.sin(2 * angle));
    }
    mix[i] += sample;
  }
  return true;
}

async function contactSheet(context, page, openingSeconds, duration, trailer) {
  // By default, sample each trailer shot as its words are fully on screen.
  const times = SAMPLE_TIMES ?? (trailer?.shots?.length === 9
    ? trailer.shots.map((shot) => Number((shot.start + 0.62 * (shot.end - shot.start)).toFixed(1)))
    : [3, 18, 28, 38, 48, 56, 80, 200, 345]);
  const poster = POSTER_TIME ?? (trailer?.shots?.length ? Number((trailer.shots.at(-1).end - 2).toFixed(1)) : 28);
  assert.ok([...times, poster].every((time) => time < duration), "Poster and sample times must fall within the film");
  const images = [];
  for (const time of times) images.push({ time, data: (await frame(page, time, 92)).toString("base64") });
  await writeFile(path.join(OUTPUT, `concept-film-poster-${SUFFIX}.jpg`), await frame(page, poster));
  const sheet = await context.newPage();
  try {
    await sheet.setViewportSize({ width: 1920, height: 1176 });
    await sheet.setContent(`<html><head><style>*{box-sizing:border-box}body{margin:0;background:#07100d;color:#cfdfd6;font:16px monospace}main{display:grid;grid-template-columns:repeat(3,640px)}figure{margin:0;border:1px solid #223c30}img{display:block;width:638px;height:359px}figcaption{height:31px;padding:6px 14px}</style></head><body><main>${images.map(({ time, data }) => `<figure><img src="data:image/jpeg;base64,${data}"><figcaption>${time.toFixed(1)}s · Revised dark draft</figcaption></figure>`).join("")}</main></body></html>`);
    await sheet.evaluate(() => Promise.all([...document.images].map((image) => image.decode())));
    const file = path.join(OUTPUT, `concept-film-contact-sheet-${SUFFIX}.jpg`);
    await sheet.screenshot({ path: file, type: "jpeg", quality: 94 });
    console.log(`Contact sheet: ${file}`);
  } finally { await sheet.close(); }
}

async function encode(pages, duration, audio, target) {
  const child = spawn(FFMPEG, [
    "-hide_banner", "-loglevel", "error", "-y",
    "-f", "image2pipe", "-framerate", String(FPS), "-vcodec", "mjpeg", "-i", "pipe:0", "-i", audio,
    "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-threads", "4", "-profile:v", "high", "-level:v", "4.2",
    "-pix_fmt", "yuv420p", "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
    "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-ac", "2", "-t", String(duration), "-movflags", "+faststart", target,
  ], { stdio: ["pipe", "ignore", "pipe"] });
  let errors = "";
  child.stderr.on("data", (chunk) => { errors = (errors + chunk).slice(-8000); });
  child.stdin.on("error", () => {});
  const done = once(child, "close");
  done.catch(() => {});
  const frames = Math.ceil(duration * FPS);
  const started = Date.now();
  try {
    for (let at = 0; at < frames; at += pages.length) {
      assert.equal(child.exitCode, null, `Encoder stopped early: ${errors}`);
      const count = Math.min(pages.length, frames - at);
      const batch = await Promise.all(Array.from({ length: count }, (_, index) => frame(pages[index], (at + index) / FPS)));
      for (const image of batch) {
        if (!child.stdin.write(image)) await Promise.race([
          once(child.stdin, "drain"),
          done.then(([code]) => { throw new Error(`Encoder stopped while receiving frames (${code}): ${errors}`); }),
        ]);
      }
      if (at % (FPS * 10) < pages.length) {
        const elapsed = (Date.now() - started) / 1000;
        console.log(`Render: ${(at / FPS).toFixed(1)}/${duration}s (${(at / Math.max(elapsed, 0.001)).toFixed(1)} frames/sec captured)`);
      }
    }
    child.stdin.end();
    const [code] = await done;
    assert.equal(code, 0, `Encoding failed: ${errors}`);
    return frames;
  } catch (error) {
    child.kill("SIGTERM");
    throw error;
  }
}

async function inspect(file, duration) {
  const { stdout } = await command(FFPROBE, ["-v", "error", "-show_entries", "format=duration:stream=codec_name,codec_type,width,height,r_frame_rate,nb_frames", "-of", "json", file]);
  const metadata = JSON.parse(stdout);
  const video = metadata.streams.find((stream) => stream.codec_type === "video");
  const audio = metadata.streams.find((stream) => stream.codec_type === "audio");
  assert.ok(video?.codec_name === "h264" && video.width === WIDTH && video.height === HEIGHT, "The output must be H.264 at 1920×1080");
  assert.equal(video.r_frame_rate, `${FPS}/1`);
  assert.equal(Number(video.nb_frames), Math.ceil(duration * FPS));
  assert.equal(audio?.codec_name, "aac");
  assert.ok(Math.abs(Number(metadata.format.duration) - duration) <= 1 / FPS + 0.01);
  const bytes = await readFile(file);
  const moov = bytes.indexOf(Buffer.from("moov"));
  const mdat = bytes.indexOf(Buffer.from("mdat"));
  assert.ok(moov >= 0 && mdat > moov, "The MP4 must support faststart");
  return { ...metadata, sha256: createHash("sha256").update(bytes).digest("hex") };
}

async function publish(source, destination) {
  const ready = `${destination}.ready`;
  await copyFile(source, ready);
  await rename(ready, destination);
}

async function exportExcerpt(opening, openingSeconds) {
  const range = EXCERPT ?? (EXCERPT_OPENING ? [0, openingSeconds] : null);
  if (!range) return null;
  const [start, end] = range;
  assert.ok(end <= openingSeconds, "The excerpt must fall within the newly captured opening");
  const duration = end - start;
  const file = path.join(OUTPUT, `${EXCERPT_NAME}.mp4`);
  await command(FFMPEG, [
    "-hide_banner", "-loglevel", "error", "-y", "-ss", String(start), "-i", opening,
    "-t", String(duration), "-frames:v", String(Math.ceil(duration * FPS)), "-c:v", "libx264", "-preset", "fast", "-crf", "17", "-threads", "4",
    "-pix_fmt", "yuv420p", "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
    "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-ac", "2", "-movflags", "+faststart", file,
  ]);
  const metadata = await inspect(file, duration);
  await command(FFMPEG, ["-v", "error", "-threads", "2", "-i", file, "-f", "null", "-"]);
  const result = { ...metadata, file, startSeconds: start, duration, frames: Math.ceil(duration * FPS), decode: "passed" };
  await writeFile(path.join(OUTPUT, `${EXCERPT_NAME}.json`), `${JSON.stringify(result, null, 2)}\n`);
  console.log(`Review excerpt ready and decoded: ${file}`);
  return result;
}

await mkdir(OUTPUT, { recursive: true });
const temporary = await mkdtemp(path.join(os.tmpdir(), "dot-dark-film-render-"));
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1, colorScheme: "dark", reducedMotion: "no-preference", serviceWorkers: "block" });
  const page = await preparePage(context);
  const info = await page.evaluate(() => {
    const { duration, openingSeconds, keystrokes, trailer } = window.__DOT_DARK_FILM_PREVIEW__;
    return { duration, openingSeconds, keystrokes, trailer };
  });
  assert.ok(Number.isFinite(info.duration) && info.duration > info.openingSeconds && info.openingSeconds > 0);
  assert.ok(info.keystrokes.every(({ at, kind }, i) => Number.isFinite(at) && at > 0 && at < info.duration && ["key", "space", "bell"].includes(kind) && (i === 0 || info.keystrokes[i - 1].at <= at)), "Preview keys must be sorted and span the film");
  console.log(`Trailer: ${info.openingSeconds.toFixed(1)}s · ${(info.trailer?.shots ?? []).map((shot) => `${shot.kind} ${shot.start.toFixed(1)}`).join(" · ")}`);
  await contactSheet(context, page, info.openingSeconds, info.duration, info.trailer);
  if (!STILLS_ONLY) {
    await command(FFMPEG, ["-version"]);
    await command(FFPROBE, ["-version"]);
    const duration = OPENING_ONLY ? info.openingSeconds : info.duration;
    const audio = path.join(temporary, "typewriter.wav");
    const audioMetadata = await typewriterAudio(page, audio, duration, info.openingSeconds, info.keystrokes, info.trailer);
    const pages = [page];
    for (let i = 1; i < WORKERS; i++) pages.push(await preparePage(context));
    const full = path.join(OUTPUT, `concept-film-full-16x9-${SUFFIX}.mp4`);
    const opening = path.join(OUTPUT, `concept-film-opening-16x9-${SUFFIX}.mp4`);
    const temporaryVideo = path.join(temporary, "revised-dark.mp4");
    const reuse = REUSE_BODY && !OPENING_ONLY;
    const capturedDuration = reuse ? info.openingSeconds : duration;
    const frameCount = Math.ceil(duration * FPS);
    await encode(pages, capturedDuration, audio, temporaryVideo);
    let metadata = await inspect(temporaryVideo, capturedDuration);
    const outputVideo = OPENING_ONLY ? opening : full;
    let openingMetadata = metadata;
    let reusedBody = null;
    let excerptMetadata = null;
    if (reuse) {
      // The new PCM track comes from the new timeline, never from an imprecise audio
      // stream cut. Only the old video after the exact body boundary is reused.
      const originalDuration = duration - info.openingSeconds + BODY_START;
      const sourceMetadata = await inspect(REUSE_BODY, originalDuration);
      reusedBody = { file: path.resolve(REUSE_BODY), startSeconds: BODY_START, newStartSeconds: info.openingSeconds, sourceSha256: sourceMetadata.sha256 };
      await publish(temporaryVideo, opening);
      await context.close();
      excerptMetadata = await exportExcerpt(opening, info.openingSeconds);
      console.log(`Joining ${info.openingSeconds}s opening with unchanged video from ${BODY_START}s; regenerating the complete audio timeline.`);
      const joined = path.join(temporary, "joined-dark.mp4");
      await command(FFMPEG, [
        "-hide_banner", "-loglevel", "error", "-y", "-i", temporaryVideo, "-i", REUSE_BODY, "-i", audio,
        "-filter_complex", `[0:v]setpts=PTS-STARTPTS[prefix];[1:v]trim=start=${BODY_START},setpts=PTS-STARTPTS[body];[prefix][body]concat=n=2:v=1:a=0,format=yuv420p[video]`,
        "-map", "[video]", "-map", "2:a:0", "-frames:v", String(frameCount), "-r", String(FPS),
        "-c:v", "libx264", "-preset", "fast", "-crf", "17", "-threads", "4", "-profile:v", "high", "-level:v", "4.2",
        "-pix_fmt", "yuv420p", "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
        "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-ac", "2", "-t", String(duration), "-movflags", "+faststart", joined,
      ]);
      metadata = await inspect(joined, duration);
      await publish(joined, full);
    } else {
      await publish(temporaryVideo, outputVideo);
    }
    if (!OPENING_ONLY && !reuse) {
      await command(FFMPEG, ["-hide_banner", "-loglevel", "error", "-y", "-i", full, "-t", String(info.openingSeconds), "-frames:v", String(Math.ceil(info.openingSeconds * FPS)), "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-threads", "4", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", opening]);
      openingMetadata = await inspect(opening, info.openingSeconds);
    }
    if (!reuse) excerptMetadata = await exportExcerpt(opening, info.openingSeconds);
    await writeFile(path.join(OUTPUT, `concept-film-${SUFFIX}.json`), `${JSON.stringify({ draft: true, duration, openingSeconds: info.openingSeconds, width: WIDTH, height: HEIGHT, fps: FPS, frames: frameCount, audio: audioMetadata, reusedBody, excerpt: excerptMetadata, video: metadata, opening: openingMetadata, full: OPENING_ONLY ? null : full, openingFile: opening }, null, 2)}\n`);
    console.log(`Finished: ${outputVideo}\nOpening: ${opening}`);
  }
} finally {
  await browser.close();
  await rm(temporary, { recursive: true, force: true });
}
