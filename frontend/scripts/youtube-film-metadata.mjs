// Generates YouTube captions (SRT) and chapter lists for the dark trailer and the full film,
// from the same timings the film renders with. Writes into design/youtube/assets/.
import { writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = "/home/henok/Repo/DOT";
const OUT = path.join(ROOT, "design/youtube/assets");
const rev = await import(path.join(ROOT, "frontend/src/blocks/films/darkFilmRevision.ts"));
const tour = await import(path.join(ROOT, "frontend/src/blocks/films/conceptTour.ts"));

const stamp = (s) => {
  const ms = Math.round(s * 1000);
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), sec = Math.floor((ms % 60000) / 1000), r = ms % 1000;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")},${String(r).padStart(3, "0")}`;
};
const clock = (s) => { const w = Math.floor(s); return `${Math.floor(w / 60)}:${String(w % 60).padStart(2, "0")}`; };

function trailerCues() {
  return rev.DARK_TRAILER_LINES.map((line) => {
    const label = line.voice === "dot" ? "[DOT proposes] " : line.voice === "prevailing" ? "[The prevailing view] " : "";
    const cite = line.cite ? ` — ${line.cite}` : "";
    return { start: line.start, end: line.until, text: `${label}${line.text}${cite}` };
  });
}

function srt(cues) {
  return cues.map((cue, i) => `${i + 1}\n${stamp(cue.start)} --> ${stamp(cue.end)}\n${cue.text}\n`).join("\n");
}

// Trailer.
const trailer = trailerCues();
writeFileSync(path.join(OUT, "dot-opening-trailer-dark-v8.en.srt"), srt(trailer));
const trailerChapters = rev.DARK_TRAILER_SHOTS.map((shot) => `${clock(shot.start)} ${shot.label}`);

// Full film: trailer cues, then each concept's name and Concept Map definition.
const full = [...trailer];
const filmChapters = ["0:00 Opening"];
for (const part of tour.CONCEPT_TOUR) {
  if (part.kind === "scene") continue;
  const at = part.start - (tour.TOUR_OPENING_SECONDS - rev.DARK_OPENING_SECONDS);
  const end = part.end - (tour.TOUR_OPENING_SECONDS - rev.DARK_OPENING_SECONDS);
  if (part.kind === "concept") {
    filmChapters.push(`${clock(at)} ${part.film.node.title}`);
    full.push({ start: at + 0.4, end: end - 0.6, text: `${tour.tourPlace(part.position)} · ${part.film.node.title}\n${part.film.node.oneLine}` });
  } else if (part.kind === "interlude") {
    filmChapters.push(`${clock(at)} ${part.interlude.name}`);
    full.push({ start: at + 0.4, end: end - 0.6, text: `${part.interlude.title}\n${part.interlude.note}` });
  } else {
    filmChapters.push(`${clock(at)} Closing`);
  }
}
writeFileSync(path.join(OUT, "concept-film-full-16x9-revised-dark-v8.en.srt"), srt(full));

const chapters = { trailer: { duration: clock(rev.DARK_OPENING_SECONDS), chapters: trailerChapters }, full: { duration: clock(rev.DARK_FILM_SECONDS), chapters: filmChapters } };
writeFileSync(path.join(OUT, "dot-films-v8-chapters.json"), `${JSON.stringify(chapters, null, 2)}\n`);
console.log(JSON.stringify(chapters, null, 2));

