import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import type { WritingAsset, WritingClaim, WritingDraft } from "../../../services/OrchestratorWritingService";

export const IMAGE_PATH = /^(?:[a-z0-9][a-z0-9_-]*\/)*[a-z0-9][a-z0-9_-]*\.(?:png|jpg|jpeg|webp)$/;
interface MarkdownNode { type: string; url?: string; alt?: string; identifier?: string; children?: MarkdownNode[] }

export function manuscriptImages(body: string): Array<{ path: string; alt: string }> {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(body) as MarkdownNode;
  const definitions = new Map<string, string>();
  const images: MarkdownNode[] = [];
  function walk(node: MarkdownNode) {
    if (node.type === "definition" && node.identifier && node.url) definitions.set(node.identifier, node.url);
    if (node.type === "image" || node.type === "imageReference") images.push(node);
    node.children?.forEach(walk);
  }
  walk(tree);
  return images.map(node => ({ path: (node.url ?? definitions.get(node.identifier ?? "") ?? "").replace(/^\.\//, ""), alt: node.alt ?? "" }));
}

export function writingReadiness(draft: WritingDraft, claims: WritingClaim[]): string[] {
  const issues: string[] = [];
  if (!draft.title.trim()) issues.push("Add a title.");
  if (!draft.body.trim()) issues.push("Add your manuscript.");
  const material = claims.filter(claim => claim.statement || claim.level || claim.source);
  if (!material.length) issues.push("Declare the material claims in this piece.");
  for (const [index, claim] of material.entries()) {
    if (!claim.statement.trim() || !claim.level) issues.push(`Finish claim ${index + 1}: statement and level.`);
    if (claim.origin === "sourced") {
      let valid = false;
      try { const url = new URL(claim.source); valid = ["https:", "http:"].includes(url.protocol) && !!url.hostname; } catch { /* Keep the incomplete declaration private. */ }
      if (!valid) issues.push(`Add a valid source URL for claim ${index + 1}.`);
    }
  }
  const assets = new Map((draft.assets ?? []).map(asset => [asset.path, asset]));
  for (const image of manuscriptImages(draft.body)) {
    if (!assets.has(image.path)) issues.push(`Attach ${image.path || "the missing image"}, or remove its image markup.`);
    if (!image.alt.trim()) issues.push(`Describe ${image.path} inside ![...].`);
  }
  const cover = draft.presentation?.cover;
  if (cover) {
    const asset = assets.get(cover.path);
    if (!asset) issues.push(`Attach the banner: ${cover.path}.`);
    else if (asset.width < 1200 || asset.width / asset.height < 1.5 || asset.width / asset.height > 2.2) issues.push("Use a landscape banner at least 1200 px wide; 1600 × 900 works well.");
    if (!cover.alt.trim()) issues.push("Describe the banner image.");
  }
  return [...new Set(issues)];
}

export function imageMap(assets: WritingAsset[] = []) {
  return Object.fromEntries(assets.flatMap(asset => [asset.path, `./${asset.path}`].map(path => [path, { src: asset.src, width: asset.width, height: asset.height }])));
}

function imageSize(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error("The image could not be opened."));
    image.src = src;
  });
}

export async function importArtwork(files: File[], draft: WritingDraft): Promise<WritingAsset[]> {
  const current = draft.assets ?? [];
  if (current.length + files.length > 16) throw new Error("Keep at most 16 images in one post.");
  if (current.reduce((total, asset) => total + asset.bytes, 0) + files.reduce((total, file) => total + file.size, 0) > 4_000_000) throw new Error("Images must total at most 4 MB per post.");
  const wanted = [...new Set([...manuscriptImages(draft.body).map(image => image.path), ...(draft.presentation?.cover ? [draft.presentation.cover.path] : [])])];
  const imported: WritingAsset[] = [];
  try {
    for (const file of files) {
      if (file.size > 750_000 || !/\.(png|jpe?g|webp)$/i.test(file.name)) throw new Error("Choose PNG, JPEG or WebP images under 750 KB each.");
      const matches = wanted.filter(path => path.split("/").at(-1) === file.name);
      const path = matches.length === 1 ? matches[0] : file.webkitRelativePath || file.name;
      if (!IMAGE_PATH.test(path)) throw new Error(`Rename ${file.name} using lowercase letters, numbers, hyphens or underscores.`);
      if ([...current, ...imported].some(asset => asset.path === path)) throw new Error(`${path} is already attached. Remove it before adding a replacement.`);
      const data = new Uint8Array(await file.arrayBuffer());
      let binary = "";
      for (const byte of data) binary += String.fromCharCode(byte);
      const src = URL.createObjectURL(file);
      try {
        const size = await imageSize(src);
        if (size.width > 6000 || size.height > 6000) throw new Error("Image dimensions must be at most 6000 pixels.");
        imported.push({ path, src, ...size, bytes: file.size, data_base64: btoa(binary) });
      } catch (error) { URL.revokeObjectURL(src); throw error; }
    }
    return imported;
  } catch (error) {
    imported.forEach(asset => URL.revokeObjectURL(asset.src));
    throw error;
  }
}

/** Resolve artwork for portable copies without rewriting the author's prose. */
export function exportArtworkMarkdown(body: string, assets: WritingAsset[] = [], origin: string): string {
  const targets = new Map(assets.map(asset => [asset.path, new URL(asset.src, origin).href]));
  type PositionedNode = MarkdownNode & { title?: string; position?: { start: { offset: number }; end: { offset: number } }; children?: PositionedNode[] };
  const tree = unified().use(remarkParse).use(remarkGfm).parse(body) as PositionedNode;
  const edits: Array<{ start: number; end: number; value: string }> = [];
  function walk(node: PositionedNode) {
    const src = targets.get((node.url ?? "").replace(/^\.\//, ""));
    if (src && node.position && (node.type === "image" || node.type === "definition")) {
      const label = (node.type === "image" ? node.alt ?? "" : node.identifier ?? "").replace(/[[\]\\]/g, "\\$&");
      const title = node.title ? ` ${JSON.stringify(node.title)}` : "";
      edits.push({ start: node.position.start.offset, end: node.position.end.offset, value: node.type === "image" ? `![${label}](${src}${title})` : `[${label}]: ${src}${title}` });
    }
    node.children?.forEach(walk);
  }
  walk(tree);
  return edits.sort((a, b) => b.start - a.start).reduce((text, edit) => text.slice(0, edit.start) + edit.value + text.slice(edit.end), body);
}
