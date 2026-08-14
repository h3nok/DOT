import { NotebookPen, Trash2 } from "lucide-react";
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
        <div className="flex items-start gap-3">
          <NotebookPen
            className="mt-0.5 h-4 w-4 text-[var(--book-cinnabar)]"
            aria-hidden="true"
          />
          <div>
            <p className="dot-label">Private margin</p>
            <h2
              id="private-reader-note-title"
              className="book-reading-heading mt-1 text-lg font-semibold text-foreground"
            >
              Notes for this section
            </h2>
          </div>
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
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 font-mono dot-micro uppercase tracking-[0.1em] text-muted-foreground">
        <span>Stored only in this browser</span>
        <span aria-live="polite">
          {storageAvailable ? "Saved on this device" : "Local saving unavailable"}
        </span>
      </div>
    </section>
  );
}

export default PrivateReaderNote;
