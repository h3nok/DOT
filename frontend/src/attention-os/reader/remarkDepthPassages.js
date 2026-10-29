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

/**
 * Formal notes (ADR-0036, amended 2026-10-28). The book is not a formal treatise, and the
 * author has not yet approved every equation. The digital edition keeps in the reading line
 * only the few equations that show a key relationship; every other equation folds, with the
 * lead-in that introduces it and the paragraphs that explain its symbols, into a closed
 * formal note. Prose that merely mentions a symbol stays where it is. The Complete Edition
 * still prints everything inline.
 */
export const ESSENTIAL_EQUATIONS = Object.freeze(["2.5", "5.7", "5.8", "6.1"]);
export const FORMAL_NOTE_LABEL = "Formal note";

const TAG = /\\tag\{([^}]+)\}/;
const NOTATION_LEAD = /^(?:The notation\b|Let\b|In Equations?\b|Equations?\s*\()/;

function hasInlineMath(node) {
  if (node.type === "inlineMath") return true;
  return (node.children ?? []).some(hasInlineMath);
}

const isFormalParagraph = (node) => node.type === "paragraph" && hasInlineMath(node);

function equationTag(node) {
  return TAG.exec(node.value ?? "")?.[1]?.trim() ?? null;
}

/** A paragraph that exists to introduce or name notation: it opens with a symbol or a cue. */
function opensWithNotation(node) {
  const first = node.children?.[0];
  if (!first) return false;
  if (first.type === "inlineMath") return true;
  return first.type === "text" && NOTATION_LEAD.test(first.value.trimStart());
}

function plainText(node) {
  if (node.type === "text") return node.value;
  return (node.children ?? []).map(plainText).join("");
}

/** A paragraph that explains an equation's symbols: it names notation or cites an equation. */
const explainsEquation = (node) =>
  isFormalParagraph(node) && (opensWithNotation(node) || /\bEquations?\s*\(/.test(plainText(node)));

/** A paragraph that ends by introducing what follows, such as "The modest relation is:". */
function endsWithColon(node) {
  if (node?.type !== "paragraph") return false;
  const last = node.children?.at(-1);
  return last?.type === "text" && /:\s*$/.test(last.value);
}

function formalLabel(tags) {
  if (tags.length === 0) return FORMAL_NOTE_LABEL;
  return `${FORMAL_NOTE_LABEL} · ${tags.length === 1 ? "Equation" : "Equations"} ${tags.join(", ")}`;
}

/** Fold every non-essential equation, and the formal text around it, into a closed note. */
export function foldFormalNotes(children, essential = ESSENTIAL_EQUATIONS) {
  const keep = new Set(essential);
  const out = [];
  let note = null;
  const close = () => {
    if (note) out.push(passage(formalLabel(note.tags), note.children));
    note = null;
  };
  for (let i = 0; i < children.length; i++) {
    const node = children[i];
    if (node.type === "math") {
      const tag = equationTag(node);
      if (tag && keep.has(tag)) {
        // A key relationship stays in the reading line, with the words that explain it.
        close();
        out.push(node);
        while (i + 1 < children.length && explainsEquation(children[i + 1])) out.push(children[++i]);
        continue;
      }
      if (!note) {
        note = { tags: [], children: [] };
        if (endsWithColon(out.at(-1))) note.children.push(out.pop());
      }
      if (tag) note.tags.push(tag);
      note.children.push(node);
      while (i + 1 < children.length && explainsEquation(children[i + 1])) note.children.push(children[++i]);
      continue;
    }
    if (isFormalParagraph(node) && opensWithNotation(node)) {
      note ??= { tags: [], children: [] };
      note.children.push(node);
      continue;
    }
    close();
    out.push(node);
  }
  close();
  return out;
}

export function remarkDepthPassages() {
  return (tree) => {
    tree.children = foldFormalNotes(foldDepthPassages(tree.children));
  };
}

export default remarkDepthPassages;
