import { Trash2 } from "lucide-react";
import { useState } from "react";

const NOTE_KEY_PREFIX = "dot.reader-note.v1";

function noteKey(storageId: string): string {
  return `${NOTE_KEY_PREFIX}.${storageId}`;
}

function readNote(storageId: string): string {
  try {
    return window.localStorage.getItem(noteKey(storageId)) ?? "";
  } catch {
    return "";
  }
}

export function PrivateReaderNote({ storageId }: { storageId: string }) {
  const [note, setNote] = useState(() => readNote(storageId));
  const [storageAvailable, setStorageAvailable] = useState(true);

  const save = (value: string) => {
    setNote(value);
    try {
      if (value) {
        window.localStorage.setItem(noteKey(storageId), value);
      } else {
        window.localStorage.removeItem(noteKey(storageId));
      }
      setStorageAvailable(true);
    } catch {
      setStorageAvailable(false);
    }
  };

  return (
    <section
      id="private-reader-note"
      className="book-private-note border-y border-[var(--book-hairline)] py-7 print:hidden sm:py-8"
      aria-labelledby="private-reader-note-title"
    >
      <div className="flex items-start justify-between gap-4">
        {/* No icon. Four coda sections now share one label treatment, and this
            was the only one wearing a glyph — in cinnabar, on the quietest of
            them, which pulled the eye to the least consequential thing at the
            foot of a chapter. */}
        <div className="flex items-start gap-3">
          {/* One name, not two. "Private margin" above "Notes for this
              section" was a label and a heading doing the same job, and the
              placeholder below already says what to write. The margin is the
              better of the two: it is what the thing is called in a book. */}
          <h2
            id="private-reader-note-title"
            className="book-coda__label"
          >
            Private margin
          </h2>
        </div>
        {note ? (
          <button
            type="button"
            onClick={() => save("")}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Clear this private note"
            title="Clear note"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <textarea
        value={note}
        onChange={(event) => save(event.target.value)}
        rows={4}
        aria-label="Private note for this section"
        placeholder="A thought, question, or passage to revisit…"
        className="book-recall-note mt-5 w-full resize-y border-x-0 border-b border-t bg-transparent px-0 py-3 text-base leading-7 text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-[var(--book-cinnabar)]"
      />
      {/* "Stored only in this browser" and "Saved on this device" were the same
          fact twice — one as a promise, one as a status. The promise is stated
          once; the live region keeps only what actually changes. */}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 font-mono dot-micro uppercase tracking-[0.1em] text-muted-foreground">
        <span>Private to this browser</span>
        <span aria-live="polite">
          {storageAvailable ? "Saved on this device" : "Saving unavailable"}
        </span>
      </div>
    </section>
  );
}

export default PrivateReaderNote;
