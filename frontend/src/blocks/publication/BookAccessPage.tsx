import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Download,
  ExternalLink,
  HeartHandshake,
  Linkedin,
} from "lucide-react";
import { Link } from "react-router-dom";

import {
  DOT_BOOK_ONE_PDF_URL,
  DOT_BOOK_ONE_ROUTE,
} from "../../content/publications/dotBookOne";
import { siteConfig } from "../../content/site.config";
import BookOneCover from "./BookOneCover";

export default function BookAccessPage() {
  return (
    <main className="book-surface min-h-[100svh] bg-background px-5 pb-20 pt-6 text-foreground sm:px-8">
      <header className="mx-auto flex max-w-5xl items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          DOT
        </Link>
        <span className="dot-label">Book One · Digital Edition</span>
      </header>

      <section className="mx-auto flex max-w-4xl flex-col items-center pb-12 pt-14 text-center sm:pt-20">
        <BookOneCover className="w-[min(19rem,78vw)]" />

        <p className="dot-label mt-12 text-[var(--book-cinnabar)]">
          Free to read · Free to download
        </p>
        <h1 className="dot-page-heading mt-4 max-w-3xl text-balance">
          Read freely. Keep a copy.
        </h1>
        <a
          href={siteConfig.social.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 text-xs text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
        >
          <Linkedin className="h-3.5 w-3.5" aria-hidden="true" />
          <strong>Henok Ghebrechristos, PhD</strong>
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
        <p className="book-reading-copy mt-6 max-w-xl text-balance text-lg italic leading-relaxed text-muted-foreground">
          The complete book is free online and as a PDF for offline study,
          annotation, and reference. No account, email address, or payment required.
        </p>

        <div className="mt-12 w-full border-y border-border/60 text-left">
          <a
            href={DOT_BOOK_ONE_PDF_URL}
            download="Digital-Organism-Theory-Book-One-Digital-Edition.pdf"
            className="group flex min-h-28 items-center gap-4 border-b border-border/60 px-2 py-6 transition-colors hover:bg-foreground/[0.03] sm:px-4"
          >
            <Download className="h-5 w-5 shrink-0 text-[var(--book-cinnabar)]" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="book-reading-heading block text-2xl font-semibold">
                Download the free PDF
              </span>
              <span className="book-reading-copy mt-1 block text-sm leading-relaxed text-muted-foreground">
                The complete digital edition, ready to keep.
              </span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </a>
          <Link
            to={DOT_BOOK_ONE_ROUTE}
            className="group flex min-h-28 items-center gap-4 px-2 py-6 transition-colors hover:bg-foreground/[0.03] sm:px-4"
          >
            <BookOpen className="h-5 w-5 shrink-0 text-[var(--book-cinnabar)]" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="book-reading-heading block text-2xl font-semibold">
                Read the fixed edition online
              </span>
              <span className="book-reading-copy mt-1 block text-sm leading-relaxed text-muted-foreground">
                Source-linked reading, with the book&apos;s concepts and references close at hand.
              </span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </Link>
        </div>

        <aside className="mt-12 max-w-lg" aria-labelledby="book-support-title">
          <h2 id="book-support-title" className="book-reading-heading text-xl">
            Support the author, if you wish.
          </h2>
          <p className="book-reading-copy mt-3 text-sm leading-relaxed text-muted-foreground">
            A voluntary, one-time contribution helps fund independent writing and
            research. Choose an amount that works for you, or simply read.
            The book and PDF remain free either way.
          </p>
          <Link
            to="/support?purpose=author"
            className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-[var(--book-cinnabar)]"
          >
            <HeartHandshake className="h-4 w-4" aria-hidden="true" />
            Support the author · optional
          </Link>
        </aside>
      </section>
    </main>
  );
}
