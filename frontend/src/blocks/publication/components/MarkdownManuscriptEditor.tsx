import { basicSetup, EditorView } from "codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

export interface MarkdownManuscriptEditorHandle {
  focus: () => void;
  getSelection: () => { start: number; end: number };
  setSelection: (start: number, end: number) => void;
}

interface MarkdownManuscriptEditorProps {
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
}

const manuscriptTheme = EditorView.theme({
  "&": {
    height: "100%",
    backgroundColor: "transparent",
    color: "var(--foreground)",
    fontSize: "0.875rem",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": {
    overflow: "auto",
    fontFamily: '"JetBrains Mono", ui-monospace, monospace',
    lineHeight: "1.8",
  },
  ".cm-content": {
    minHeight: "100%",
    padding: "1.75rem clamp(1.25rem, 4vw, 3.5rem) 8rem",
    caretColor: "var(--organism-accent-strong)",
  },
  ".cm-line": { padding: "0" },
  ".cm-cursor, .cm-dropCursor": {
    borderLeftColor: "var(--organism-accent-strong)",
  },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection": {
    backgroundColor:
      "color-mix(in oklch, var(--organism-accent) 22%, transparent)",
  },
  ".cm-activeLine": {
    backgroundColor:
      "color-mix(in oklch, var(--organism-accent) 4%, transparent)",
  },
  ".cm-gutters": {
    border: "none",
    borderRight: "1px solid var(--book-hairline)",
    backgroundColor:
      "color-mix(in oklch, var(--book-paper) 86%, var(--foreground) 2%)",
    color: "color-mix(in oklch, var(--muted-foreground) 58%, transparent)",
  },
  ".cm-activeLineGutter": {
    backgroundColor:
      "color-mix(in oklch, var(--organism-accent) 7%, transparent)",
    color: "var(--organism-accent-strong)",
  },
  ".cm-foldGutter span": { color: "var(--muted-foreground)" },
  ".cm-panels": {
    borderColor: "var(--book-hairline)",
    backgroundColor: "var(--book-paper)",
    color: "var(--foreground)",
  },
  ".cm-searchMatch": {
    outline: "1px solid var(--organism-accent-strong)",
    backgroundColor:
      "color-mix(in oklch, var(--organism-accent) 14%, transparent)",
  },
  ".cm-tooltip": {
    border: "1px solid var(--book-hairline)",
    backgroundColor: "var(--book-paper)",
    color: "var(--foreground)",
  },
});

/**
 * A lossless Markdown workbench. CodeMirror owns editing mechanics, while the
 * stored value remains the same Markdown consumed by BookMarkdown. There is no
 * HTML/JSON conversion layer between the author's draft and the released text.
 */
export const MarkdownManuscriptEditor = forwardRef<
  MarkdownManuscriptEditorHandle,
  MarkdownManuscriptEditorProps
>(function MarkdownManuscriptEditor(
  { value, onChange, ariaLabel = "Manuscript Markdown editor" },
  forwardedRef,
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const view = new EditorView({
      doc: value,
      parent: host,
      extensions: [
        basicSetup,
        markdown({ base: markdownLanguage }),
        EditorView.lineWrapping,
        EditorView.contentAttributes.of({
          "aria-label": ariaLabel,
          spellcheck: "true",
          autocapitalize: "sentences",
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
        manuscriptTheme,
      ],
    });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // The document is synchronized by the effect below. Rebuilding an editor
    // for each keystroke would discard history and selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ariaLabel]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current === value) return;

    const cursor = Math.min(view.state.selection.main.head, value.length);
    view.dispatch({
      changes: { from: 0, to: current.length, insert: value },
      selection: { anchor: cursor },
    });
  }, [value]);

  useImperativeHandle(
    forwardedRef,
    () => ({
      focus: () => viewRef.current?.focus(),
      getSelection: () => {
        const range = viewRef.current?.state.selection.main;
        return range
          ? { start: Math.min(range.from, range.to), end: Math.max(range.from, range.to) }
          : { start: value.length, end: value.length };
      },
      setSelection: (start, end) => {
        const view = viewRef.current;
        if (!view) return;
        const documentLength = view.state.doc.length;
        const anchor = Math.max(0, Math.min(start, documentLength));
        const head = Math.max(0, Math.min(end, documentLength));
        view.dispatch({
          selection: { anchor, head },
          scrollIntoView: true,
        });
        view.focus();
      },
    }),
    [value.length],
  );

  return <div ref={hostRef} className="studio-markdown-editor h-full min-h-0" />;
});
