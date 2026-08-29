/** Minimal structural view of the nodes this plugin touches. `mdast` types are
    transitive through react-markdown, not a direct dependency. */
interface TextNode {
  type: "text";
  value: string;
}

interface InlineNode {
  type: string;
  value?: string;
}

export interface ParagraphNode {
  type: "paragraph";
  children: InlineNode[];
  data?: { hProperties?: Record<string, unknown> };
}

interface RootNode {
  type: "root";
  children: { type: string }[];
}

/**
 * Marks runs of consecutive one-sentence paragraphs so they can be set as a
 * single cluster rather than as separate body paragraphs.
 *
 * Book One uses asyndeton in several places — bare imperatives stacked with no
 * conjunctions, as when the Canvas raises competing pre-Intent drafts. Set as
 * ordinary paragraphs they read as six unrelated beats. The run is the unit of
 * meaning, so the run is what gets marked.
 *
 * A single short paragraph is left alone: isolated terse lines are rhetorical
 * beats ("It does not make them equally coherent."), not a catalogue.
 */

/** Below this a paragraph is terse enough to be part of a stacked run. */
const MAX_LINE_LENGTH = 44;
/** Fewer than this is a beat, not a catalogue. */
const MIN_RUN_LENGTH = 3;

function paragraphText(node: ParagraphNode): string | null {
  let text = "";
  for (const child of node.children) {
    if (child.type !== "text") return null;
    text += (child as TextNode).value;
  }
  return text;
}

function isTerseLine(node: { type: string }): node is ParagraphNode {
  if (node.type !== "paragraph") return false;
  const text = paragraphText(node as ParagraphNode);
  if (text === null) return false;

  const trimmed = text.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_LINE_LENGTH) return false;
  if (!/[.?!]$/.test(trimmed)) return false;
  // One sentence only: interior terminal punctuation means it is prose.
  return !/[.?!]\s+\S/.test(trimmed);
}

function mark(node: ParagraphNode, position: "first" | "middle" | "last"): void {
  const data = (node.data ??= {});
  const properties = (data.hProperties ??= {});
  properties.className = "book-draft-line";
  properties["data-draft-position"] = position;
}

export function remarkStichicRuns() {
  return (tree: RootNode): void => {
    const { children } = tree;

    for (let index = 0; index < children.length; index += 1) {
      let end = index;
      while (end < children.length && isTerseLine(children[end])) end += 1;

      const length = end - index;
      if (length >= MIN_RUN_LENGTH) {
        for (let offset = index; offset < end; offset += 1) {
          mark(
            children[offset] as ParagraphNode,
            offset === index ? "first" : offset === end - 1 ? "last" : "middle",
          );
        }
      }

      if (end > index) index = end - 1;
    }
  };
}

export default remarkStichicRuns;
