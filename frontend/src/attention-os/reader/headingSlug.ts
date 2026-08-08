/**
 * The anchor a book heading renders with.
 *
 * One implementation on purpose. Anything that links *into* the released text —
 * the reader's own headings, Lumen's citations, the concept map, the open seams
 * register — has to agree on this slug or the link lands nowhere, and a second
 * copy of the rules is how they quietly stop agreeing.
 */
export function headingSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
