import type { ReactNode } from "react";
import { isValidElement } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { headingSlug } from "./headingSlug";
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
}: {
  content: string;
  afterHeading?: Readonly<Record<string, ReactNode>>;
}) {
  return (
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
  );
}

export default BookMarkdown;
