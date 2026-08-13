import { useEffect, useState, type ReactNode } from "react";
import { isValidElement } from "react";
import { ExternalLink, Library, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { headingSlug } from "./headingSlug";
import type { BookReference } from "../../content/publications/dotBookOne";
import "katex/dist/katex.min.css";

function nodeText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join("");
  if (isValidElement(node)) {
    return nodeText((node.props as { children?: ReactNode }).children);
  }
  return "";
}

function headingId(children: ReactNode): string {
  return headingSlug(nodeText(children));
}

export function BookMarkdown({
  content,
  afterHeading,
  references,
}: {
  content: string;
  afterHeading?: Readonly<Record<string, ReactNode>>;
  references?: ReadonlyMap<number, BookReference>;
}) {
  const [activeReference, setActiveReference] = useState<BookReference | null>(null);

  useEffect(() => {
    if (!activeReference) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveReference(null);
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [activeReference]);

  return (
    <>
      <div className="book-prose py-12">
        <ReactMarkdown
          skipHtml
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            h1: ({ children }) => (
              <h1 id={headingId(children)} className="scroll-mt-24">
                {children}
              </h1>
            ),
            h2: ({ children }) => {
              const id = headingId(children);
              return (
                <>
                  <h2 id={id} className="scroll-mt-24">
                    {children}
                  </h2>
                  {afterHeading?.[id]}
                </>
              );
            },
            h3: ({ children }) => (
              <h3 id={headingId(children)} className="scroll-mt-24">
                {children}
              </h3>
            ),
            h4: ({ children }) => (
              <h4 id={headingId(children)} className="scroll-mt-24">
                {children}
              </h4>
            ),
            a: ({ href, children }) => {
              const referenceNumber = href?.match(/#reference-(\d+)$/)?.[1];
              const reference = referenceNumber
                ? references?.get(Number(referenceNumber))
                : undefined;
              if (reference) {
                return (
                  <button
                    type="button"
                    className="book-reference-marker"
                    onClick={() => setActiveReference(reference)}
                    aria-label={`Open reference ${reference.number}`}
                    title={`Preview reference ${reference.number}`}
                  >
                    {children}
                  </button>
                );
              }
              const external = href?.startsWith("http");
              return (
                <a
                  href={href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                >
                  {children}
                </a>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>

      {activeReference && (
        <div className="fixed inset-0 z-[55]" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-background/35 backdrop-blur-[2px]"
            onClick={() => setActiveReference(null)}
            aria-label="Close source preview"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="book-reference-title"
            className="book-reference-sheet absolute inset-x-3 bottom-3 ml-auto max-h-[70svh] max-w-xl overflow-y-auto border border-[var(--book-hairline)] bg-background p-5 shadow-2xl sm:inset-x-6 sm:bottom-6 sm:p-7"
          >
            <div className="flex items-start justify-between gap-5">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center border border-[var(--book-hairline)] text-[var(--book-cinnabar)]">
                  <Library className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                    Book One source
                  </p>
                  <h2 id="book-reference-title" className="book-reading-heading text-xl font-semibold text-foreground">
                    Reference {activeReference.number}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveReference(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Close source preview"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="book-reference-copy mt-6">
              <ReactMarkdown
                skipHtml
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer">
                      {children}
                      <ExternalLink className="ml-1 inline h-3 w-3" aria-hidden="true" />
                    </a>
                  ),
                }}
              >
                {activeReference.markdown}
              </ReactMarkdown>
            </div>
            <a
              href={`/book/digital-organism-theory/references#reference-${activeReference.number}`}
              className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-foreground underline decoration-border underline-offset-4"
            >
              Open in Notes and Sources
            </a>
          </aside>
        </div>
      )}
    </>
  );
}

export default BookMarkdown;
