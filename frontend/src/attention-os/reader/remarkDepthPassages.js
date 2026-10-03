/**
 * Depth passages — one manuscript, two renderings (ADR-0036).
 *
 * The printed Complete Edition sets technical passages inline. The free
 * digital edition is for everyone, so the reader folds each of them into a
 * closed, native disclosure that opens only when the reader asks. Nothing is
 * removed: the text stays in the page, keyboard- and screen-reader-reachable,
 * and works without JavaScript.
 *
 * The release importer writes each passage between marker paragraphs:
 *
 *   ::: depth Formal definition of Rendering Latency
 *   …block content…
 *   :::
 *
 * Plain JavaScript so the app and the static route materializer share one
 * implementation.
 */

const OPEN = /^:::[ \t]+depth(?:[ \t]+(.+?))?[ \t]*$/;
const CLOSE = /^:::[ \t]*$/;
const WORDS_PER_MINUTE = 220;
export const DEPTH_FALLBACK_LABEL = "Technical detail";

function markerText(node) {
  if (node.type !== "paragraph" || node.children?.length !== 1) return null;
  const [child] = node.children;
  return child.type === "text" ? child.value.trim() : null;
}

function countWords(node) {
  if (node.type === "text") return (node.value.match(/[\p{L}\p{N}’'-]+/gu) ?? []).length;
  if (node.type === "math" || node.type === "inlineMath") return 0;
  return (node.children ?? []).reduce((total, child) => total + countWords(child), 0);
}

function passage(label, children) {
  const words = children.reduce((total, child) => total + countWords(child), 0);
  const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  return {
    type: "depthPassage",
    data: {
      hName: "details",
      hProperties: {
        className: ["book-depth"],
        dataDepthLabel: label,
        dataDepthMinutes: minutes,
      },
    },
    children: [
      {
        type: "paragraph",
        data: {
          hName: "summary",
          hProperties: { className: ["book-depth__summary"], dataDepthMinutes: minutes },
        },
        children: [{ type: "text", value: label }],
      },
      ...children,
    ],
  };
}

/** Fold `::: depth` marker runs at the top level of a section into disclosures. */
export function foldDepthPassages(children) {
  const folded = [];
  let open = null;
  for (const node of children) {
    const text = markerText(node);
    const start = text === null ? null : OPEN.exec(text);
    if (start) {
      if (open) folded.push(passage(open.label, open.children));
      open = { label: start[1]?.trim() || DEPTH_FALLBACK_LABEL, children: [] };
      continue;
    }
    if (text !== null && CLOSE.test(text)) {
      // A stray closing marker is dropped rather than shown as text.
      if (open) folded.push(passage(open.label, open.children));
      open = null;
      continue;
    }
    (open ? open.children : folded).push(node);
  }
  if (open) folded.push(passage(open.label, open.children));
  return folded;
}

export function remarkDepthPassages() {
  return (tree) => {
    tree.children = foldDepthPassages(tree.children);
  };
}

export default remarkDepthPassages;
