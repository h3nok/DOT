import { createHash } from "node:crypto";
import { readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { imageSize } from "image-size";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";

const parser = unified().use(remarkParse).use(remarkGfm);
const MAX_IMAGE_BYTES = 750 * 1024;
const MAX_POST_BYTES = 4 * 1024 * 1024;

/** Resolve only this post's explicitly referenced local images; never copy a directory. */
export function prepareEssayMedia(essay, dir, { preview = false } = {}) {
  const assets = new Map();
  const images = {};
  const fail = (message) => { throw new Error(`${essay.slug}.md: ${message}`); };
  const root = realpathSync(dir);
  function asset(source) {
    const relative = source.replace(/^\.\//, "");
    if (!new RegExp(`^${essay.slug}/[a-z0-9][a-z0-9.-]*\\.(png|jpe?g|webp)$`).test(relative)) {
      fail(`image "${source}" must be a local PNG, JPEG, or WebP in ${essay.slug}/. External images and path traversal are not supported.`);
    }
    if (assets.has(relative)) return assets.get(relative);
    let bytes;
    try {
      const file = realpathSync(path.join(dir, relative));
      if (!file.startsWith(`${root}${path.sep}`)) fail(`image "${source}" resolves outside the essays folder.`);
      bytes = readFileSync(file);
    } catch (error) {
      fail(`cannot read image "${source}": ${error.message}`);
    }
    if (bytes.length > MAX_IMAGE_BYTES) fail(`image "${source}" exceeds 750 KB. Resize or compress it before publishing.`);
    let dimensions;
    try { dimensions = imageSize(bytes); } catch { fail(`image "${source}" is not a readable image.`); }
    const extension = path.extname(relative).slice(1).replace("jpeg", "jpg");
    if (dimensions.type !== extension || !["png", "jpg", "webp"].includes(dimensions.type)) {
      fail(`image "${source}" does not match its file extension.`);
    }
    if (!dimensions.width || !dimensions.height || dimensions.width > 6000 || dimensions.height > 6000) {
      fail(`image "${source}" needs dimensions between 1 and 6000 pixels.`);
    }
    const digest = createHash("sha256").update(bytes).digest("hex").slice(0, 12);
    const url = `${preview ? "/__essay-preview/media" : "/essay-media"}/${essay.slug}/${digest}-${path.basename(relative)}`;
    const result = { url, bytes, type: dimensions.type === "jpg" ? "jpeg" : dimensions.type, width: dimensions.width, height: dimensions.height };
    assets.set(relative, result);
    images[url] = { width: result.width, height: result.height };
    return result;
  }

  let cover;
  if (essay.cover) {
    const image = asset(essay.cover.src);
    if (image.width < 1200 || image.width / image.height < 1.5 || image.width / image.height > 2.2) {
      fail("cover must be at least 1200 px wide, with a landscape ratio between 1.5:1 and 2.2:1. Recommended: 1600 × 900.");
    }
    cover = { ...essay.cover, src: image.url, width: image.width, height: image.height };
  }

  const tree = parser.parse(essay.body);
  const nodes = [];
  function visit(node) { nodes.push(node); node.children?.forEach(visit); }
  visit(tree);
  const definitions = new Map();
  for (const node of nodes) {
    if (node.type === "definition" && !definitions.has(node.identifier)) definitions.set(node.identifier, node);
  }
  const edits = [];
  for (const node of nodes) {
    if (node.type !== "image" && node.type !== "imageReference") continue;
    const reference = node.type === "image" ? node : definitions.get(node.identifier);
    if (!reference) fail(`image reference "${node.identifier}" has no definition.`);
    if (!node.alt?.trim()) fail(`image "${reference.url}" needs descriptive alt text.`);
    const image = asset(reference.url);
    const alt = node.alt.replace(/[\\[\]]/g, "\\$&");
    const title = reference.title ? ` "${reference.title.replace(/[\\"]/g, "\\$&")}"` : "";
    edits.push({ start: node.position.start.offset, end: node.position.end.offset, text: `![${alt}](${image.url}${title})` });
  }
  let body = essay.body;
  for (const edit of edits.sort((a, b) => b.start - a.start)) body = body.slice(0, edit.start) + edit.text + body.slice(edit.end);
  if ([...assets.values()].reduce((sum, image) => sum + image.bytes.length, 0) > MAX_POST_BYTES) fail("images total more than 4 MB. Reduce their size or number.");
  return { ...essay, cover, images, body, _assets: [...assets.values()] };
}
