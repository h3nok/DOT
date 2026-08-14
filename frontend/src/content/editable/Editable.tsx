/**
 * One editable line of public copy.
 *
 * For a reader this renders as the element it replaces and nothing else — no
 * wrapper chrome, no extra DOM, no cost. For the steward in edit mode it gains
 * a quiet affordance and opens an inline editor in place, so copy is written
 * where it is read rather than in a form somewhere else.
 */

import { useEffect, useRef, useState, type ElementType } from "react";
import { Check, RotateCcw, X } from "lucide-react";

import { useSiteContent } from "./SiteContentProvider";

interface EditableProps {
  /** Stable dotted address, e.g. `home.lede`. Must match the backend key. */
  id: string;
  /** The released wording. Shown whenever no published override exists. */
  text: string;
  as?: ElementType;
  className?: string;
  /** Multi-sentence copy gets a taller editor. */
  multiline?: boolean;
}

export function Editable({
  id,
  text,
  as: Tag = "span",
  className,
  multiline = false,
}: EditableProps) {
  const { resolve, canEdit, editMode, hasDraft, draftValue, save, revert } =
    useSiteContent();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const live = resolve(id, text);
  const editable = canEdit && editMode;

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!editable) {
    return <Tag className={className}>{live}</Tag>;
  }

  const begin = () => {
    setValue(draftValue(id) ?? live);
    setError(null);
    setOpen(true);
  };

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      setOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <Tag className={className}>
        <button
          type="button"
          onClick={begin}
          title={`Edit "${id}"`}
          className="cursor-text rounded-sm text-left underline decoration-dotted decoration-1 underline-offset-4 transition-colors hover:bg-[color:var(--organism-accent-soft)]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--organism-accent-soft)]"
        >
          {live}
        </button>
        {hasDraft(id) && (
          <span
            className="ml-2 align-middle font-mono dot-micro uppercase tracking-[0.14em] text-[color:var(--book-cinnabar,#a3544d)]"
            title="This block has an edit you have not published yet."
          >
            draft
          </span>
        )}
      </Tag>
    );
  }

  return (
    <Tag className={className}>
      <span className="block rounded-md border border-border/70 bg-background/95 p-2 text-left shadow-sm">
        <textarea
          ref={inputRef}
          value={value}
          rows={multiline ? 4 : 2}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
            // Enter commits single-line copy; multiline needs the button.
            if (event.key === "Enter" && !event.shiftKey && !multiline) {
              event.preventDefault();
              void run(() => save(id, value, { publish: true }));
            }
          }}
          className="w-full resize-y bg-transparent font-sans text-sm leading-relaxed text-foreground outline-none"
          aria-label={`Copy for ${id}`}
        />

        <span className="mt-2 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            disabled={busy}
            onClick={() => void run(() => save(id, value, { publish: true }))}
            className="inline-flex items-center gap-1 rounded-md bg-foreground px-2.5 py-1 text-xs font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Check className="h-3 w-3" aria-hidden="true" />
            Publish
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void run(() => save(id, value))}
            className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            Save draft
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void run(() => revert(id))}
            title="Restore the released wording"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            <RotateCcw className="h-3 w-3" aria-hidden="true" />
            Reset
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-3 w-3" aria-hidden="true" />
            Cancel
          </button>
        </span>

        {error && (
          <span className="mt-1.5 block text-xs text-destructive" role="alert">
            {error}
          </span>
        )}
      </span>
    </Tag>
  );
}

export default Editable;
