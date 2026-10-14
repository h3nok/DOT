import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { WritingPost } from "./writing/WritingPost";
import { author } from "../../content/author";
import { fetchWritingDelivery, writingRoute } from "../../services/OrchestratorWritingService";
import { PageHeader, PageShell } from "../../shared/PageShell";
import { SiteColophon } from "../../shared/SiteColophon";
import { PublicationSharing } from "./components/PublicationSharing";

export default function NativeWritingPage() {
  const { workId = "", releaseNumber } = useParams();
  const [search] = useSearchParams();
  const requested = releaseNumber || search.get("version");
  const version = requested && /^[1-9]\d*$/.test(requested) ? Number(requested) : undefined;
  const [content, setContent] = useState<Awaited<ReturnType<typeof fetchWritingDelivery>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    setContent(null);
    setError(null);
    if (requested && !version) { setError("The release version is invalid."); return; }
    void fetchWritingDelivery(workId, version, abort.signal).then((result) => {
      if (!abort.signal.aborted) setContent(result);
    }).catch((reason: unknown) => {
      if (!abort.signal.aborted) setError(reason instanceof Error ? reason.message : "The publication could not be opened.");
    });
    return () => abort.abort();
  }, [workId, version, requested, attempt]);
  const manifest = content?.delivery.manifest;
  const cover = manifest?.assets?.find(asset => asset.path === manifest.presentation?.cover?.path);
  const canonical = `${import.meta.env.VITE_SITE_URL || "https://dotheory.org"}${writingRoute(workId, version)}`;
  return (
    <PageShell header={<PageHeader backTo="/blog" backLabel="Blog" />} footer={<SiteColophon />}>
      <div className="book-surface mx-auto max-w-6xl">
        <Helmet><title>{manifest?.title || content?.delivery.title || "Writing"} — {author.name}</title><link rel="canonical" href={canonical} />{manifest?.summary && <meta name="description" content={manifest.summary} />}{cover && <meta property="og:image" content={new URL(cover.src, window.location.origin).href} />}{cover && <meta property="og:image:alt" content={manifest?.presentation?.cover?.alt ?? ""} />}<meta name="twitter:card" content={cover ? "summary_large_image" : "summary"} /></Helmet>
        {error ? <>
            <h1 className="font-serif text-3xl">This piece could not be opened</h1>
            <p role="alert" className="mt-5 text-base text-muted-foreground">
              {requested && !version ? "The release version is invalid."
                : /not found|404/i.test(error) ? "There is no published piece at this address."
                : "This piece could not be loaded. Please try again."}
            </p>
            {!(requested && !version) && !/not found|404/i.test(error) && (
              <button type="button" onClick={() => setAttempt((value) => value + 1)} className="mt-4 min-h-11 text-sm underline underline-offset-4">Try again</button>
            )}
          </>
          : !content ? <p role="status">Loading the publication…</p>
          : content.delivery.withdrawn ? <><h1 className="font-serif text-3xl">{content.delivery.title}</h1><p className="mt-5">This release has been withdrawn.</p><p className="mt-3">{content.delivery.reason}</p></>
          : manifest && <WritingPost draft={{ title: manifest.title, summary: manifest.summary ?? "", body: content.body, presentation: manifest.presentation, assets: manifest.assets }} edition={`Version ${manifest.release.number}`}>
            <p className="dot-label mt-10">End of piece</p>
            <section className="mt-10 border-t border-border py-6" aria-label="Claim ledger">
              <h2 className="text-lg font-semibold">Claim ledger</h2>
              <ul className="mt-4 space-y-4">{manifest.claims.map((claim, index) => <li key={index}><p className="text-sm">{claim.statement}</p><p className="mt-1 text-xs text-muted-foreground">{claim.epistemic_level} · {claim.origin === "sourced" ? "Sourced" : claim.origin === "no_external_source" ? "No external source" : "Author-originated"}</p></li>)}</ul>
            </section>
            {!!manifest.sources?.length && <section aria-label="Sources" className="border-t border-border py-6"><h2 className="text-lg font-semibold">Sources</h2><ul className="mt-3 space-y-3 text-sm">{manifest.sources.map((source, index) => <li key={index} className="break-words">{/^https?:\/\//i.test(source.external_uri) ? <a href={source.external_uri} rel="noreferrer" className="underline">{source.external_uri}</a> : source.external_uri}{source.locator && <p className="mt-1 text-xs text-muted-foreground">{source.locator}</p>}</li>)}</ul></section>}
            <PublicationSharing title={manifest.title} path={writingRoute(workId, manifest.release.number)} />
          </WritingPost>}
        <Link to="/blog" className="mt-8 inline-block text-sm underline underline-offset-4">All writing</Link>
      </div>
    </PageShell>
  );
}
