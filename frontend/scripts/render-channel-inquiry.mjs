import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { existsSync } from "node:fs";
import { copyFile, mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { NOTE, writeDigitalScore } from "./channel-digital-audio.mjs";
import { buildInquiryDocument, INQUIRY_CONTEXT, INQUIRY_VIDEOS, inquirySubtitles, inquiryTypeTicks } from "./channel-inquiry-video.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUTPUT = path.join(ROOT, "design/youtube");
const ASSETS_DIR = path.join(OUTPUT, "assets");
const FFMPEG = process.env.DOT_FFMPEG || (existsSync("/tmp/dot-channel-video-tools/ffmpeg") ? "/tmp/dot-channel-video-tools/ffmpeg" : "ffmpeg");
const FPS = 30;
const stillsOnly = process.argv.includes("--stills");

async function fonts() {
  const declarations = [];
  const specs = [
    ["inter", "Inter", 400, "normal"],
    ["inter", "Inter", 500, "normal"],
    ["inter", "Inter", 600, "normal"],
    ["inter", "Inter", 700, "normal"],
    ["inter", "Inter", 400, "italic"],
    ["space-grotesk", "Space Grotesk", 500, "normal"],
    ["space-grotesk", "Space Grotesk", 700, "normal"],
    ["source-serif-4", "Source Serif 4", 400, "normal"],
    ["source-serif-4", "Source Serif 4", 600, "normal"],
    ["source-serif-4", "Source Serif 4", 400, "italic"],
    ["jetbrains-mono", "JetBrains Mono", 400, "normal"],
    ["jetbrains-mono", "JetBrains Mono", 500, "normal"],
    ["jetbrains-mono", "JetBrains Mono", 600, "normal"],
    ["jetbrains-mono", "JetBrains Mono", 700, "normal"],
  ];
  for (const [pkg, family, weight, style] of specs) {
    const bytes = await readFile(
      path.join(ROOT, `frontend/node_modules/@fontsource/${pkg}/files/${pkg}-latin-${weight}-${style}.woff2`),
    );
    declarations.push(
      `@font-face{font-family:"${family}";font-style:${style};font-weight:${weight};src:url(data:font/woff2;base64,${bytes.toString("base64")}) format("woff2")}`,
    );
  }
  return declarations.join("\n");
}

async function run(command, args) {
  const child = spawn(command, args, { stdio: ["ignore", "ignore", "pipe"] });
  let log = "";
  child.stderr.on("data", (chunk) => {
    log += chunk;
  });
  const done = once(child, "close");
  const [code] = await done;
  if (code !== 0) throw new Error(`${command} exited ${code}: ${log.slice(-4000)}`);
  return log;
}

function score(video) {
  const baseName = video.baseName || video.name.replace(/-light$/, "");
  if (baseName === "mark-splash") {
    return {
      durationSeconds: video.duration,
      peak: 0.11,
      ticks: [0.18, 0.26, 0.34, 0.42, 1.42, 1.50, 1.58, 1.66, 2.92, 3.00, 3.08],
      events: [
        { t: 0.16, freq: NOTE.A2, amp: 0.14, pan: -0.1, kind: "thump" },
        { t: 1.42, freq: NOTE.E2, amp: 0.12, pan: 0.1, kind: "thump" },
        { t: 2.92, freq: NOTE.A2, amp: 0.14, pan: 0, kind: "thump" },
      ],
    };
  }
  if (baseName === "inquiry-trailer") {
    return {
      durationSeconds: video.duration,
      peak: 0.12,
      cinematicSilence: true,
      ticks: inquiryTypeTicks(video),
      // Quiet, non-musical frame-advance micro-pulses only (no bells or meditation pads)
      events: [
        { t: 9.6, freq: NOTE.A1, amp: 0.12, kind: "thump" },
        { t: 18.0, freq: NOTE.A1, amp: 0.12, kind: "thump" },
        { t: 26.4, freq: NOTE.A1, amp: 0.12, kind: "thump" },
        { t: 34.8, freq: NOTE.A1, amp: 0.15, kind: "thump" },
        { t: 46.6, freq: NOTE.A1, amp: 0.14, kind: "thump" },
        { t: 58.4, freq: NOTE.A1, amp: 0.14, kind: "thump" },
        { t: 70.2, freq: NOTE.A1, amp: 0.14, kind: "thump" },
        { t: 81.6, freq: NOTE.A1, amp: 0.14, kind: "thump" },
        { t: 93.0, freq: NOTE.A1, amp: 0.14, kind: "thump" },
        { t: 104.4, freq: NOTE.A1, amp: 0.12, kind: "thump" },
        { t: 115.0, freq: NOTE.A1, amp: 0.12, kind: "thump" },
      ],
    };
  }
  return {
    durationSeconds: video.duration,
    peak: 0.12,
    ticks: inquiryTypeTicks(video),
    events: video.captions.map(({ start }) => ({
      t: start,
      freq: NOTE.A1,
      amp: 0.12,
      kind: "thump",
    })),
  };
}

async function verifyForegroundMotion(page, video, outName) {
  const baseName = video.baseName || video.name.replace(/-light$/, "");
  const centered = baseName !== "inquiry-trailer";
  const difference = await page.evaluate((isCentered) => {
    const canvas = document.querySelector("canvas");
    const s = canvas.width / 1920;
    const ctx = canvas.getContext("2d");
    window.seekInquiry(isCentered ? 0.9 : 38.0);
    const a = ctx.getImageData((isCentered ? 670 : 1080) * s, 160 * s, 580 * s, 480 * s).data;
    window.seekInquiry(isCentered ? 2.1 : 41.2);
    const b = ctx.getImageData((isCentered ? 670 : 1080) * s, 160 * s, 580 * s, 480 * s).data;
    let total = 0;
    for (let i = 0; i < a.length; i += 4) {
      total += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
    }
    return total / ((a.length / 4) * 3);
  }, centered);
  assert.ok(difference > 0.35, `Foreground is too static (${outName}): ${difference}`);
  console.log(`${outName}: moving foreground verified (${difference.toFixed(2)} mean pixel change)`);
}

async function render(page, video, identity, embeddedFonts, temporary, theme = "dark") {
  const isLight = theme === "light";
  const outName = isLight ? `${video.name}-light` : video.name;
  // Render ALL videos at native 4K UHD (3840x2160, scale: 2) so YouTube uses its 4K VP9/AV1 high-bitrate tier and text/lines are razor-sharp.
  const is4k = true;
  const document = buildInquiryDocument({ video, identity, fonts: embeddedFonts, scale: 2, theme });
  await page.setContent(document);
  await page.evaluate(() => window.inquiryReady);
  await verifyForegroundMotion(page, video, outName);
  const thumbs = [];
  for (const t of video.samples) {
    const bounds = await page.evaluate((sampleTime) => {
      window.seekInquiry(sampleTime);
      return window.inquiryTextBounds;
    }, t);
    if (video.name === "inquiry-trailer" && t >= 9.5 && t < 125) {
      const leftCaptionBounds = bounds.filter((b) => b.left < 200 && b.top > 250 && b.bottom < 900);
      for (const b of leftCaptionBounds) {
        assert.ok(b.right < 968, `Left caption crosses grid divider at ${t}s (${outName}): ${b.text} (right=${b.right})`);
      }
    }
    const image = await page.evaluate(() => {
      const thumb = document.createElement("canvas");
      thumb.width = 640;
      thumb.height = 360;
      thumb.getContext("2d").drawImage(document.querySelector("canvas"), 0, 0, 640, 360);
      return thumb.toDataURL("image/png").split(",")[1];
    });
    thumbs.push({ t, image });
  }

  await page.evaluate((t) => window.seekInquiry(t), video.samples.at(-1));
  const posterBase64 = await page.evaluate(() => document.querySelector("canvas").toDataURL("image/png").split(",")[1]);
  const posterPath = path.join(ASSETS_DIR, `${outName}-poster.png`);
  await writeFile(posterPath, Buffer.from(posterBase64, "base64"));
  if (video.name === "mark-splash") {
    await copyFile(posterPath, path.join(OUTPUT, `${outName}.png`));
  }

  const sbBg = isLight ? "#eef5f1" : "#020303";
  const sbInk = isLight ? "#0f211b" : "#edf3f0";
  const sbBorder = isLight ? "#c8dbd3" : "#142620";
  const sbAccent = isLight ? "#1a6349" : "#54b891";
  const frames = thumbs
    .map(({ t, image }) => `<figure><img src="data:image/png;base64,${image}"><figcaption>${t.toFixed(1)}s · ${theme.toUpperCase()}</figcaption></figure>`)
    .join("");
  await page.setViewportSize({ width: 1920, height: 800 });
  await page.setContent(
    `<!doctype html><html><head><style>${embeddedFonts}body{margin:0;background:${sbBg};color:${sbInk};font:700 20px "Space Grotesk"}main{display:grid;grid-template-columns:repeat(3,640px)}figure{margin:0;border:1px solid ${sbBorder}}img{display:block;width:640px;height:360px}figcaption{height:40px;padding:8px 16px;box-sizing:border-box;color:${sbAccent}}</style></head><body><main>${frames}</main></body></html>`,
  );
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((i) => i.decode()));
  });
  await page.screenshot({ path: path.join(ASSETS_DIR, `${outName}-storyboard.png`) });
  await page.setViewportSize({ width: 1920, height: 1080 });
  if (!isLight && video.captions.length) {
    await writeFile(path.join(ASSETS_DIR, `${video.name}.srt`), inquirySubtitles(video));
  }
  if (stillsOnly) return;

  // Use 1920x1080 canvas capture piped into multi-threaded FFmpeg Lanczos 4K (3840x2160) H.264 High@L5.1 encoder for fast 4K UHD output
  const streamDoc = buildInquiryDocument({ video, identity, fonts: embeddedFonts, scale: 1, theme });
  await page.setContent(streamDoc);
  await page.evaluate(() => window.inquiryReady);

  const wavPath = path.join(temporary, `${outName}.wav`);
  await writeDigitalScore({ ...score(video), wavPath });
  const file = path.join(temporary, `${outName}.mp4`);
  const child = spawn(
    FFMPEG,
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-f",
      "image2pipe",
      "-framerate",
      String(FPS),
      "-vcodec",
      "mjpeg",
      "-i",
      "pipe:0",
      "-i",
      wavPath,
      "-vf",
      "scale=3840:2160:flags=lanczos+accurate_rnd",
      "-c:v",
      "libx264",
      "-profile:v",
      "high",
      "-level:v",
      "5.1",
      "-threads",
      "0",
      "-preset",
      "superfast",
      "-crf",
      "11",
      "-pix_fmt",
      "yuv420p",
      "-color_primaries",
      "bt709",
      "-color_trc",
      "bt709",
      "-colorspace",
      "bt709",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-ar",
      "48000",
      "-t",
      String(video.duration),
      "-movflags",
      "+faststart",
      file,
    ],
    { stdio: ["pipe", "ignore", "pipe"] },
  );
  let log = "";
  child.stderr.on("data", (chunk) => {
    log += chunk;
  });
  const done = once(child, "close");
  done.catch(() => {});
  try {
    for (let frame = 0; frame < video.duration * FPS; frame++) {
      const base64 = await page.evaluate((t) => {
        window.seekInquiry(t);
        return document.querySelector("canvas").toDataURL("image/jpeg", 0.96).split(",")[1];
      }, frame / FPS);
      if (!child.stdin.write(Buffer.from(base64, "base64"))) await once(child.stdin, "drain");
      if (frame % (FPS * 12) === 0) console.log(`${outName}: ${frame / FPS}/${video.duration}s`);
    }
    child.stdin.end();
    const [code] = await done;
    if (code !== 0) throw new Error(`Video encoding failed (${outName}): ${log}`);
  } catch (error) {
    child.kill();
    throw error;
  }
  const decoded = await run(FFMPEG, ["-hide_banner", "-i", file, "-f", "null", "-"]);
  assert.match(decoded, /Video: h264/);
  assert.match(decoded, is4k ? /3840x2160/ : /1920x1080/);
  assert.match(decoded, /30 fps/);
  assert.match(decoded, /Audio: aac/);
  assert.match(decoded, new RegExp(`frame=\\s*${video.duration * FPS}\\b`));
  const mins = String(Math.floor(video.duration / 60)).padStart(2, "0");
  const secs = String(video.duration % 60).padStart(2, "0");
  assert.ok(decoded.includes(`Duration: 00:${mins}:${secs}.00`));
  const loudness = await run(FFMPEG, ["-hide_banner", "-i", file, "-af", "volumedetect", "-vn", "-f", "null", "-"]);
  const maximum = Number(loudness.match(/max_volume: ([-\d.]+) dB/)?.[1]);
  assert.ok(maximum < -1, `Audio peak needs headroom: ${maximum}`);
  const metadata = {
    ...video,
    name: outName,
    theme,
    file: `${outName}.mp4`,
    width: is4k ? 3840 : 1920,
    height: is4k ? 2160 : 1080,
    fps: FPS,
    frames: video.duration * FPS,
    codec: "H.264",
    audio: "AAC stereo 48 kHz",
    max_volume_dbfs: maximum,
    style: "Precision architectural plates, dual-theme studio lighting (Dark Obsidian & Light Archival), Big C and Little c mathematical loops, and canonical DOT mark.",
    context: INQUIRY_CONTEXT,
    render_sha256: createHash("sha256").update(document).digest("hex"),
    video_sha256: createHash("sha256").update(await readFile(file)).digest("hex"),
  };
  const readyFile = path.join(OUTPUT, `.${outName}.ready.mp4`);
  await copyFile(file, readyFile);
  await rename(readyFile, path.join(OUTPUT, `${outName}.mp4`));
  await writeFile(path.join(ASSETS_DIR, `${outName}.json`), JSON.stringify(metadata, null, 2) + "\n");
  console.log(`${outName}: decoded ${metadata.frames} frames; H.264/AAC ${is4k ? "4K" : "1080p"}, ${maximum} dBFS peak`);
}

