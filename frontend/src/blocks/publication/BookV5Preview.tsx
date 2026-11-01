import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, Download } from "lucide-react";
import BookMarkdown from "../../attention-os/reader/BookMarkdown";
import { openEnclosingDepth } from "../../attention-os/reader/openEnclosingDepth";
import {
  parseBookReferences,
  bookCoverAsset,
  bookFigureMap,
  type BookIllustration,
  type BookReference,
  type BookReleaseSection,
  type DotBookOneManifest,
} from "../../content/publications/dotBookOne";
import { AppearanceControl } from "../../organism";
import BookOneCover from "./BookOneCover";
import "./book-v5-preview.css";

const PREVIEW_ROOT = "/_preview/book-v5";
const ASSET_ROOT = "/_book-v5/";

interface ProofManifest extends Omit<DotBookOneManifest, "project"> {
  project: Omit<DotBookOneManifest["project"], "visibility"> & { visibility: "private" };
  figures: BookIllustration[];
  artifacts?: { pdf?: string };
}

interface ProofState {
  manifest: ProofManifest;
  section?: BookReleaseSection;
  content: string;
  references: Map<number, BookReference>;
}

function assetUrl(path: string): string {
  if (!path || path.startsWith("/") || path.includes("\\") || path.split("/").some(part => part === ".." || part === ".")) {
    throw new Error("The proof contains an invalid asset path.");
  }
  return ASSET_ROOT + path;
}

async function readText(path: string, signal: AbortSignal): Promise<string> {
  const response = await fetch(assetUrl(path), { cache: "no-store", signal });
  if (!response.ok) throw new Error("The local book proof is unavailable. Build the v5 proof and reopen this page.");
  return response.text();
}

