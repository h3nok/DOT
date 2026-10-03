/**
 * A link that names a passage inside a folded depth disclosure is a request to
 * read it: open the disclosure before scrolling, since not every browser opens
 * a closed `<details>` for a fragment.
 */
export function openEnclosingDepth(target: Element): void {
  let details = target.closest("details.book-depth");
  while (details instanceof HTMLDetailsElement) {
    details.open = true;
    details = details.parentElement?.closest("details.book-depth") ?? null;
  }
}
