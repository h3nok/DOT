import { fetchEssayIndex, fetchEssayText } from "../../../content/essays/essays";
import { emptyPresentation, type WritingDraft } from "../../../services/OrchestratorWritingService";
import { managedEssay } from "./publicationBridge";

/** Bring the existing public manuscript and its exact local artwork into Studio. */
export async function importPublishedEssay(slug: string): Promise<WritingDraft> {
  if (!managedEssay(slug)) throw new Error("This manuscript is not in the AMM source library.");
  const [index, text] = await Promise.all([fetchEssayIndex(), fetchEssayText(slug)]);
  const essay = index.find(item => item.slug === slug);
  if (!essay || text === null) throw new Error("The original manuscript could not be loaded.");
  let body = text;
  const assets: NonNullable<WritingDraft["assets"]> = [];
  const paths = new Map<string, string>();
  for (const [src, size] of Object.entries(essay.images ?? {})) {
    if (!src.startsWith(`/essay-media/${slug}/`)) throw new Error("The source artwork is outside this publication.");
    const response = await fetch(src);
    if (!response.ok) throw new Error("The original artwork could not be loaded. Try opening the manuscript again.");
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.length > 750_000) throw new Error("The source artwork exceeds the Studio image budget.");
    const path = `${slug}/${src.split("/").at(-1)}`;
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    assets.push({ path, src, ...size, bytes: bytes.length, data_base64: btoa(binary) });
    paths.set(src, path);
    body = body.replaceAll(src, path);
  }
  const banner = essay.cover && paths.get(essay.cover.src);
  if (essay.cover && !banner) throw new Error("The banner is missing from the source artwork.");
  return { title: essay.title, summary: essay.summary, body, assets, presentation: {
    ...emptyPresentation(), format: essay.format ?? "essay", series: essay.series ?? "",
    published: essay.published, updated: essay.updated, concepts: essay.concepts,
    levels: essay.levels.map(level => (level.charAt(0).toUpperCase() + level.slice(1)) as "Observation" | "Model" | "Hypothesis" | "Speculation"),
    cover: essay.cover && banner ? { path: banner, alt: essay.cover.alt, caption: essay.cover.caption ?? "" } : null,
  } };
}

export const CHAPTER_ONE_PROPOSAL = "The inversion examined here has a particular history in Western empire and the institutions of white supremacy. It turns conquest into progress, domination into order, and extraction into success. Those ideas have travelled beyond the societies that produced them; subscribing to them is no longer confined to one population. The argument of this manifesto is that concentrated private power now operates as a new empire, often reaching beyond the state’s practical control. The task is to trace that power, challenge the culture that legitimizes it, and build institutions the public can actually govern.";

export function proposeChapterOneRevision(body: string): string {
  const opening = /^The Leech is not a race\.[^\n]+/m;
  const later = /^I do not locate the Leech in any race[^\n]+/m;
  if (!opening.test(body) || !later.test(body)) throw new Error("These passages have already changed. Edit the current manuscript directly; the proposal will not overwrite your revision.");
  return body.replace(opening, CHAPTER_ONE_PROPOSAL).replace(later, "A history of racial hierarchy must be examined through the laws, property arrangements, institutions, and decisions that produced it. Accountability follows their present operation: who controls them, who benefits, whose costs are displaced, and who can change the terms. The critique concerns an inherited structure of power and the choices that sustain it.")
    .replace(/> \*\*Earlier published edition\.\*\* Originally published on LinkedIn on 2026-04-18\. Chapter One is under revision; this edition does not fully reflect the author’s current framing\. /, "> **Publication history.** First published on LinkedIn on 2026-04-18. ");
}
