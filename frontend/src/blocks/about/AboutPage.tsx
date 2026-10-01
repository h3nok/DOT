import { useEffect, useState } from "react";
import { ArrowRight, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

import aboutText from "../../content/pages/about.md?raw";
import { author, authorByline, authorContact } from "../../content/author";
import { ESSAYS_PUBLISHED, ESSAYS_ROUTE } from "../../content/essays/essays";
import { formatReference } from "../../content/publications/citation";
import {
  DOT_BOOK_ONE_ROUTE,
  fetchDotBookOneManifest,
  type DotBookOneManifest,
} from "../../content/publications/dotBookOne";
import { PageHeader, PageShell } from "../../shared/PageShell";
import { ProseMarkdown } from "../../shared/ProseMarkdown";
import { SiteColophon } from "../../shared/SiteColophon";

const SECTION_HEADING = "text-lg font-semibold text-foreground";
const LINK =
  "text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-[color:var(--organism-accent-strong)]";

/**
 * Who is writing, and how to reach them (ADR-0033).
 *
 * This is the page people look for after hearing the work mentioned elsewhere,
 * and the one search engines treat as the author's identity. The account of
 * the work's origin is the preface's own words, not a second biography.
 */
export default function AboutPage() {
  const contact = authorContact();
  const [manifest, setManifest] = useState<DotBookOneManifest | null>(null);

  useEffect(() => {
    document.title = `${author.name} — About`;
  }, []);

  // Only for the citation below; the page is complete without it.
  useEffect(() => {
    const controller = new AbortController();
    fetchDotBookOneManifest(controller.signal)
      .then(setManifest)
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  return (
    <PageShell
      header={
        <PageHeader
          right={
            <Link
              to={DOT_BOOK_ONE_ROUTE}
              aria-label="Book One"
              className="inline-flex min-h-9 items-center gap-2 rounded-md px-2.5 text-xs text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
            >
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Book One</span>
            </Link>
          }
        />
      }
      footer={<SiteColophon />}
    >
      <div className="mx-auto max-w-2xl">
        <p className="dot-label">About</p>
        {author.photo && (
          <img
            src={author.photo}
            alt={`Portrait of ${author.name}`}
            className="mt-6 h-28 w-28 rounded-full object-cover"
          />
        )}
        <h1 className="dot-page-heading mt-4">{authorByline}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{author.role}</p>
        <p className="mt-6 text-lg leading-relaxed text-foreground/90">{author.summary}</p>

        <section aria-labelledby="about-origin" className="mt-14">
          <h2 id="about-origin" className={SECTION_HEADING}>
            Where the work comes from
          </h2>
          <div className="mt-6">
            <ProseMarkdown content={aboutText} />
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            From the{" "}
            <Link to={`${DOT_BOOK_ONE_ROUTE}/preface`} className={LINK}>
              preface to Book One
            </Link>
            .
          </p>
        </section>

        {author.credentials.length > 0 && (
          <section aria-labelledby="about-credentials" className="mt-14">
            <h2 id="about-credentials" className={SECTION_HEADING}>
              Education
            </h2>
            <ul className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
              {author.credentials.map((credential) => (
                <li key={`${credential.degree}-${credential.institution}`}>
                  <span className="text-foreground">{credential.degree}</span> ·{" "}
                  {credential.institution}, {credential.year}
                  {credential.dissertation && (
                    <span className="mt-1 block">
                      Dissertation:{" "}
                      <a
                        href={credential.dissertation.url}
                        className={LINK}
                        rel="noreferrer"
                      >
                        {credential.dissertation.title}
                      </a>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="about-work" className="mt-14">
          <h2 id="about-work" className={SECTION_HEADING}>
            The work
          </h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <li>
              <Link to={DOT_BOOK_ONE_ROUTE} className={LINK}>
                Consciousness: A Digital Organism
              </Link>{" "}
              — Book One, complete and free to read.
            </li>
            <li>
              <Link to="/doctrine" className={LINK}>
                The concept map
              </Link>{" "}
              — every term traced to the passage that defines it.
            </li>
            <li>
              <Link to="/applied" className={LINK}>
                Open seams
              </Link>{" "}
              — what the book says it does not yet establish.
            </li>
            {ESSAYS_PUBLISHED && (
              <li>
                <Link to={ESSAYS_ROUTE} className={LINK}>
                  Essays
                </Link>{" "}
                — writing beyond the book.
              </li>
            )}
          </ul>
        </section>

        {manifest && (
          <section aria-labelledby="about-cite" className="mt-14">
            <h2 id="about-cite" className={SECTION_HEADING}>
              Citing Book One
            </h2>
            <p className="mt-4 select-all break-words rounded-lg border border-border/60 bg-foreground/[0.02] p-4 font-mono text-xs leading-relaxed text-foreground/80">
              {formatReference(manifest, null)}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Each chapter offers its own citation, with BibTeX, at its end.
            </p>
          </section>
        )}

        <section aria-labelledby="about-contact" className="mt-14">
          <h2 id="about-contact" className={SECTION_HEADING}>
            Contact
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            For questions, objections, corrections, interviews, and requests about
            your data:{" "}
            <a href={contact.href} className={LINK} rel="noreferrer">
              {contact.label}
            </a>
            .
          </p>
          <p className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <a href={author.links.linkedin} className={LINK} rel="noreferrer me">
              LinkedIn
            </a>
            <a href={author.links.github} className={LINK} rel="noreferrer me">
              GitHub
            </a>
          </p>
        </section>

        <Link
          to={DOT_BOOK_ONE_ROUTE}
          className="mt-16 inline-flex items-center gap-2 text-sm text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-[color:var(--organism-accent-strong)]"
        >
          Begin with Book One
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </PageShell>
  );
}
