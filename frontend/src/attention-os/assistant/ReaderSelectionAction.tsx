import { Sparkles } from "lucide-react";
import { useEffect, useState, type RefObject } from "react";
import type { ReaderAgentScope } from "./marginAgent";

interface SelectionAction {
  x: number;
  y: number;
  selection: string;
  headingSlug?: string;
  headingTitle?: string;
}

function headingBefore(root: HTMLElement, start: Node) {
  const startElement =
    start instanceof HTMLElement ? start : start.parentElement;
  if (!startElement) return null;

  let preceding: HTMLElement | null = null;
  for (const heading of root.querySelectorAll<HTMLElement>("h1[id],h2[id],h3[id],h4[id]")) {
    if (heading === startElement || heading.contains(startElement)) return heading;
    const relation = heading.compareDocumentPosition(startElement);
    if (relation & Node.DOCUMENT_POSITION_FOLLOWING) preceding = heading;
    if (relation & Node.DOCUMENT_POSITION_PRECEDING) break;
  }
  return preceding;
}

export function ReaderSelectionAction({
  rootRef,
  scope,
  onAsk,
}: {
  rootRef: RefObject<HTMLElement | null>;
  scope: ReaderAgentScope;
  onAsk: (scope: ReaderAgentScope) => void;
}) {
  const [action, setAction] = useState<SelectionAction | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const readSelection = () => {
      window.setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
          setAction(null);
          return;
        }
        const range = selection.getRangeAt(0);
        if (!root.contains(range.commonAncestorContainer)) {
          setAction(null);
          return;
        }
        const text = selection.toString().replace(/\s+/g, " ").trim().slice(0, 1_200);
        if (text.length < 3) {
          setAction(null);
          return;
        }
        const rect = range.getBoundingClientRect();
        const heading = headingBefore(root, range.startContainer);
        setAction({
          x: Math.min(
            window.innerWidth - 82,
            Math.max(82, rect.left + rect.width / 2),
          ),
          y: Math.min(window.innerHeight - 56, rect.bottom + 10),
          selection: text,
          headingSlug: heading?.id,
          headingTitle: heading?.textContent?.trim(),
        });
      }, 0);
    };

    const clear = () => setAction(null);
    root.addEventListener("pointerup", readSelection);
    root.addEventListener("keyup", readSelection);
    window.addEventListener("scroll", clear, { passive: true });
    return () => {
      root.removeEventListener("pointerup", readSelection);
      root.removeEventListener("keyup", readSelection);
      window.removeEventListener("scroll", clear);
    };
  }, [rootRef]);

  if (!action) return null;

  return (
    <button
      type="button"
      className="book-selection-ask"
      style={{ left: action.x, top: action.y }}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => {
        onAsk({
          ...scope,
          headingSlug: action.headingSlug,
          headingTitle: action.headingTitle,
          selection: action.selection,
        });
        window.getSelection()?.removeAllRanges();
        setAction(null);
      }}
    >
      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
      Ask Lumen
    </button>
  );
}

export default ReaderSelectionAction;
