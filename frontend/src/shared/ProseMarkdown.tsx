import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "react-router-dom";

const LINK =
  "text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-[color:var(--organism-accent-strong)]";

/**
 * Plain prose for the site's own pages (About, Privacy), set in the book's
 * reading type.
 *
 * Book pages and essays use the Reader primitive (`attention-os/reader`),
 * which carries math, concept links, and reference sheets. These pages need
 * none of that, so they skip its KaTeX weight. The text stays Markdown because
 * the build also renders it for readers who arrive without JavaScript.
 */
export function ProseMarkdown({ content }: { content: string }) {
  return (
    <div className="book-surface">
      <div className="book-prose">
        <ReactMarkdown
          skipHtml
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => <h1 className="dot-page-heading mb-6">{children}</h1>,
            h2: ({ children }) => <h2 className="book-subsection-heading">{children}</h2>,
            ul: ({ children }) => (
              <ul className="my-5 list-disc space-y-3 pl-6 marker:text-muted-foreground">
                {children}
              </ul>
            ),
            ol: ({ children }) => <ol className="my-5 list-decimal space-y-3 pl-6">{children}</ol>,
            a: ({ href = "", children }) =>
              href.startsWith("/") ? (
                <Link to={href} className={LINK}>
                  {children}
                </Link>
              ) : (
                <a href={href} className={LINK} rel="noreferrer">
                  {children}
                </a>
              ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}

export default ProseMarkdown;
