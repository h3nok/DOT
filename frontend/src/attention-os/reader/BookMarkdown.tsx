import {
  Children,
  cloneElement,
  isValidElement,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, BookOpenText, ExternalLink, Library, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import {
  EDITORIAL_FORMS,
  claimLevelFromLabel,
  editorialFormFromText,
} from "./editorialGrammar";
import { headingSlug } from "./headingSlug";
import type {
  ReaderConceptDefinition,
  ReaderReference,
} from "./readerTypes";
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

function firstStrongLabel(children: ReactNode): string | null {
  for (const child of Children.toArray(children)) {
    if (typeof child === "string" && child.trim() === "") continue;
    if (isValidElement(child) && child.type === "strong") {
      return nodeText(child).trim();
    }
    return null;
  }
  return null;
}

function paragraphPresentation(children: ReactNode): {
  className?: string;
  claimLevel?: string;
} {
  const text = nodeText(children).trim();
  const strongLabel = firstStrongLabel(children);
  const explicitClaimLevel = claimLevelFromLabel(strongLabel);

  if (text.startsWith("The following are observations")) {
    return { className: "book-claim-ledger-label", claimLevel: "observation" };
  }
  if (text.startsWith("The following are DOT models")) {
    return { className: "book-claim-ledger-label", claimLevel: "model" };
  }
  if (text.startsWith("The following are DOT hypotheses")) {
    return { className: "book-claim-ledger-label", claimLevel: "hypothesis" };
  }
  if (text.startsWith("The following remain speculative")) {
    return { className: "book-claim-ledger-label", claimLevel: "speculation" };
  }
  if (strongLabel === "Practical model:" || strongLabel === "DOT hypothesis:") {
    return {
      className: "book-claim-level-statement",
      claimLevel: strongLabel === "Practical model:" ? "model" : "hypothesis",
    };
  }
  if (explicitClaimLevel) {
    return {
      className: "book-claim-level-statement",
      claimLevel: explicitClaimLevel,
    };
  }
  if (strongLabel?.endsWith(":")) {
    return { className: "book-inline-definition" };
  }
  if (
    text.includes("DOT still owes the reader") ||
    text.includes("theory’s unpaid debts") ||
    text.includes("theory's unpaid debts")
  ) {
    return { className: "book-theory-debt" };
  }
  return {};
}

function shouldSkipConceptLinks(element: ReactElement): boolean {
  if (typeof element.type !== "string") return false;
  if (["a", "button", "code", "pre"].includes(element.type)) return true;
  const className = (element.props as { className?: string }).className;
  return className?.split(" ").includes("katex") ?? false;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function linkConceptsInText(
  text: string,
  concepts: readonly ReaderConceptDefinition[],
  linkedConceptIds: Set<string>,
  onOpen: (concept: ReaderConceptDefinition) => void,
): ReactNode {
  const output: ReactNode[] = [];
  let remainder = text;
  let offset = 0;

  while (remainder) {
    let next:
      | { concept: ReaderConceptDefinition; index: number; term: string }
      | undefined;

    for (const concept of concepts) {
      if (linkedConceptIds.has(concept.id)) continue;
      for (const alias of concept.aliases) {
        const match = new RegExp(`\\b${escapeRegExp(alias)}\\b`).exec(remainder);
        if (!match) continue;
        if (!next || match.index < next.index || (match.index === next.index && alias.length > next.term.length)) {
          next = { concept, index: match.index, term: match[0] };
        }
      }
    }

    if (!next) {
      output.push(remainder);
      break;
    }

    if (next.index > 0) output.push(remainder.slice(0, next.index));
    linkedConceptIds.add(next.concept.id);
    output.push(
      <button
        key={`${next.concept.id}-${offset + next.index}`}
        type="button"
        className="book-concept-marker"
        onClick={() => onOpen(next.concept)}
        aria-label={`Define ${next.term}`}
        title={`Open the Book One definition of ${next.concept.title}`}
      >
        {next.term}
      </button>,
    );
    const consumed = next.index + next.term.length;
    offset += consumed;
    remainder = remainder.slice(consumed);
  }

  return output;
}

function linkConcepts(
  children: ReactNode,
  concepts: readonly ReaderConceptDefinition[],
  linkedConceptIds: Set<string>,
  onOpen: (concept: ReaderConceptDefinition) => void,
): ReactNode {
  return Children.map(children, (child) => {
    if (typeof child === "string") {
      return linkConceptsInText(child, concepts, linkedConceptIds, onOpen);
    }
    if (!isValidElement(child) || shouldSkipConceptLinks(child)) return child;
    const props = child.props as { children?: ReactNode };
    if (props.children === undefined) return child;
    return cloneElement(
      child as ReactElement<{ children?: ReactNode }>,
      undefined,
      linkConcepts(props.children, concepts, linkedConceptIds, onOpen),
    );
  });
}

function presentationStyle(presentation: ReturnType<typeof paragraphPresentation>) {
  return presentation.claimLevel
    ? ({
        "--book-claim-tone": `var(--book-claim-${presentation.claimLevel})`,
      } as CSSProperties)
    : undefined;
}

type ReaderAside =
  | { kind: "reference"; reference: ReaderReference }
  | { kind: "concept"; concept: ReaderConceptDefinition };

function ReaderSheet({
  active,
  onClose,
}: {
  active: ReaderAside | null;
  onClose: () => void;
}) {
  const isReference = active?.kind === "reference";
  const title = isReference
    ? `Reference ${active.reference.number}`
    : active?.kind === "concept"
      ? active.concept.title
      : "Reader note";

  return (
    <Dialog.Root open={Boolean(active)} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[55] bg-background/40 backdrop-blur-xs" />
        <Dialog.Content
          aria-describedby={undefined}
          className="appearance-ui-panel dot-surface book-reference-sheet fixed inset-x-3 bottom-3 z-[56] ml-auto max-h-[70svh] max-w-xl overflow-y-auto border p-5 sm:inset-x-6 sm:bottom-6 sm:p-7"
        >
          <div className="flex items-start justify-between gap-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--book-hairline)] bg-foreground/[0.02] text-[var(--book-cinnabar)]">
                {isReference ? (
                  <Library className="h-4.5 w-4.5" aria-hidden="true" />
                ) : (
                  <BookOpenText className="h-4.5 w-4.5" aria-hidden="true" />
                )}
              </span>
              <div>
                <p className="dot-label">
                  {isReference ? "Publication source" : "Publication concept"}
                </p>
                <Dialog.Title className="book-reading-heading text-xl font-semibold text-foreground">
                  {title}
                </Dialog.Title>
              </div>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/40 text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
                aria-label={`Close ${isReference ? "source" : "definition"}`}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>

          {active?.kind === "reference" && (
            <>
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
                  {active.reference.markdown}
                </ReactMarkdown>
              </div>
              <a
                href={`/book/digital-organism-theory/references#reference-${active.reference.number}`}
                className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-[var(--organism-accent-strong)]"
              >
                <span>Open in Notes and Sources</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </>
          )}

          {active?.kind === "concept" && (
            <div className="book-concept-definition mt-6">
              <div className="book-concept-definition-status flex items-center gap-2">
                <span className="dot-chip text-[11px] font-semibold text-[var(--book-cinnabar)]">
                  {active.concept.claimLevel}
                </span>
                <span className="text-xs text-muted-foreground">· Defined in this work</span>
              </div>
              <p className="book-concept-definition-lead mt-3 text-sm leading-relaxed text-foreground">
                {active.concept.definition}
              </p>
              <div className="book-concept-definition-detail mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
                <p>{active.concept.context}</p>
                {active.concept.boundary !== active.concept.context && (
                  <p className="book-concept-definition-boundary">
                    <strong className="text-foreground font-medium">Boundary:</strong> {active.concept.boundary}
                  </p>
                )}
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2.5 border-t border-[var(--book-hairline)] pt-5 text-xs font-semibold">
                <a
                  href={active.concept.sourceHref}
                  className="inline-flex items-center gap-1 text-foreground transition-colors hover:text-[var(--organism-accent-strong)]"
                >
                  <span>Read the source passage</span>
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </a>
                <a
                  href={active.concept.mapHref}
                  className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span>Open in the concept map</span>
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </a>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function BookMarkdown({
  content,
  afterHeading,
  concepts = [],
  references,
  variant = "chapter",
}: {
  content: string;
  afterHeading?: Readonly<Record<string, ReactNode>>;
  concepts?: readonly ReaderConceptDefinition[];
  references?: ReadonlyMap<number, ReaderReference>;
  variant?: "chapter" | "references";
}) {
  const [activeAside, setActiveAside] = useState<ReaderAside | null>(null);
  const linkedConceptIds = new Set<string>();
  const sectionHeadingNumbers = new Map(
    Array.from(content.matchAll(/^##[ \t]+(.+?)\s*#*\s*$/gm), (match, index) => [
      headingSlug(match[1].replace(/[*_`]/g, "")),
      index + 1,
    ]),
  );
  const withConceptLinks = (children: ReactNode) =>
    linkConcepts(children, concepts, linkedConceptIds, (concept) =>
      setActiveAside({ kind: "concept", concept }),
    );

  return (
    <>
      <div className={`book-prose book-prose--${variant} py-12`}>
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
              const sectionNumber = sectionHeadingNumbers.get(id) ?? 1;
              const terminal = id === "conclusion";
              return (
                <>
                  <h2 id={id} className="book-section-heading scroll-mt-24">
                    <span className="book-section-heading__marker" aria-hidden="true">
                      {terminal ? "Coda" : `§ ${String(sectionNumber).padStart(2, "0")}`}
                    </span>
                    <span className="book-section-heading__title">{children}</span>
                  </h2>
                  {afterHeading?.[id]}
                </>
              );
            },
            h3: ({ children }) => (
              <h3
                id={headingId(children)}
                className="book-subsection-heading scroll-mt-24"
              >
                {children}
              </h3>
            ),
            h4: ({ children }) => (
              <h4 id={headingId(children)} className="scroll-mt-24">
                {children}
              </h4>
            ),
            p: ({ children }) => {
              const presentation = paragraphPresentation(children);
              // A drop cap needs lines to wrap around it. The chapter cap is
              // 3.4em at 0.72 line-height — roughly three lines tall — and it
              // is applied to the opening paragraph whatever that paragraph is.
              // Chapter 1 opens with "Something is happening.": one short line
              // beside a three-line letter, which leaves a notch of empty space
              // where the text should have closed around it.
              //
              // Measured in characters rather than lines because the renderer
              // cannot know the column width. The threshold is deliberately
              // generous: a cap that is dropped where it should not have been
              // is far more conspicuous than one that was skipped.
              const short = nodeText(children).trim().length < 180;
              return (
                <p
                  className={presentation.className}
                  data-claim-level={presentation.claimLevel}
                  data-short-opening={short ? "true" : undefined}
                  style={presentationStyle(presentation)}
                >
                  {withConceptLinks(children)}
                </p>
              );
            },
            li: ({ children }) => <li>{withConceptLinks(children)}</li>,
            table: ({ children }) => (
              <div className="book-table-scroll" tabIndex={0}>
                <table>{children}</table>
              </div>
            ),
            blockquote: ({ children }) => {
              const form = editorialFormFromText(nodeText(children));
              const definition = EDITORIAL_FORMS.find(
                (candidate) => candidate.id === form,
              );
              return (
                <blockquote
                  className={form ? "book-editorial-form" : undefined}
                  data-editorial-form={form}
                  aria-label={definition?.label}
                >
                  {children}
                </blockquote>
              );
            },
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
                    onClick={() => setActiveAside({ kind: "reference", reference })}
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

      <ReaderSheet active={activeAside} onClose={() => setActiveAside(null)} />
    </>
  );
}

export default BookMarkdown;
