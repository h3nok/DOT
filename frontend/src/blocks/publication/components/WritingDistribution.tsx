import { useEffect, useState } from "react";
import { fetchWritingDelivery } from "../../../services/OrchestratorWritingService";
import { fetchDistributionCopies, recordDistributionCopy, shareReleasedWritingOnLinkedIn, type DistributionCopy, type DistributionPlatform } from "../../../services/OrchestratorDistributionService";
import { PublicationSharing } from "./PublicationSharing";
import { writingExport } from "./writingExport";

const platforms: { id: DistributionPlatform; label: string; editor: string; note: string }[] = [
  { id: "linkedin", label: "LinkedIn", editor: "https://www.linkedin.com/article/new/", note: "Share the native link, or paste the full piece into a LinkedIn article or newsletter draft." },
  { id: "substack", label: "Substack", editor: "https://substack.com/home", note: "Open your publication dashboard and choose New post. Paste the complete formatted piece, then choose separately whether to send it to Substack subscribers." },
  { id: "medium", label: "Medium", editor: "https://medium.com/p/import", note: "Import the original URL in Medium to retain its source and canonical link, or paste the complete formatted piece. For a new release, allow up to 15 minutes for the site's importable HTML to rebuild." },
];

export function WritingDistribution({ workId, number, automaticResult }: { workId: string; number: number; automaticResult?: DistributionCopy | null }) {
  const [piece, setPiece] = useState<ReturnType<typeof writingExport> | null>(null);
  const [copies, setCopies] = useState<DistributionCopy[]>([]);
  const [platform, setPlatform] = useState<DistributionPlatform>("substack");
  const [externalUrl, setExternalUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    setPiece(null); setError(null); setMessage(null); setCopies([]);
    void fetchWritingDelivery(workId, number, abort.signal).then((source) => {
      if (!abort.signal.aborted) setPiece(writingExport(workId, number, source));
    }).catch(() => { if (!abort.signal.aborted) setError("The published text could not be loaded for distribution. Your publication is still available at its own link."); });
    void fetchDistributionCopies(workId, number, abort.signal).then((entries) => {
      if (!abort.signal.aborted) setCopies(entries);
    }).catch(() => { /* Full-text export remains available without copy records. */ });
    return () => abort.abort();
  }, [workId, number, attempt]);

  function remember(copy: DistributionCopy) {
    setCopies((entries) => [...entries.filter((entry) => entry.platform !== copy.platform), copy]);
  }
  useEffect(() => { if (automaticResult) remember(automaticResult); }, [automaticResult]);

  async function copy() {
    if (!piece) return;
    try {
      if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        await navigator.clipboard.write([new ClipboardItem({ "text/html": new Blob([piece.html], { type: "text/html" }), "text/plain": new Blob([piece.text], { type: "text/plain" }) })]);
        setMessage("Complete formatted piece copied. Paste it into the external editor and review before publishing.");
      } else {
        await navigator.clipboard.writeText(piece.text);
        setMessage("Complete piece copied as plain text. Review formatting in the external editor.");
      }
    } catch { setMessage("Clipboard unavailable. Download the complete piece below, or select the text in the export preview."); }
  }
  function download(format: "html" | "md") {
    if (!piece) return;
    const url = URL.createObjectURL(new Blob([format === "html" ? piece.document : piece.markdown], { type: format === "html" ? "text/html;charset=utf-8" : "text/markdown;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `writing-version-${number}.${format}`; anchor.click(); URL.revokeObjectURL(url);
  }
  async function share() {
    setBusy(true); setError(null);
    try { remember(await shareReleasedWritingOnLinkedIn(workId, number)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "The LinkedIn result could not be confirmed. Check your account before trying again."); }
    finally { setBusy(false); }
  }
  async function record() {
    setBusy(true); setError(null);
    try { remember(await recordDistributionCopy(workId, number, platform, externalUrl.trim())); setMessage("Published copy link saved for this version."); setExternalUrl(""); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "The external link could not be saved."); }
    finally { setBusy(false); }
  }
  const selected = platforms.find((entry) => entry.id === platform)!;
  const linkedin = copies.find((entry) => entry.platform === "linkedin") ?? automaticResult;

  return <section aria-label={`Distribute published version ${number}`} className="mt-8 space-y-5">
    <PublicationSharing title={piece?.title ?? "Published writing"} path={`/writing/${encodeURIComponent(workId)}/releases/${number}`} />
    <div className="border-t border-border pt-5">
      <h2 className="font-serif text-xl">Distribute published version {number}</h2>
      <p className="mt-2 text-sm text-muted-foreground">These copies use the published version. Editing your draft does not change them.</p>
      {linkedin?.status === "published" && <p role="status" className="mt-3 text-sm">Shared on LinkedIn. <a href={linkedin.external_url!} target="_blank" rel="noopener noreferrer" className="underline">Open post</a></p>}
      {linkedin?.status === "recorded" && <p className="mt-3 text-sm">LinkedIn copy recorded. <a href={linkedin.external_url!} className="underline">Open copy</a></p>}
      {linkedin?.status === "failed" && <p role="status" className="mt-3 text-sm">The piece is published here. LinkedIn rejected the share; check the connection before retrying.</p>}
      {(linkedin?.status === "needs_review" || linkedin?.status === "sending") && <p role="status" className="mt-3 text-sm">The piece is published here. Check LinkedIn before sharing again; the external result has not been confirmed. If it appeared, save its link below.</p>}
      {error && <p role="alert" className="mt-3 text-sm">{error} {!piece && <button type="button" onClick={() => setAttempt((value) => value + 1)} className="underline">Try again</button>}</p>}
      {!piece ? !error && <p role="status" className="mt-4 text-sm">Preparing the published text…</p> : <>
        <nav aria-label="External publishing platforms" className="mt-5 flex flex-wrap gap-2">{platforms.map((entry) => <button key={entry.id} type="button" aria-pressed={platform === entry.id} aria-current={platform === entry.id ? "page" : undefined} onClick={() => { setPlatform(entry.id); setExternalUrl(""); setMessage(null); }} className={`dot-pill ${platform === entry.id ? "ring-2 ring-[color:var(--organism-accent-strong)] font-semibold" : ""}`}>{entry.label}</button>)}</nav>
        <p className="mt-4 text-sm text-muted-foreground">{selected.note}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={() => void copy()} className="dot-pill">Copy complete piece</button>
          <a href={selected.editor} target="_blank" rel="noopener noreferrer" className="dot-pill">Open {selected.label} {platform === "substack" ? "dashboard" : "editor"}</a>
          {platform === "linkedin" && (!linkedin || linkedin.status === "failed") && <button type="button" disabled={busy} onClick={() => void share()} className="dot-pill">Share released link on LinkedIn</button>}
        </div>
        <details className="mt-4"><summary className="min-h-11 cursor-pointer py-3 text-sm">Export and inspect the complete piece</summary><div className="mt-2 flex flex-wrap gap-3"><button type="button" onClick={() => download("html")} className="dot-pill">Download HTML</button><button type="button" onClick={() => download("md")} className="dot-pill">Download Markdown</button></div><label className="mt-4 block text-sm">Complete published text<textarea readOnly value={piece.markdown} className="mt-2 min-h-64 w-full border border-border bg-background p-3 font-mono text-sm" /></label></details>
        <form onSubmit={(event) => { event.preventDefault(); void record(); }} className="mt-5 border-t border-border pt-5"><label className="block text-sm">Published {selected.label} copy URL<input type="url" required value={externalUrl} maxLength={2048} onChange={(event) => setExternalUrl(event.target.value)} placeholder="https://…" className="mt-2 min-h-11 w-full rounded border border-border bg-background px-3 text-base" /></label><button type="submit" disabled={busy || !externalUrl.trim()} className="dot-pill mt-3">Save published copy link</button></form>
        {copies.filter((copy) => copy.platform !== "linkedin" && copy.external_url).map((copy) => <p key={copy.platform} className="mt-3 text-sm">{platforms.find((entry) => entry.id === copy.platform)?.label} copy recorded: <a href={copy.external_url!} target="_blank" rel="noopener noreferrer" className="break-all underline">Open copy</a></p>)}
      </>}
      {message && <p role="status" className="mt-3 text-sm">{message}</p>}
    </div>
  </section>;
}
