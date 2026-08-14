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

import { DOT_BOOK_ONE_ROUTE } from "../../content/publications/dotBookOne";
import { siteConfig } from "../../content/site.config";
import DotEmergenceField from "./DotEmergenceField";

const assetUrl = (path: string) => {
  const base = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  return `${base}${path}`.replace(/\/{2,}/g, "/");
};

const PDF_URL = assetUrl(
  "books/digital-organism-theory-book-one-digital-edition.pdf",
);
/** One public digital edition, with the editable manuscript kept private. */
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
        <span className="dot-label">
          Book One · Digital Edition
        </span>
      </header>

      <section className="mx-auto flex max-w-4xl flex-col items-center pb-12 pt-14 text-center sm:pt-20">
        <div className="book-digital-cover relative aspect-[3/4] w-[min(18rem,72vw)] overflow-hidden border border-[var(--book-hairline)] text-foreground shadow-2xl">
          <DotEmergenceField variant="cover" className="absolute inset-0" />
          <span className="book-digital-cover-wash absolute inset-0" aria-hidden="true" />
          <div className="relative flex h-full flex-col items-center px-6 pb-20 pt-20">
            <p className="mt-8 dot-label text-[var(--book-muted)]">
              Digital Organism Theory · Book One
            </p>
            <h1 className="mt-4 font-serif text-3xl font-semibold leading-tight">
              Consciousness:
              <span className="book-digital-subtitle mt-2 block text-sm font-medium text-[var(--book-muted)]">
                A Digital Organism
              </span>
            </h1>
            <div className="book-cover-colophon mt-auto w-full">
              <span className="mx-auto block h-px w-16 bg-foreground/40" aria-hidden="true" />
              <p className="mt-4 font-serif text-sm font-semibold">
                Henok Ghebrechristos
              </p>
              <p className="mt-2 dot-label text-[10px] text-[var(--book-muted)]">
                Digital Edition · Version 2
              </p>
            </div>
          </div>
        </div>

        <p className="dot-label mt-12 text-[var(--book-cinnabar)]">
          One complete digital edition
        </p>
        <h2 className="dot-page-heading mt-4 max-w-3xl text-balance">
          Read in the living edition or keep the book as a PDF.
        </h2>
        <a
          href={siteConfig.social.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 text-xs text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
        >
          <Linkedin className="h-3.5 w-3.5" aria-hidden="true" />
          Henok Ghebrechristos
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
        <p className="book-reading-copy mt-6 max-w-xl text-balance text-lg italic leading-relaxed text-muted-foreground">
          The PDF and web reader carry the same released argument. The Word
          manuscript remains the private editorial source for future revisions.
        </p>

        <div className="mt-12 w-full border-y border-border/60 text-left">
          <a
            href={PDF_URL}
            download="Digital-Organism-Theory-Book-One-Digital-Edition.pdf"
            className="group flex min-h-28 items-center gap-4 border-b border-border/60 px-2 py-6 transition-colors hover:bg-foreground/[0.03] sm:px-4"
          >
            <Download
              className="h-5 w-5 shrink-0 text-[var(--book-cinnabar)]"
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1">
              <span className="book-reading-heading block text-2xl font-semibold">
                Download the digital edition
              </span>
              <span className="book-reading-copy mt-1 block text-sm leading-relaxed text-muted-foreground">
                One tagged, searchable PDF containing the complete book and its sources.
              </span>
            </span>
            <ArrowRight
              className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </a>

          <Link
            to={DOT_BOOK_ONE_ROUTE}
            className="group flex min-h-28 items-center gap-4 px-2 py-6 transition-colors hover:bg-foreground/[0.03] sm:px-4"
          >
            <BookOpen className="h-5 w-5 shrink-0 text-[var(--book-cinnabar)]" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="book-reading-heading block text-2xl font-semibold">
                Read the living edition
              </span>
              <span className="book-reading-copy mt-1 block text-sm leading-relaxed text-muted-foreground">
                Citation previews, reading paths, concept trails, and Minty beside the text.
              </span>
            </span>
            <ArrowRight
              className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>

        <p className="book-reading-copy mt-8 max-w-lg text-sm leading-relaxed text-muted-foreground">
          Reading remains free and complete. The digital edition is a stable copy
          for offline study, annotation, and reference.
        </p>
        <Link
          to="/support"
          className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-[var(--book-cinnabar)]"
        >
          <HeartHandshake className="h-4 w-4" aria-hidden="true" />
          Support future books and tools
        </Link>
      </section>
    </main>
  );
}
