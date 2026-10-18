import { parseDocument, stringify } from "yaml";
import { z } from "zod";
import { emptyPresentation, type WritingClaim, type WritingDraft } from "../../../services/OrchestratorWritingService";

const levels = ["Observation", "Model", "Hypothesis", "Speculation"] as const;
const level = z.preprocess(value => typeof value === "string" ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : value, z.enum(levels));
const claim = z.object({
  statement: z.string().max(10_000),
  level: z.union([z.literal(""), level]).default(""),
  origin: z.enum(["author_originated", "sourced", "no_external_source"]).default("author_originated"),
  source: z.string().max(2048).default(""),
}).strict();
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, "Use a real calendar date in YYYY-MM-DD form.");
const frontMatter = z.object({
  title: z.string().max(256).optional(), summary: z.string().max(280).optional(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(150).optional(),
  format: z.enum(["essay", "case-study", "letter"]).default("essay"),
  series: z.string().max(100).default(""),
  cover: z.string().max(240).optional(), cover_alt: z.string().max(300).default(""), cover_caption: z.string().max(400).default(""),
  published: date.optional(), updated: date.optional(), draft: z.boolean().optional(),
  levels: z.array(level).max(4).default([]),
  concepts: z.array(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120)).max(50).default([]),
  claims: z.array(claim).max(100).default([]),
}).strict();

export interface ImportedManuscript { draft: WritingDraft; claims: WritingClaim[]; slug: string }

export function writingSlug(text: string): string {
  return text.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 150).replace(/-$/, "");
}

export function importManuscript(source: string, filename: string): ImportedManuscript {
  if (new TextEncoder().encode(source).length > 2_000_000) throw new Error("Choose a manuscript under 2 MB.");
  const stem = filename.replace(/\.(md|markdown|txt|json)$/i, "");
  let body = source.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  let raw: unknown = {};
  if (/\.json$/i.test(filename)) {
    const old = z.object({ schema: z.literal("dot.writing-draft.v1"), title: z.string(), summary: z.string(), body: z.string(), claims: z.array(claim) }).strict().safeParse(JSON.parse(body));
    if (!old.success) throw new Error("This is not a supported draft backup.");
    raw = { title: old.data.title, summary: old.data.summary, claims: old.data.claims };
    body = old.data.body;
  } else if (/^---[ \t]*\n/.test(body)) {
    const close = /^---[ \t]*$/gm;
    close.lastIndex = body.indexOf("\n") + 1;
    const match = close.exec(body);
    if (!match) throw new Error("Close the metadata with a line containing --- before the manuscript.");
    const header = body.slice(body.indexOf("\n") + 1, match.index);
    if (header.length > 128_000) throw new Error("The metadata is too large. Keep the manuscript below the closing ---.");
    const document = parseDocument(header, { uniqueKeys: true, stringKeys: true });
    if (document.errors.length || document.warnings.length) throw new Error(`Check the Markdown metadata: ${(document.errors[0] ?? document.warnings[0]).message}`);
    try { raw = document.toJS({ maxAliasCount: 0 }); }
    catch { throw new Error("Use plain metadata values; YAML aliases are not supported."); }
    body = body.slice(match.index + match[0].length).replace(/^\n/, "");
  } else {
    const heading = /^#\s+(.+)\n(?:\n)?/.exec(body);
    if (heading) { raw = { title: heading[1].trim() }; body = body.slice(heading[0].length); }
  }
  const checked = frontMatter.safeParse(raw ?? {});
  if (!checked.success) {
    const issue = checked.error.issues[0];
    throw new Error(`Check ${issue.path.join(".") || "the metadata"}: ${issue.message}`);
  }
  const data = checked.data;
  if (!data.cover && (data.cover_alt || data.cover_caption)) throw new Error("The image description and caption need a cover path.");
  if (data.published && data.updated && data.updated < data.published) throw new Error("The updated date cannot precede the original date.");
  return {
    slug: data.slug ?? writingSlug(stem), claims: data.claims,
    draft: {
      title: data.title ?? stem.replaceAll("-", " "), summary: data.summary ?? "", body,
      presentation: {
        ...emptyPresentation(), format: data.format, series: data.series, levels: data.levels,
        concepts: data.concepts, published: data.published, updated: data.updated,
        cover: data.cover ? { path: data.cover, alt: data.cover_alt, caption: data.cover_caption } : null,
      }, assets: [],
    },
  };
}

export function exportManuscript(draft: WritingDraft, claims: WritingClaim[], slug?: string): string {
  const presentation = draft.presentation ?? emptyPresentation();
  const metadata = {
    title: draft.title, summary: draft.summary, ...(slug ? { slug } : {}), draft: true,
    format: presentation.format, ...(presentation.series ? { series: presentation.series } : {}),
    ...(presentation.published ? { published: presentation.published } : {}),
    ...(presentation.updated ? { updated: presentation.updated } : {}),
    levels: presentation.levels.map(item => item.toLowerCase()), concepts: presentation.concepts,
    ...(presentation.cover ? { cover: presentation.cover.path, cover_alt: presentation.cover.alt, cover_caption: presentation.cover.caption } : {}),
    claims,
  };
  return `---\n${stringify(metadata, { lineWidth: 0 })}---\n${draft.body}`;
}

export function downloadText(text: string, filename: string, type = "text/markdown;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
