import { Download, Eye, FilePenLine, Plus, Save, Upload } from "lucide-react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BookMarkdown from "../../attention-os/reader/BookMarkdown";
import {
  createWritingWork, emptyClaim, fetchWritingDraft, fetchWritingWorkspace, fetchWritingWorks, releaseWriting, saveWritingDraft, writingRoute,
  type WritingClaim, type WritingDraft, type WritingWork, type WritingWorkspace,
} from "../../services/OrchestratorWritingService";
import { PageHeader, PageShell } from "../../shared/PageShell";
import { PublicationSharing } from "./components/PublicationSharing";
import { WritingClaimsEditor } from "./components/WritingClaimsEditor";

const emptyDraft = (): WritingDraft => ({ title: "", summary: "", body: "" });
const field = "min-h-11 w-full rounded border border-border bg-background px-3 text-base text-foreground";

export default function WritingStudioPage() {
  const [workspace, setWorkspace] = useState<WritingWorkspace | null>(null);
  const [works, setWorks] = useState<WritingWork[]>([]);
  const [workId, setWorkId] = useState<string | null>(null);
  const [draft, setDraft] = useState<WritingDraft>(emptyDraft);
  const [saved, setSaved] = useState<WritingDraft>(emptyDraft);
  const [claims, setClaims] = useState<WritingClaim[]>([emptyClaim()]);
  const [savedClaims, setSavedClaims] = useState<WritingClaim[]>([emptyClaim()]);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [approved, setApproved] = useState(false);
  const [releaseNumber, setReleaseNumber] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved) || JSON.stringify(claims) !== JSON.stringify(savedClaims);

  useEffect(() => {
    const abort = new AbortController();
    void fetchWritingWorkspace(abort.signal).then(async (next) => {
      const entries = await fetchWritingWorks(next.id, abort.signal);
      setWorkspace(next);
      setWorks(entries.filter((entry) => entry.kind === "essay"));
    }).catch((reason: unknown) => {
      if (!abort.signal.aborted) setError(reason instanceof Error ? reason.message : "The writing workspace is unavailable.");
    });
    return () => abort.abort();
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const protect = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", protect);
    return () => window.removeEventListener("beforeunload", protect);
  }, [dirty]);

  function change(update: Partial<WritingDraft>) {
    setDraft((value) => ({ ...value, ...update }));
    setApproved(false);
    setMessage(null);
  }

  async function open(work: WritingWork | null) {
    if (dirty) { setError("Save or export the current text before opening another work."); return; }
    setBusy(true);
    setError(null);
    try {
      const content = work ? await fetchWritingDraft(work.id) : null;
      const text = content ? { title: content.title, summary: content.summary, body: content.body } : emptyDraft();
      setDraft(text);
      setSaved(text);
      setWorkId(work?.id || null);
      setClaims(content?.claims?.length ? content.claims : [emptyClaim()]);
      setSavedClaims(content?.claims?.length ? content.claims : [emptyClaim()]);
      setApproved(false);
      setReleaseNumber(null);
      setMessage(null);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The saved text could not be opened."); }
    finally { setBusy(false); }
  }

  async function save(publish: boolean) {
    if (!workspace || busy || !draft.title.trim() || !draft.body.trim()) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      let id = workId;
      if (!id) {
        const slug = draft.title.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 150) || `writing-${crypto.randomUUID()}`;
        const created = await createWritingWork(workspace.id, slug);
        id = created.id;
        setWorkId(id);
        setWorks((entries) => [...entries, created]);
      }
      if (publish) {
        const release = await releaseWriting(id, draft, claims);
        setReleaseNumber(release.release_number);
        setApproved(false);
        setMessage(`Version ${release.release_number} is published on this website.`);
      } else {
        await saveWritingDraft(id, draft, claims);
        setMessage("Text and entered claims saved as a private revision.");
      }
      setSaved({ ...draft });
      setSavedClaims(claims.map((claim) => ({ ...claim })));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The text could not be saved."); }
    finally { setBusy(false); }
  }

  async function importFile(file?: File) {
    if (!file) return;
    if (file.size > 2_000_000 || !/\.(md|txt|json)$/i.test(file.name)) { setError("Choose a Markdown, text, or draft JSON file under 2 MB."); return; }
    try {
      const text = await file.text();
      if (/\.json$/i.test(file.name)) {
        const imported = JSON.parse(text) as Record<string, unknown>;
        if (imported.schema !== "dot.writing-draft.v1" || typeof imported.title !== "string" || imported.title.length > 256 || typeof imported.summary !== "string" || imported.summary.length > 280 || typeof imported.body !== "string" || !Array.isArray(imported.claims)) throw new Error("Invalid draft.");
        const importedClaims = imported.claims as WritingClaim[];
        if (importedClaims.some((claim) => typeof claim.statement !== "string" || typeof claim.source !== "string" || !["", "Observation", "Model", "Hypothesis", "Speculation"].includes(claim.level) || !["author_originated", "sourced"].includes(claim.origin))) throw new Error("Invalid claims.");
        change({ title: imported.title, summary: imported.summary, body: imported.body });
        setClaims(importedClaims.map(({ statement, level, origin, source }) => ({ statement, level, origin, source })));
      } else change({ body: text });
    }
    catch { setError("The file could not be read. Your current text is unchanged."); }
  }

  function exportDraft() {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ schema: "dot.writing-draft.v1", ...draft, claims }, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "writing-draft.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <PageShell header={<PageHeader />}>
      <div className="mx-auto max-w-6xl">
        <p className="dot-label">Private writing workspace</p>
        <h1 className="mt-3 font-serif text-3xl">Essays, analysis, and letters</h1>
        <Link to="/studio" className="mt-3 inline-block text-sm text-muted-foreground underline">Book projects</Link>
        {error && <p role="alert" className="mt-5 break-words text-sm text-destructive">{error}</p>}
        {!workspace ? <p role="status" className="mt-8 text-sm text-muted-foreground">{error ? "The workspace could not be opened. Your text has not been published." : "Opening the workspace…"}</p> : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[14rem_minmax(0,1fr)]">
            <aside className="border-t border-border pt-4">
              <button type="button" disabled={busy} onClick={() => void open(null)} className="dot-pill"><Plus className="h-4 w-4" aria-hidden="true" />New writing</button>
              <ul className="mt-4 divide-y divide-border/60">{works.map((work) => <li key={work.id}><button type="button" disabled={busy} aria-current={workId === work.id ? "page" : undefined} onClick={() => void open(work)} className="w-full break-words py-3 text-left text-sm">{work.canonical_slug.replaceAll("-", " ")}</button></li>)}</ul>
            </aside>
            <div className="min-w-0">
              <fieldset disabled={busy}>
                <label className="block text-sm font-semibold">Title<input value={draft.title} maxLength={256} onChange={(event) => change({ title: event.target.value })} className={`${field} mt-2`} /></label>
                <label className="mt-4 block text-sm font-semibold">Summary<textarea value={draft.summary} maxLength={280} onChange={(event) => change({ summary: event.target.value })} className={`${field} mt-2 min-h-20 py-2`} /></label>
                <div className="my-5 flex flex-wrap items-center gap-3">
                  <div role="group" aria-label="Editor mode" className="inline-flex border border-border">
                    <button type="button" aria-pressed={!preview} onClick={() => setPreview(false)} className={`inline-flex min-h-10 items-center gap-2 px-3 text-sm ${!preview ? "bg-foreground text-background" : ""}`}><FilePenLine className="h-4 w-4" aria-hidden="true" />Write</button>
                    <button type="button" aria-pressed={preview} onClick={() => setPreview(true)} className={`inline-flex min-h-10 items-center gap-2 px-3 text-sm ${preview ? "bg-foreground text-background" : ""}`}><Eye className="h-4 w-4" aria-hidden="true" />Preview</button>
                  </div>
                  <label className="dot-pill cursor-pointer"><Upload className="h-4 w-4" aria-hidden="true" />Import manuscript<input aria-label="Import manuscript" type="file" accept=".md,.txt,.json" className="sr-only" onChange={(event) => { void importFile(event.target.files?.[0]); event.target.value = ""; }} /></label>
                  <button type="button" onClick={exportDraft} className="dot-pill"><Download className="h-4 w-4" aria-hidden="true" />Export draft</button>
                </div>
                {preview ? <div className="book-prose border-y border-border py-6"><BookMarkdown content={draft.body} /></div> : <label className="block text-sm font-semibold">Manuscript<textarea value={draft.body} onChange={(event) => change({ body: event.target.value })} className={`${field} mt-2 min-h-80 py-4 font-mono text-sm leading-relaxed`} /></label>}
              </fieldset>
              <div className="mt-5 flex flex-wrap items-center gap-4">
                <button type="button" disabled={busy || !draft.title.trim() || !draft.body.trim()} onClick={() => void save(false)} className="dot-reading-action inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"><Save className="h-4 w-4" aria-hidden="true" />Save private revision</button>
                <span className="text-xs text-muted-foreground">{dirty ? "Unsaved text" : "Text unchanged"}</span>
                {dirty && <AlertDialog.Root><AlertDialog.Trigger className="text-sm underline">Discard changes</AlertDialog.Trigger><AlertDialog.Portal><AlertDialog.Overlay className="fixed inset-0 z-[80] bg-background/70" /><AlertDialog.Content className="appearance-ui-panel fixed left-1/2 top-1/2 z-[81] w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded border border-border p-6"><AlertDialog.Title className="font-serif text-xl">Discard unsaved changes?</AlertDialog.Title><AlertDialog.Description className="mt-3 text-sm">The text and claims will return to the last saved revision.</AlertDialog.Description><div className="mt-5 flex flex-wrap gap-3"><AlertDialog.Cancel className="dot-pill">Keep editing</AlertDialog.Cancel><AlertDialog.Action className="dot-pill" onClick={() => { setDraft({ ...saved }); setClaims(savedClaims.map((claim) => ({ ...claim }))); setApproved(false); }}>Discard changes</AlertDialog.Action></div></AlertDialog.Content></AlertDialog.Portal></AlertDialog.Root>}
              </div>
              <WritingClaimsEditor claims={claims} onChange={(value) => { setClaims(value); setApproved(false); }} disabled={busy} />
              <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={approved} disabled={busy} onChange={(event) => setApproved(event.target.checked)} className="mt-1" />I have reviewed the text, classified its material claims, and approve public release.</label>
              <button type="button" disabled={busy || !approved || !draft.title.trim() || !draft.body.trim()} onClick={() => void save(true)} className="dot-reading-action mt-5 inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"><Upload className="h-4 w-4" aria-hidden="true" />Publish on this website</button>
              {message && <p role="status" className="mt-4 text-sm">{message}</p>}
              {workId && releaseNumber && <div className="mt-8"><Link to={writingRoute(workId, releaseNumber)} className="mb-5 inline-block text-sm underline">Read released version {releaseNumber}</Link><PublicationSharing title={draft.title} path={writingRoute(workId, releaseNumber)} /></div>}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}