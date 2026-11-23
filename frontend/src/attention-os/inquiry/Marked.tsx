/**
 * A published sentence with its key phrase marked, so a reader scanning the page
 * finds the idea first. The words are never changed: a phrase that is not in the
 * sentence marks nothing.
 */
export function Marked({ text, mark }: { text: string; mark?: string }) {
  const at = mark ? text.indexOf(mark) : -1;
  if (!mark || at < 0) return <>{text}</>;
  return <>{text.slice(0, at)}<mark className="inq-mark">{mark}</mark>{text.slice(at + mark.length)}</>;
}