function preview(embeddedFonts, identity) {
  const videos = INQUIRY_VIDEOS.map(({ name, duration, title, captions }) => {
    const label = name === "mark-splash" ? "MARK-ONLY SPLASH" : name.endsWith("intro") ? "FILM 2 · THE DOT IDENTITY FILM" : "FILM 1 · OFFICIAL DOT TRAILER";
    const srtLink = captions.length ? `<a download href="assets/${name}.srt">Captions (.srt)</a>` : "";
    return `<article>
      <div class="meta"><span>${label}</span><span>${duration} SECONDS · 4K UHD (3840×2160) · 30 FPS · DARK &amp; LIGHT EDITIONS</span></div>
      <h2>${duration}-second ${name === "mark-splash" ? "mark-only splash" : name.endsWith("intro") ? "identity film" : "cinematic trailer"} — ${title}</h2>
      <div class="edition-grid">
        <div class="edition-card">
          <div class="edition-tag">DARK STUDIO EDITION (OBSIDIAN BLACK)</div>
          <div class="video-stage">
            <video controls playsinline preload="metadata" poster="assets/${name}-poster.png"><source src="${name}.mp4" type="video/mp4"></video>
            <a class="video-cta-overlay" href="https://dotheory.org" target="_blank" rel="noopener noreferrer" title="Visit dotheory.org">dotheory.org ↗</a>
          </div>
          <p class="links"><a download href="${name}.mp4">Download Dark MP4</a>${srtLink}<a href="assets/${name}-storyboard.png">Dark Storyboard</a><a href="assets/${name}-poster.png">Dark Poster</a><a href="https://dotheory.org" target="_blank" rel="noopener noreferrer">dotheory.org ↗</a></p>
        </div>
        <div class="edition-card light-card">
          <div class="edition-tag">LIGHT ARCHIVAL EDITION (ALABASTER)</div>
          <div class="video-stage">
            <video controls playsinline preload="metadata" poster="assets/${name}-light-poster.png"><source src="${name}-light.mp4" type="video/mp4"></video>
            <a class="video-cta-overlay" href="https://dotheory.org" target="_blank" rel="noopener noreferrer" title="Visit dotheory.org">dotheory.org ↗</a>
          </div>
          <p class="links"><a download href="${name}-light.mp4">Download Light MP4</a>${srtLink}<a href="assets/${name}-light-storyboard.png">Light Storyboard</a><a href="assets/${name}-light-poster.png">Light Poster</a><a href="https://dotheory.org" target="_blank" rel="noopener noreferrer">dotheory.org ↗</a></p>
        </div>
      </div>
    </article>`;
  }).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DOT · The Observer Belongs in the Inquiry (Dark &amp; Light Suite)</title><style>${embeddedFonts}
  *{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 50% 0%,#0b1a15 0%,#030605 62%,#010202 100%);color:#f4f8f6;font:18px/1.65 "Space Grotesk",sans-serif}main{max-width:1360px;margin:auto;padding:56px 28px}header{max-width:880px;margin-bottom:44px}.eyebrow,.meta,.edition-tag{font:700 13px/1.6 "JetBrains Mono",monospace;letter-spacing:.12em;text-transform:uppercase;color:#54d19f}.meta{display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px 16px;margin-bottom:8px}h1{font-size:clamp(30px,5vw,58px);font-weight:700;line-height:1.08;letter-spacing:-1.6px;margin:10px 0 18px;color:#f4f8f6}h2{font-weight:700;font-size:clamp(21px,2.8vw,28px);letter-spacing:-.02em;margin:0 0 20px;color:#f4f8f6}p{color:#b4c8bf}.lead{font:600 clamp(18px,2.2vw,22px)/1.58 "Source Serif 4",Georgia,serif;color:#d6e6df}article{margin:0 0 48px;padding:28px;border-radius:18px;background:rgba(7,13,11,.92);border:1.5px solid ${identity.dark.border};box-shadow:0 18px 44px rgba(0,0,0,.55)}.edition-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}.edition-card{padding:18px;border-radius:14px;background:rgba(3,6,5,.92);border:1px solid ${identity.dark.border}}.edition-card.light-card{background:#f6faf8;color:#0d1f19;border-color:#d4e2dc}.edition-card.light-card .edition-tag{color:#146c4e}.edition-card.light-card a{color:#146c4e}.edition-tag{margin-bottom:10px}.video-stage{position:relative}.video-cta-overlay{position:absolute;top:14px;right:14px;z-index:2;padding:6px 12px;border-radius:999px;background:rgba(2,4,3,.78);border:1px solid rgba(84,209,159,.38);color:#6ee2b4;font:600 12px/1.2 "JetBrains Mono",monospace;text-decoration:none;backdrop-filter:blur(8px);transition:border-color .18s ease,background .18s ease}.video-cta-overlay:hover{background:rgba(12,28,22,.92);border-color:#54d19f}.light-card .video-cta-overlay{background:rgba(246,250,248,.88);border-color:rgba(20,108,78,.32);color:#146c4e}video{display:block;width:100%;aspect-ratio:16/9;background:#020303;border-radius:10px;border:1px solid ${identity.dark.border}}.light-card video{background:#f6faf8;border-color:#d4e2dc}a{color:#6ee2b4;font-weight:600;text-underline-offset:4px}.links{display:flex;flex-wrap:wrap;gap:12px 20px;margin:14px 0 0;font-size:15px}footer{border-top:1.5px solid ${identity.dark.border};padding-top:24px;font-size:15px}summary{cursor:pointer;font-weight:700;color:#f4f8f6}img{max-width:100%}@media(max-width:960px){.edition-grid{grid-template-columns:1fr}}@media(max-width:720px){main{padding:24px 14px 40px}header{margin-bottom:28px}article{padding:16px 14px;margin-bottom:28px;border-radius:14px}video{border-radius:8px}.links{gap:10px 16px;font-size:15px}}</style></head><body><main>
  <header><p class="eyebrow">DIGITAL ORGANISM THEORY · DARK STUDIO &amp; LIGHT ARCHIVAL FILM SUITE</p><h1>The Observer Belongs<br>in the Inquiry.</h1><p class="lead">Pitting Digital Organism Theory against the blind spot of reductive materialism and unexamined dogma—before unfolding the Big C and Little c mathematical loops, RF₀, the Canvas and the Painting, and the observer’s return in near-silence. Rendered in both Dark Studio (Obsidian) and Light Archival (Ivory Monograph) editions.</p></header>${videos}
  <footer><p>Current-events context: <a href="${INQUIRY_CONTEXT.source.url}">${INQUIRY_CONTEXT.source.title}</a> · ${INQUIRY_CONTEXT.source.publisher}, 23 September 2026. Context checked 22 October 2026.</p><p>DOT's consciousness model remains a proposed, falsifiable model: <em>“The model must permit criticism that it cannot reinterpret as pathology.”</em></p><details><summary>Read the verbatim narration &amp; on-screen lines</summary>${INQUIRY_VIDEOS.filter((v) => v.captions.length).map((v) => `<h3>${v.duration}-second ${v.name.endsWith("intro") ? "DOT Identity Film" : "Official DOT Trailer"}</h3><p>${v.captions.map((c) => { const noteText = c.notes ? c.notes.join(" ") : c.note; return `<strong>${c.lines.join(" ")}</strong>${noteText ? ` — <em>${noteText}</em>` : ""}`; }).join("<br>")}</p>`).join("")}</details></footer>
  </main></body></html>`;
}

await mkdir(OUTPUT, { recursive: true });
await mkdir(ASSETS_DIR, { recursive: true });
const identity = JSON.parse(await readFile(path.join(ROOT, "frontend/src/content/identity.json"), "utf8"));
const embeddedFonts = await fonts();
if (!stillsOnly) await run(FFMPEG, ["-version"]);
const browser = await chromium.launch({ ...(process.env.DOT_CHROME ? { executablePath: process.env.DOT_CHROME } : {}) });
const temporary = await mkdtemp(path.join(os.tmpdir(), "dot-inquiry-"));
try {
  const darkPage = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const lightPage = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  darkPage.on("pageerror", (error) => {
    throw error;
  });
  lightPage.on("pageerror", (error) => {
    throw error;
  });
  for (const video of INQUIRY_VIDEOS) {
    await Promise.all([
      render(darkPage, video, identity, embeddedFonts, temporary, "dark"),
      render(lightPage, video, identity, embeddedFonts, temporary, "light"),
    ]);
  }
  const previewHtml = preview(embeddedFonts, identity);
  await writeFile(path.join(OUTPUT, "inquiry-preview.html"), previewHtml);
  console.log(`Preview: ${path.join(OUTPUT, "inquiry-preview.html")}`);
} finally {
  await browser.close();
  await rm(temporary, { recursive: true, force: true });
}
