import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TRAILER_VOICE_OFFSET_SECONDS } from "./channel-inquiry-video.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const CONTRACTIONS = {
  "can't": ["can", "not"], cannot: ["can", "not"], "won't": ["will", "not"],
  "i'm": ["i", "am"], "it's": ["it", "is"], "that's": ["that", "is"],
  "there's": ["there", "is"], "we're": ["we", "are"], "you're": ["you", "are"],
  "they're": ["they", "are"], "we've": ["we", "have"], "you've": ["you", "have"],
  "they've": ["they", "have"], "i've": ["i", "have"], "let's": ["let", "us"],
};

function atoms(text) {
  const words = String(text).normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase()
    .replace(/[’‘]/g, "'").match(/[a-z0-9]+(?:'[a-z]+)?/g) || [];
  return words.flatMap((word) => {
    if (CONTRACTIONS[word]) return CONTRACTIONS[word];
    if (word.endsWith("n't")) return [word.slice(0, -3), "not"];
    if (/^rf0$/.test(word)) return ["r", "f", "zero"];
    if (word === "rf") return ["r", "f"];
    if (word === "0") return ["zero"];
    return [word.replace(/'/g, "")];
  });
}

function alignedWords(text, record) {
  const originalWords = text.match(/\S+/g) || [];
  const expected = originalWords.flatMap((word, owner) => atoms(word).map((value) => ({ value, owner })));
  let previousStart = -Infinity;
  const actual = (record.segments || []).flatMap((segment) => segment.words || []).flatMap((word) => {
    assert.ok(Number.isFinite(word.start) && Number.isFinite(word.end) && word.start >= 0 && word.end >= word.start,
      `Invalid ASR word timing in scene-${record.number}`);
    assert.ok(word.start >= previousStart - 0.02, `ASR word order changed in scene-${record.number}`);
    previousStart = word.start;
    const normalized = atoms(word.word);
    return normalized.map((value, index) => ({
      value,
      start: word.start + (word.end - word.start) * index / normalized.length,
      end: word.start + (word.end - word.start) * (index + 1) / normalized.length,
    }));
  });
  assert.ok(expected.length && actual.length, `Missing spoken word timestamps in scene-${record.number}`);

  // Edit alignment uses ASR only for timing. Every displayed word and its
  // punctuation still comes from the approved primaryStatement.
  const costs = Array.from({ length: expected.length + 1 }, () => new Uint16Array(actual.length + 1));
  for (let i = 0; i <= expected.length; i++) costs[i][0] = i;
  for (let j = 0; j <= actual.length; j++) costs[0][j] = j;
  for (let i = 1; i <= expected.length; i++) {
    for (let j = 1; j <= actual.length; j++) {
      costs[i][j] = Math.min(
        costs[i - 1][j - 1] + Number(expected[i - 1].value !== actual[j - 1].value),
        costs[i - 1][j] + 1,
        costs[i][j - 1] + 1,
      );
    }
  }
  const ratio = costs[expected.length][actual.length] / Math.max(expected.length, actual.length);
  assert.ok(ratio <= 0.15, `ASR differs too much from scene-${record.number} (${(ratio * 100).toFixed(1)}% edits)`);
  const matched = Array.from({ length: originalWords.length }, () => []);
  let i = expected.length;
  let j = actual.length;
  while (i || j) {
    const substitution = i && j ? Number(expected[i - 1].value !== actual[j - 1].value) : Infinity;
    if (i && j && costs[i][j] === costs[i - 1][j - 1] + substitution) {
      matched[expected[i - 1].owner].push(actual[j - 1]);
      i--;
      j--;
    } else if (i && costs[i][j] === costs[i - 1][j] + 1) i--;
    else j--;
  }
  const result = originalWords.map((text, index) => ({
    text,
    start: matched[index].length ? Math.min(...matched[index].map((word) => word.start)) : null,
    end: matched[index].length ? Math.max(...matched[index].map((word) => word.end)) : null,
  }));
  // A small missed token borrows the interval between its neighbouring spoken
  // anchors. A missing passage is rejected instead of inventing a time track.
  for (let index = 0; index < result.length;) {
    if (result[index].start !== null) { index++; continue; }
    const first = index;
    while (index < result.length && result[index].start === null) index++;
    assert.ok(index - first <= 4, `Unrecognized passage in scene-${record.number}`);
    const from = first ? result[first - 1].end : 0;
    const to = index < result.length ? Math.max(from, result[index].start) : actual.at(-1).end;
    for (let missing = first; missing < index; missing++) {
      result[missing].start = from + (to - from) * (missing - first) / (index - first);
      result[missing].end = from + (to - from) * (missing - first + 1) / (index - first);
    }
  }
  return { words: result, editRatio: ratio };
}

function wrapWords(words, maxLineLength) {
  const whole = words.map((word) => word.text).join(" ");
  if (whole.length <= maxLineLength) return whole;
  let best = null;
  for (let index = 1; index < words.length; index++) {
    const first = words.slice(0, index).map((word) => word.text).join(" ");
    const second = words.slice(index).map((word) => word.text).join(" ");
    if (first.length > maxLineLength || second.length > maxLineLength) continue;
    const score = Math.abs(first.length - second.length) - (/[,:;—]$/.test(first) ? 8 : 0);
    if (!best || score < best.score) best = { score, text: `${first}\n${second}` };
  }
  return best?.text || null;
}

function sceneCues(scene, record, { offsetSeconds, maxLineLength }) {
  assert.equal(record.expected, scene.primaryStatement, `Stale expected narration for ${scene.id}`);
  const { words, editRatio } = alignedWords(scene.primaryStatement, record);
  const groups = [];
  let current = [];
  const flush = () => { if (current.length) { groups.push(current); current = []; } };
  for (const word of words) {
    assert.ok(word.text.length <= maxLineLength, `A caption word exceeds ${maxLineLength} characters: ${word.text}`);
    const gap = current.length ? word.start - current.at(-1).end : 0;
    const candidate = [...current, word];
    if (current.length && (!wrapWords(candidate, maxLineLength) || word.end - current[0].start > 6 || gap > 0.65)) flush();
    current.push(word);
    const span = current.at(-1).end - current[0].start;
    const sentenceEnd = /[.!?]["”’']?$/.test(word.text);
    const clauseEnd = /[,;:—]$/.test(word.text);
    if ((sentenceEnd && span >= 1.2) || (clauseEnd && span >= 2.8)) flush();
  }
  flush();
  // A hard line limit can leave a final word stranded in its own brief cue.
  // Rebalance that neighbouring pair at a clause when possible.
  for (let index = 1; index < groups.length; index++) {
    const previous = groups[index - 1];
    const next = groups[index];
    if (next.length >= 3 && next.at(-1).end - next[0].start >= 0.85) continue;
    if (next[0].start - previous.at(-1).end > 0.65) continue;
    const combined = [...previous, ...next];
    if (wrapWords(combined, maxLineLength) && combined.at(-1).end - combined[0].start <= 6) {
      groups.splice(index - 1, 2, combined);
      index--;
      continue;
    }
    let best = null;
    for (let cut = 3; cut <= combined.length - 3; cut++) {
      const first = combined.slice(0, cut);
      const second = combined.slice(cut);
      const leftText = wrapWords(first, maxLineLength);
      const rightText = wrapWords(second, maxLineLength);
      if (!leftText || !rightText || first.at(-1).end - first[0].start > 6 || second.at(-1).end - second[0].start > 6) continue;
      const score = Math.abs(leftText.length - rightText.length) - (/[.!?,;:—]["”’']?$/.test(first.at(-1).text) ? 12 : 0);
      if (!best || score < best.score) best = { first, second, score };
    }
    if (best) groups.splice(index - 1, 2, best.first, best.second);
  }
  const offset = scene.start + offsetSeconds;
  return groups.map((group, index) => {
    const next = groups[index + 1]?.[0];
    const startSeconds = offset + group[0].start;
    const lastEnd = group.at(-1).end;
    const endSeconds = offset + Math.min(lastEnd + 0.14, next ? Math.max(lastEnd, next.start - 0.04) : Infinity);
    assert.ok(endSeconds > startSeconds, `Caption has no readable interval in ${scene.id}`);
    assert.ok(endSeconds <= scene.end + 0.001, `Caption spills beyond ${scene.id}`);
    return { sceneId: scene.id, startSeconds, endSeconds, text: wrapWords(group, maxLineLength), editRatio };
  });
}

export function buildNarrationCues(scenes, records, {
  durationSeconds, offsetSeconds = TRAILER_VOICE_OFFSET_SECONDS, silentTailSeconds = 7.2, maxLineLength = 42,
} = {}) {
  assert.ok(Number.isFinite(durationSeconds) && durationSeconds > silentTailSeconds, "A valid film duration is required");
  assert.equal(records.length, scenes.length, "ASR scene count does not match the film");
  const byNumber = new Map();
  for (const record of records) {
    assert.ok(Number.isInteger(record.number) && !byNumber.has(record.number), "Duplicate or invalid ASR scene number");
    byNumber.set(record.number, record);
  }
  const cues = scenes.flatMap((scene) => {
    assert.equal(scene.id, `scene-${scene.number}`, `Mismatched scene identifier: ${scene.id}`);
    const record = byNumber.get(scene.number);
    assert.ok(record, `Missing ASR timestamps for ${scene.id}`);
    if (record.id) assert.equal(record.id, scene.id, `Mismatched ASR identifier for ${scene.id}`);
    return sceneCues(scene, record, { offsetSeconds, maxLineLength });
  });
  for (let index = 0; index < cues.length; index++) {
    assert.ok(!index || cues[index].startSeconds >= cues[index - 1].endSeconds - 0.001, `Overlapping captions at cue ${index + 1}`);
    assert.ok(cues[index].endSeconds <= durationSeconds - silentTailSeconds, "Caption spills into the silent closing card");
  }
  return cues;
}

export async function validateNarrationSources(records, { rootDir = ROOT } = {}) {
  for (const record of records) {
    assert.equal(path.basename(record.source || ""), `scene-${record.number}.mp3`, `Mismatched audio source for scene-${record.number}`);
    assert.match(record.sha256 || "", /^[a-f0-9]{64}$/i, `Missing audio hash for scene-${record.number}`);
    const bytes = await readFile(path.resolve(rootDir, record.source));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), record.sha256.toLowerCase(),
      `Stale ASR audio hash for scene-${record.number}; transcribe the current delivery audio again`);
  }
}

function timestamp(seconds, separator = ",") {
  const milliseconds = Math.round(seconds * 1000);
  return `${String(Math.floor(milliseconds / 3600000)).padStart(2, "0")}:${String(Math.floor(milliseconds / 60000) % 60).padStart(2, "0")}:${String(Math.floor(milliseconds / 1000) % 60).padStart(2, "0")}${separator}${String(milliseconds % 1000).padStart(3, "0")}`;
}

export function narrationSrt(cues) {
  return cues.map((cue, index) => `${index + 1}\n${timestamp(cue.startSeconds)} --> ${timestamp(cue.endSeconds)}\n${cue.text}\n`).join("\n");
}

export function narrationVtt(cues) {
  return `WEBVTT\n\n${cues.map((cue) => `${timestamp(cue.startSeconds, ".")} --> ${timestamp(cue.endSeconds, ".")}\n${cue.text}\n`).join("\n")}`;
}

/** Only publish the timing and approved words used by the native player. */
export function narrationCaptionData(cues) {
  return cues.map(({ startSeconds, endSeconds, text }) => ({
    startSeconds: Math.round(startSeconds * 1000) / 1000,
    endSeconds: Math.round(endSeconds * 1000) / 1000,
    text,
  }));
}

async function main() {
  const { INQUIRY_VIDEOS } = await import("./channel-inquiry-video.mjs");
  const video = INQUIRY_VIDEOS.find(({ name }) => name === "inquiry-trailer");
  const transcriptArg = process.argv.find((arg) => arg.startsWith("--transcripts="))?.slice(14);
  const outputArg = process.argv.find((arg) => arg.startsWith("--output="))?.slice(9);
  const contentArg = process.argv.find((arg) => arg.startsWith("--content-output="))?.slice(17);
  const inputPath = path.resolve(ROOT, transcriptArg || "artifacts/voiceover/analysis/relatable-transcripts.json");
  const outputPath = path.resolve(ROOT, outputArg || "design/youtube/assets/inquiry-trailer.srt");
  const contentPath = path.resolve(ROOT, contentArg || "frontend/src/content/inquiry-trailer-captions.json");
  const records = JSON.parse(await readFile(inputPath, "utf8"));
  await validateNarrationSources(records);
  const cues = buildNarrationCues(video.scenes, records, { durationSeconds: video.duration });
  await mkdir(path.dirname(outputPath), { recursive: true });
  const pendingPath = `${outputPath}.tmp-${process.pid}`;
  await writeFile(pendingPath, narrationSrt(cues));
  await rename(pendingPath, outputPath);
  const vttPath = outputPath.replace(/\.srt$/i, "") + ".vtt";
  await writeFile(vttPath, narrationVtt(cues));
  await mkdir(path.dirname(contentPath), { recursive: true });
  const pendingContent = `${contentPath}.tmp-${process.pid}`;
  await writeFile(pendingContent, JSON.stringify(narrationCaptionData(cues), null, 2) + "\n");
  await rename(pendingContent, contentPath);
  console.log(`Wrote ${cues.length} spoken-word cues from ${records.length} verified audio sources: ${outputPath}`);
  console.log(`Native player captions: ${contentPath}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
