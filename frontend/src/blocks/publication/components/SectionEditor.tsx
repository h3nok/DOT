import {
  Check,
  Eye,
  FilePenLine,
  Loader2,
  Save,
  SplitSquareHorizontal,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import BookMarkdown from "../../../attention-os/reader/BookMarkdown";
import {
  claimStatementMarkdown,
  editorialFormMarkdown,
  type ClaimLevel,
  type EditorialFormId,
} from "../../../attention-os/reader/editorialGrammar";
import {
  fetchPublicationSectionBody,
  setPublicationSectionBody,
  type PublicationSectionRead,
  updatePublicationSection,
} from "../../../services/OrchestratorPublicationService";
import { EditorialToolbar, type InlineFormat } from "./EditorialToolbar";
import {
  insertMarkdownBlock,
  prefixMarkdownLines,
  wrapMarkdownSelection,
  type MarkdownEdit,
} from "./markdownEditing";

type EditorMode = "write" | "preview" | "split";

interface SectionEditorProps {
  section: PublicationSectionRead | null;
  onRefresh: () => Promise<void>;
}

const modeButton =
  "inline-flex h-8 items-center gap-1.5 px-2.5 dot-micro font-medium text-muted-foreground transition-colors hover:text-foreground data-[active=true]:bg-foreground data-[active=true]:text-background";

function countWords(value: string): number {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}

export function SectionEditor({ section, onRefresh }: SectionEditorProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [savedTitle, setSavedTitle] = useState("");
  const [savedBody, setSavedBody] = useState("");
  const [mode, setMode] = useState<EditorMode>("write");
  const [loadingBody, setLoadingBody] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!section) {
      setTitle("");
      setBody("");
      setSavedTitle("");
      setSavedBody("");
      return;
    }

    const abort = new AbortController();
    const sectionTitle = section.title;
    setTitle(sectionTitle);
    setSavedTitle(sectionTitle);
    setLoadingBody(true);
    setError(null);
    setSaveState("idle");

    void fetchPublicationSectionBody(section.id, undefined, abort.signal)
      .then((content) => {
        setBody(content);
        setSavedBody(content);
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError(reason instanceof Error ? reason.message : "The draft could not be opened.");
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoadingBody(false);
      });

    return () => abort.abort();
  }, [section]);

  const dirty = title !== savedTitle || body !== savedBody;

  useEffect(() => {
    if (!dirty) return;
    const protectDraft = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", protectDraft);
    return () => window.removeEventListener("beforeunload", protectDraft);
  }, [dirty]);

  const handleSave = useCallback(async () => {
    if (!section || isSaving || !dirty) return;
    if (!title.trim()) {
      setError("A section title is required.");
      return;
    }
    if (body !== savedBody && !body.trim()) {
      setError("A manuscript section cannot be saved empty.");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSaveState("idle");
      if (title !== savedTitle) {
        await updatePublicationSection(section.id, { title: title.trim() });
      }
      if (body !== savedBody) {
        await setPublicationSectionBody(section.id, body);
      }
      setTitle(title.trim());
      setSavedTitle(title.trim());
      setSavedBody(body);
      setSaveState("saved");
      await onRefresh();
    } catch (reason: unknown) {
      setSaveState("error");
      setError(reason instanceof Error ? reason.message : "The draft could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }, [body, dirty, isSaving, onRefresh, savedBody, savedTitle, section, title]);

  useEffect(() => {
    const saveFromKeyboard = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === "s") {
        event.preventDefault();
        void handleSave();
      }
    };
    window.addEventListener("keydown", saveFromKeyboard);
    return () => window.removeEventListener("keydown", saveFromKeyboard);
  }, [handleSave]);

  const applyEdit = (edit: MarkdownEdit) => {
    setBody(edit.value);
    setSaveState("idle");
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(edit.selectionStart, edit.selectionEnd);
    });
  };

  const selection = () => {
    const textarea = textareaRef.current;
    return {
      start: textarea?.selectionStart ?? body.length,
      end: textarea?.selectionEnd ?? body.length,
    };
  };

  const applyInlineFormat = (format: InlineFormat) => {
    const { start, end } = selection();
    if (format === "bold") {
      applyEdit(wrapMarkdownSelection(body, start, end, "**", "**", "emphasis"));
    } else if (format === "italic") {
      applyEdit(wrapMarkdownSelection(body, start, end, "*", "*", "emphasis"));
    } else {
      applyEdit(wrapMarkdownSelection(body, start, end, "[", "](https://)", "link text"));
    }
  };

  const applyEditorialForm = (form: EditorialFormId) => {
    const { start, end } = selection();
    const selected = body.slice(start, end);
    applyEdit(
      insertMarkdownBlock(body, start, end, editorialFormMarkdown(form, selected)),
    );
  };

  const applyClaimLevel = (level: ClaimLevel) => {
    const { start, end } = selection();
    const selected = body.slice(start, end);
    applyEdit(
      insertMarkdownBlock(body, start, end, claimStatementMarkdown(level, selected)),
    );
  };

  const words = useMemo(() => countWords(body), [body]);

  if (!section) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-muted-foreground">
        <div>
          <FilePenLine className="mx-auto h-5 w-5" aria-hidden="true" />
          <p className="mt-3 text-sm text-foreground">Choose a section</p>
          <p className="mt-1 text-xs">Its working draft will open here.</p>
        </div>
      </div>
    );
  }

  const writingVisible = mode !== "preview";
  const previewVisible = mode !== "write";

  return (
    <section className="book-surface flex h-full min-w-0 flex-col bg-background text-foreground">
      <header className="flex min-h-14 shrink-0 flex-wrap items-center gap-3 border-b border-border/60 px-4 py-2 sm:px-5">
        <input
          type="text"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            setSaveState("idle");
          }}
          className="min-w-48 flex-1 bg-transparent font-serif text-xl font-semibold outline-none placeholder:text-muted-foreground/50"
          placeholder="Section title"
          aria-label="Section title"
        />
        <div className="flex items-center border border-border/60" aria-label="Editor view">
          <button type="button" className={modeButton} data-active={mode === "write"} onClick={() => setMode("write")}>
            <FilePenLine className="h-3.5 w-3.5" aria-hidden="true" />
            Write
          </button>
          <button type="button" className={modeButton} data-active={mode === "preview"} onClick={() => setMode("preview")}>
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            Preview
          </button>
          <button type="button" className={`${modeButton} hidden lg:inline-flex`} data-active={mode === "split"} onClick={() => setMode("split")}>
            <SplitSquareHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            Split
          </button>
        </div>
      </header>

      <div className={`grid min-h-0 flex-1 ${mode === "split" ? "lg:grid-cols-2" : "grid-cols-1"}`}>
        {writingVisible && (
          <div className={`flex min-h-0 min-w-0 flex-col ${mode === "split" ? "border-r border-border/60" : ""}`}>
            <EditorialToolbar
              disabled={loadingBody}
              onInlineFormat={applyInlineFormat}
              onHeading={() => {
                const { start, end } = selection();
                applyEdit(prefixMarkdownLines(body, start, end, "## ", "Heading"));
              }}
              onQuote={() => {
                const { start, end } = selection();
                applyEdit(prefixMarkdownLines(body, start, end, "> ", "Quoted passage"));
              }}
              onEditorialForm={applyEditorialForm}
              onClaimLevel={applyClaimLevel}
            />
            <div className="relative min-h-0 flex-1">
              {loadingBody ? (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span className="sr-only">Opening section draft</span>
                </div>
              ) : (
                <textarea
                  ref={textareaRef}
                  className="h-full w-full resize-none bg-transparent px-5 py-6 font-mono text-sm leading-7 text-foreground outline-none placeholder:text-muted-foreground/50 sm:px-8"
                  placeholder="Write the section in Markdown..."
                  value={body}
                  spellCheck="true"
                  onChange={(event) => {
                    setBody(event.target.value);
                    setSaveState("idle");
                  }}
                />
              )}
            </div>
          </div>
        )}

        {previewVisible && (
          <div className="min-h-0 min-w-0 overflow-y-auto bg-[color:var(--book-paper)]">
            <article className="book-reader mx-auto w-full max-w-[760px] px-6 pb-20 pt-10 sm:px-10">
              <p className="font-mono uppercase text-[color:var(--book-cinnabar)]">
                Reader preview
              </p>
              <h1 className="book-reading-heading mt-3 text-center font-serif text-3xl font-semibold sm:text-4xl">
                {title || "Untitled section"}
              </h1>
              <BookMarkdown content={body || "*This section has no text yet.*"} />
            </article>
          </div>
        )}
      </div>

      <footer className="flex min-h-12 shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border/60 px-4 py-2 dot-micro text-muted-foreground sm:px-5">
        <div className="flex items-center gap-3 font-mono uppercase">
          <span>{words.toLocaleString()} words</span>
          <span>{section.status}</span>
          {dirty && <span className="text-[color:var(--book-cinnabar)]">Unsaved</span>}
          {saveState === "saved" && (
            <span className="inline-flex items-center gap-1 text-[color:var(--book-verdigris)]">
              <Check className="h-3 w-3" aria-hidden="true" /> Saved
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {error && (
            <span className="max-w-sm text-right text-destructive" role="alert">
              {error}
            </span>
          )}
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving || loadingBody || !dirty}
            className="inline-flex min-h-8 items-center gap-2 bg-foreground px-3 text-xs font-semibold text-background disabled:opacity-40"
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            Save revision
          </button>
        </div>
      </footer>
    </section>
  );
}
