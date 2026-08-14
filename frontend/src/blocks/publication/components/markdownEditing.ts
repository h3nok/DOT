export interface MarkdownEdit {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

function withBlockSpacing(
  source: string,
  start: number,
  end: number,
  block: string,
): MarkdownEdit {
  const prefix = source.slice(0, start);
  const suffix = source.slice(end);
  const before = prefix.length > 0 && !prefix.endsWith("\n\n") ? (prefix.endsWith("\n") ? "\n" : "\n\n") : "";
  const after = suffix.length > 0 && !suffix.startsWith("\n\n") ? (suffix.startsWith("\n") ? "\n" : "\n\n") : "";
  const insertion = `${before}${block}${after}`;
  const contentOffset = insertion.indexOf(block) + block.length;

  return {
    value: `${prefix}${insertion}${suffix}`,
    selectionStart: start + contentOffset,
    selectionEnd: start + contentOffset,
  };
}

export function insertMarkdownBlock(
  source: string,
  start: number,
  end: number,
  block: string,
): MarkdownEdit {
  return withBlockSpacing(source, start, end, block);
}

export function wrapMarkdownSelection(
  source: string,
  start: number,
  end: number,
  before: string,
  after: string,
  fallback: string,
): MarkdownEdit {
  const selected = source.slice(start, end) || fallback;
  const value = `${source.slice(0, start)}${before}${selected}${after}${source.slice(end)}`;
  const selectionStart = start + before.length;
  return {
    value,
    selectionStart,
    selectionEnd: selectionStart + selected.length,
  };
}

export function prefixMarkdownLines(
  source: string,
  start: number,
  end: number,
  prefix: string,
  fallback: string,
): MarkdownEdit {
  const selected = source.slice(start, end) || fallback;
  const transformed = selected
    .split("\n")
    .map((line) => `${prefix}${line}`)
    .join("\n");
  const edit = withBlockSpacing(source, start, end, transformed);
  const insertionStart = edit.value.indexOf(transformed, start);
  return {
    ...edit,
    selectionStart: insertionStart + prefix.length,
    selectionEnd: insertionStart + transformed.length,
  };
}