/** A development-only reading proof. Its manuscript is never a production asset. */
export default function BookV5Preview() {
  const { sectionSlug } = useParams<{ sectionSlug?: string }>();
  const location = useLocation();
  const [proof, setProof] = useState<ProofState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const controller = new AbortController();
    setProof(null);
    setError(null);
    void (async () => {
      const manifest = JSON.parse(await readText("manifest.json", controller.signal)) as ProofManifest;
      if (manifest.release?.version !== 5 || manifest.release.status !== "draft" || manifest.project?.visibility !== "private" || !Array.isArray(manifest.sections) || !Array.isArray(manifest.figures)) {
        throw new Error("This page requires the unpublished v5 proof manifest.");
      }
      const section = manifest.sections.find(item => item.slug === sectionSlug);
      if (sectionSlug && !section) throw new Error("That section is not part of this proof. Choose a section from the contents.");
      const referencesSection = manifest.sections.find(item => item.kind === "references");
      const [content, references] = await Promise.all([
        section ? readText(section.content_path, controller.signal) : Promise.resolve(""),
        section && referencesSection ? readText(referencesSection.content_path, controller.signal) : Promise.resolve(""),
      ]);
      if (!controller.signal.aborted) {
        setProof({ manifest, section, content, references: parseBookReferences(references) });
      }
    })().catch((reason: unknown) => {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "The book proof could not be opened.");
    });
    return () => controller.abort();
  }, [sectionSlug]);

  useEffect(() => {
    if (!proof) return;
    const frame = window.requestAnimationFrame(() => {
      let anchor = location.hash.slice(1);
      try { anchor = decodeURIComponent(anchor); } catch { /* A malformed anchor has no target. */ }
      const target = anchor ? document.getElementById(anchor) : null;
      if (target) {
        openEnclosingDepth(target);
        target.scrollIntoView({ block: "start" });
      } else {
        window.scrollTo({ top: 0 });
        titleRef.current?.focus({ preventScroll: true });
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [proof, location.hash]);

  if (!import.meta.env.DEV) return null;

  const manifest = proof?.manifest;
  const section = proof?.section;
  const index = section && manifest ? manifest.sections.findIndex(item => item.slug === section.slug) : -1;
  const previous = index > 0 ? manifest?.sections[index - 1] : undefined;
  const next = index >= 0 ? manifest?.sections[index + 1] : undefined;
  const figures = bookFigureMap(manifest ?? {}, assetUrl);
  const cover = bookCoverAsset(manifest ?? {}, assetUrl);
  const chapterFigures = manifest?.figures.filter(figure => figure.section === section?.slug) ?? [];
  const first = manifest?.sections[0];
  const pdfUrl = manifest?.artifacts?.pdf ? assetUrl(manifest.artifacts.pdf) : undefined;
  const title = section?.title ?? manifest?.project.title ?? "Book One";

  return (
    <div className="book-surface book-v5-preview min-h-screen bg-background text-foreground">
      <Helmet>
        <title>{title} · v5 editorial proof</title>
        <meta name="robots" content="noindex, nofollow, noarchive" />
      </Helmet>
      <a className="book-v5-preview__skip" href="#proof-main">Skip to the manuscript</a>
      <header className="book-v5-preview__header">
        <Link to={PREVIEW_ROOT}>Book One · v5 proof</Link>
        <AppearanceControl placement="inline" />
      </header>
      <main id="proof-main" className={`book-v5-preview__main book-reader${!section ? " book-v5-preview__main--contents" : ""}`} aria-busy={!proof && !error}>
        {!proof ? (
          <>
            <h1 className="book-reading-heading">Book One · v5 proof</h1>
            <p role={error ? "alert" : "status"}>{error ?? "Opening the manuscript…"}</p>
            {error && <Link to={PREVIEW_ROOT}>Return to the contents</Link>}
          </>
        ) : (
          <>
            {section ? <header className="book-chapter-header">
              <p className="book-v5-preview__edition">Private editorial proof · Version 5</p>
              <Link className="book-v5-preview__back" to={PREVIEW_ROOT}><ArrowLeft aria-hidden="true" /> Contents</Link>
              <h1 ref={titleRef} tabIndex={-1} className="book-reading-heading">{title}</h1>
              <p className="book-reading-copy">{section.subtitle}</p>
              <p className="book-v5-preview__cost">{section.kind === "chapter" ? `Chapter ${section.number} · ` : ""}{section.reading_time_minutes} min reading</p>
              {chapterFigures.length > 0 && <nav className="book-v5-preview__figure-links" aria-label="Illustrations in this chapter">
                {chapterFigures.map(figure => <a key={figure.id} href={`#figure-${figure.id}`}>Figure {figure.number} · {figure.title}</a>)}
              </nav>}
            </header> : (
              <section className="book-v5-preview__entry" aria-labelledby="proof-title">
                <div className="book-v5-preview__entry-copy">
                  <p className="book-v5-preview__edition">Book One · Illustrated Version 5 · Review edition</p>
                  <h1 id="proof-title" ref={titleRef} tabIndex={-1} className="book-reading-heading">{title}</h1>
                  <p className="book-v5-preview__subtitle book-reading-copy">{manifest?.project.subtitle}</p>
                  <p className="book-v5-preview__author">By {manifest?.project.author}</p>
                  <p className="book-v5-preview__introduction book-reading-copy">Begin with lived experience. Examine the patterns that shape perception, identity, and choice, then consider the model and its limits.</p>
                  <div className="book-v5-preview__actions">
                    {first && <Link className="book-v5-preview__begin" to={`${PREVIEW_ROOT}/${first.slug}`}><BookOpen aria-hidden="true" /> Begin reading <ArrowRight aria-hidden="true" /></Link>}
                    <a href="#proof-contents">Browse the chapters</a>
                    {pdfUrl && <a href={pdfUrl}><Download aria-hidden="true" /> PDF proof</a>}
                  </div>
                  {first && <p className="book-v5-preview__cost">The opening is {first.reading_time_minutes} min · No account needed</p>}
                </div>
                {cover && <BookOneCover artwork={cover} className="book-v5-preview__cover" />}
              </section>
            )}
            {section ? (
              <>
                <BookMarkdown
                  content={proof.content}
                  figures={figures}
                  references={proof.references}
                  variant={section.kind === "references" ? "references" : "chapter"}
                  completeEditionHref={pdfUrl}
                />
                <nav className="book-v5-preview__turn" aria-label="Continue through the proof">
                  {previous && <Link to={`${PREVIEW_ROOT}/${previous.slug}`}><ArrowLeft aria-hidden="true" /><span>{previous.title}</span></Link>}
                  {next ? <Link to={`${PREVIEW_ROOT}/${next.slug}`}><span>{next.title}</span><ArrowRight aria-hidden="true" /></Link> : <Link to={PREVIEW_ROOT}>End of the proof · Return to contents</Link>}
                </nav>
              </>
            ) : (
              <>
                <section id="proof-contents" className="book-v5-preview__index" aria-labelledby="proof-contents-title">
                  <div className="book-v5-preview__index-intro">
                    <p className="book-v5-preview__edition">Contents</p>
                    <h2 id="proof-contents-title" className="book-reading-heading">Choose a chapter.</h2>
                    <p className="book-reading-copy">The illustrations appear beside the passages they explain. You can also open each figure directly below.</p>
                    <p className="book-reading-copy">Formal notes open when you choose. The PDF includes the complete text throughout.</p>
                  </div>
                <nav className="book-v5-preview__contents" aria-label="Proof contents">
                  <ol>
                    {manifest?.sections.map(item => (
                      <li key={item.id}>
                        <Link to={`${PREVIEW_ROOT}/${item.slug}`}>
                          <span>{item.kind === "chapter" ? `${item.number}. ` : ""}{item.title}</span>
                          <small>{item.reading_time_minutes} min</small>
                        </Link>
                        {manifest.figures.filter(figure => figure.section === item.slug).map(figure => (
                          <Link className="book-v5-preview__illustration" key={figure.id} to={`${PREVIEW_ROOT}/${item.slug}#figure-${figure.id}`}>
                            <span>Figure {figure.number} · {figure.title}</span><ArrowRight aria-hidden="true" />
                          </Link>
                        ))}
                      </li>
                    ))}
                  </ol>
                </nav>
                </section>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
