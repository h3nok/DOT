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
      className="book-coda__section book-private-note scroll-mt-24 print:hidden"
      aria-labelledby="private-reader-note-title"
    >
      <header className="book-coda__section-heading">
        <h2 id="private-reader-note-title" className="book-coda__section-title">
          Private margin
        </h2>
        <p className="book-coda__section-purpose">
          Saved only in this browser. Never published.
        </p>
      </header>

      <div className="book-coda__section-body">
        <div className="book-private-note__field">
          <textarea
            value={note}
            onChange={(event) => save(event.target.value)}
            rows={4}
            aria-label="Private note for this section"
            placeholder="A thought, question, or passage to revisit…"
            className="book-recall-note w-full resize-y bg-transparent text-base leading-7 text-foreground outline-none placeholder:text-muted-foreground/65"
          />
          {note ? (
            <button
              type="button"
              onClick={() => save("")}
              className="book-private-note__clear"
              aria-label="Clear this private note"
              title="Clear note"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
        <p
          aria-live="polite"
          className="book-private-note__status"
          data-error={storageAvailable ? undefined : "true"}
        >
          {storageAvailable ? (note ? "Saved" : "Not shared") : "Saving unavailable"}
        </p>
      </div>
    </section>
  );
}

export default PrivateReaderNote;
