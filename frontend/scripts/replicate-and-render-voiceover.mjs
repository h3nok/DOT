import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TRAILER_SCENES } from "./channel-inquiry-video.mjs";
import { processVoiceover } from "./process-voiceover.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const PRIVATE = path.join(ROOT, "artifacts/voiceover");
const value = (name, fallback) => process.argv.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const only = value("only", "").split(",").filter(Boolean).map(Number);
const scenes = TRAILER_SCENES.filter(scene => !only.length || only.includes(scene.number));
if (!scenes.length || only.some(number => !scenes.some(scene => scene.number === number))) throw new Error("Unknown voiceover scene selection.");
const speed = Number(value("speed", "0.9"));
if (!(speed >= 0.75 && speed <= 1.1)) throw new Error("Choose a speech speed between 0.75 and 1.1.");
const reference = path.resolve(value("reference", path.join(PRIVATE, "reference/voice.wav")));
const referenceText = path.resolve(value("reference-text", path.join(PRIVATE, "reference/voice.txt")));
const relative = target => {
  const rel = path.relative(ROOT, target);
  if (rel.startsWith("..") || path.isAbsolute(rel)) throw new Error("Keep speech inputs in the private project artifacts directory.");
  return `/workspace/${rel}`;
};
if (!(await readFile(referenceText, "utf8")).trim()) throw new Error("Provide the exact reference transcript.");
await readFile(reference);
const stage = path.join(PRIVATE, "synthesis");
await mkdir(stage, { recursive: true });
const manifest = path.join(stage, "scenes.json");
await writeFile(manifest, JSON.stringify(scenes.map(scene => ({ number: scene.number, text: scene.primaryStatement })), null, 2));
const uid = process.getuid?.() ?? 1000;
const gid = process.getgid?.() ?? 1000;
const child = spawn("docker", [
  "run", "--rm", "--gpus", "all", "--user", `${uid}:${gid}`,
  "-e", "HOME=/tmp", "-e", "HF_HOME=/hf-cache", "-e", "HF_HUB_DISABLE_XET=1",
  "-e", "NUMBA_CACHE_DIR=/tmp/numba_cache", "-e", "MPLCONFIGDIR=/tmp/mpl",
  "-v", `${ROOT}:/workspace`, "-v", `${ROOT}/.cache/huggingface:/hf-cache`,
  "dot-voice-clone:local", "python3", "-u", "/workspace/frontend/scripts/synthesize-voiceover.py",
  "--manifest", relative(manifest), "--reference", relative(reference),
  "--reference-text", relative(referenceText), "--output", relative(stage), "--speed", String(speed),
], { stdio: "inherit" });
const [code] = await once(child, "close");
if (code !== 0) throw new Error(`Local voice synthesis exited ${code}. Existing delivery clips are unchanged.`);
const preview = value("preview", "false") === "true";
const masters = preview ? path.join(PRIVATE, "preview/masters") : path.join(PRIVATE, "masters");
const delivery = preview ? path.join(PRIVATE, "preview") : path.join(ROOT, "frontend/public/audio");
// Master and validate the complete selected set before replacing any deliveries.
// Auditions have separate masters, so they cannot change the accepted film mix.
const prepared = await processVoiceover({ inputDir: stage, masterDir: masters, deliveryDir: delivery, scenes });
const durations = prepared.map(({ number, durationSeconds }) => ({ number, durationSeconds }));
await writeFile(path.join(stage, "durations.json"), JSON.stringify(durations, null, 2));
console.log(`Prepared ${scenes.length} complete scenes. Natural pauses and pitch preserved.`);
