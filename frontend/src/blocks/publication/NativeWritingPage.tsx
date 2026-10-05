import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import BookMarkdown from "../../attention-os/reader/BookMarkdown";
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
  useEffect(() => {
    const abort = new AbortController();
    setContent(null);
    setError(null);
    if (requested && !version) { setError("The release version is invalid."); return; }
    void fetchWritingDelivery(workId, version, abort.signal).then(setContent).catch((reason: unknown) => {
      if (!abort.signal.aborted) setError(reason instanceof Error ? reason.message : "The publication could not be opened.");
    });
    return () => abort.abort();
  }, [workId, version, requested]);
  const manifest = content?.delivery.manifest;
  const canonical = `${import.meta.env.VITE_SITE_URL || "https://dotheory.org"}${writingRoute(workId, version)}`;
  return (
    <PageShell header={<PageHeader />} footer={<SiteColophon />}>
      <div className="mx-auto max-w-3xl">
        <Helmet><title>{manifest?.title || content?.delivery.title || "Writing"} — {author.name}</title><link rel="canonical" href={canonical} />{manifest?.summary && <meta name="description" content={manifest.summary} />}</Helmet>
        {error ? <p role="alert" className="break-words text-sm">{error}</p>
          : !content ? <p role="status">Loading the publication…</p>
          : content.delivery.withdrawn ? <><h1 className="font-serif text-3xl">{content.delivery.title}</h1><p className="mt-5">This release has been withdrawn.</p><p className="mt-3">{content.delivery.reason}</p></>
          : manifest && <>
            <p className="dot-label">Writing · Version {manifest.release.number} · {author.name}</p>
            <h1 className="mt-4 break-words font-serif text-3xl leading-tight">{manifest.title}</h1>
            {manifest.summary && <p className="mt-5 text-base text-muted-foreground">{manifest.summary}</p>}
            <div className="book-prose mt-10"><BookMarkdown content={content.body} /></div>
            <section className="mt-10 border-t border-border py-6" aria-label="Claim ledger">
              <h2 className="text-lg font-semibold">Claim ledger</h2>
              <ul className="mt-4 space-y-4">{manifest.claims.map((claim, index) => <li key={index}><p className="text-sm">{claim.statement}</p><p className="mt-1 text-xs text-muted-foreground">{claim.epistemic_level} · {claim.origin === "sourced" ? "Sourced" : "Author-originated"}</p></li>)}</ul>
            </section>
            {!!manifest.sources?.length && <section aria-label="Sources" className="border-t border-border py-6"><h2 className="text-lg font-semibold">Sources</h2><ul className="mt-3 space-y-3 text-sm">{manifest.sources.map((source, index) => <li key={index} className="break-words">{/^https?:\/\//i.test(source.external_uri) ? <a href={source.external_uri} rel="noreferrer" className="underline">{source.external_uri}</a> : source.external_uri}{source.locator && <p className="mt-1 text-xs text-muted-foreground">{source.locator}</p>}</li>)}</ul></section>}
            <PublicationSharing title={manifest.title} path={writingRoute(workId, manifest.release.number)} />
          </>}
        <Link to="/publications" className="mt-8 inline-block text-sm underline underline-offset-4">All publications</Link>
      </div>
    </PageShell>
  );
}