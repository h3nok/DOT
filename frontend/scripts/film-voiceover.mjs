// Narrates the film's opening in the author's voice, one take per on-screen line, with the
// local voice model (offline: no network, the author's own reference recordings). Writes masters
// and a manifest the exporter mixes from: render-dark-film.mjs --voiceover=<run directory>.
// Usage: pnpm dlx vite-node scripts/film-voiceover.mjs [--speed=0.91]
// Takes stay private in artifacts/voiceover/film (git-ignored).
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { masterVoiceover, probeAudio } from "./voiceover-audio.mjs";

const ROOT = path.resolve(import.meta.dirname, "../..");
const PRIVATE = path.join(ROOT, "artifacts/voiceover");
const option = (name, fallback) => process.argv.find((argument) => argument.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const speed = Number(option("speed", "0.91"));
const { DARK_TRAILER_LINES } = await import(path.join(ROOT, "frontend/src/blocks/films/darkFilmRevision.ts"));

// Every typed line, spoken as it appears. The title is said as a sentence.
const lines = DARK_TRAILER_LINES.map((line, index) => ({
  number: index + 1,
  text: /[.?!,]$/.test(line.text) ? line.text : `${line.text}.`,
  display: line.text,
}));
const reference = path.join(PRIVATE, "reference/voice.wav");
const referenceText = path.join(PRIVATE, "reference/voice.txt");
const inWorkspace = (target) => `/workspace/${path.relative(ROOT, target)}`;

const sha = createHash("sha256").update(JSON.stringify(lines.map(({ text }) => text))).digest("hex").slice(0, 12);
const run = path.join(PRIVATE, "film", `${new Date().toISOString().replace(/[:.]/g, "-")}-${sha}`);
await mkdir(path.join(run, "masters"), { recursive: true });
await writeFile(path.join(run, "scenes.json"), JSON.stringify(lines.map(({ number, text }) => ({ number, text })), null, 2));
await readFile(reference);
console.log(`Narrating ${lines.length} lines into ${path.relative(ROOT, run)}`);

const uid = process.getuid?.() ?? 1000;
const gid = process.getgid?.() ?? 1000;
const child = spawn("docker", [
  "run", "--rm", "--network", "none", "--gpus", "all", "--user", `${uid}:${gid}`,
  "-e", "HOME=/tmp", "-e", "HF_HOME=/hf-cache", "-e", "HF_HUB_DISABLE_XET=1", "-e", "HF_HUB_OFFLINE=1",
  "-e", "NUMBA_CACHE_DIR=/tmp/numba_cache", "-e", "MPLCONFIGDIR=/tmp/mpl",
  "-v", `${ROOT}:/workspace`, "-v", `${ROOT}/.cache/huggingface:/hf-cache`,
  "dot-voice-clone:local", "python3", "-u", "/workspace/frontend/scripts/synthesize-voiceover.py",
  "--manifest", inWorkspace(path.join(run, "scenes.json")), "--reference", inWorkspace(reference),
  "--reference-text", inWorkspace(referenceText), "--output", inWorkspace(run), "--speed", String(speed),
], { stdio: "inherit" });
const [code] = await once(child, "close");
if (code !== 0) throw new Error(`Local voice synthesis exited ${code}.`);

const manifest = [];
for (const { number, display } of lines) {
  const master = path.join(run, "masters", `line-${number}.wav`);
  await masterVoiceover(path.join(run, `raw-scene-${number}.wav`), master, { leadInSeconds: 0.05, tailSeconds: 0.25 });
  const { durationSeconds } = await probeAudio(master);
  manifest.push({ text: display, file: path.basename(master), durationSeconds });
}
await writeFile(path.join(run, "manifest.json"), `${JSON.stringify({ speed, lines: manifest }, null, 2)}\n`);
console.log(`Ready: --voiceover=${run}`);
