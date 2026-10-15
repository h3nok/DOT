import { Download, Eye, FilePenLine, Plus, Save, Upload, ArrowRight, Check, Bold, Italic, Heading2, Link2 } from "lucide-react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AMM from "../../content/amm.json";
import ammLibrary from "../../content/amm-library.json";
import { importPublishedEssay, proposeChapterOneRevision, CHAPTER_ONE_PROPOSAL } from "./writing/importPublishedEssay";
import {
  createWritingWork, emptyClaim, emptyPresentation, fetchWritingDelivery, fetchWritingDraft, fetchWritingWorkspace, fetchWritingWorks, releaseSavedWriting, saveWritingSnapshot, writingRoute,
  type WritingClaim, type WritingDraft, type WritingWork, type WritingWorkspace,
} from "../../services/OrchestratorWritingService";
import { PageHeader, PageShell } from "../../shared/PageShell";
import { WritingDistribution } from "./components/WritingDistribution";
import { WritingClaimsEditor } from "./components/WritingClaimsEditor";
import { MarkdownManuscriptEditor, type MarkdownManuscriptEditorHandle } from "./components/MarkdownManuscriptEditor";
import { insertMarkdownBlock, prefixMarkdownLines, wrapMarkdownSelection, type MarkdownEdit } from "./components/markdownEditing";
import { importManuscript, exportManuscript, downloadText, writingSlug } from "./writing/manuscriptFile";
import { writingReadiness } from "./writing/manuscriptMedia";
import { WritingPost } from "./writing/WritingPost";
import { WritingArtwork } from "./writing/WritingArtwork";
import "./writing/writing-desk.css";

const emptyDraft = (): WritingDraft => ({ title: "", summary: "", body: "", presentation: emptyPresentation(), assets: [] });
const steps = [{ label: "Import", icon: Upload }, { label: "Edit", icon: FilePenLine }, { label: "Preview", icon: Eye }, { label: "Publish", icon: ArrowRight }];
const signature = (draft: WritingDraft, claims: WritingClaim[]) => JSON.stringify({ draft, claims });

export default function WritingStudioPage() {
  const [search] = useSearchParams();
  const initialDraft = (): WritingDraft => ({ ...emptyDraft(), presentation: { ...emptyPresentation(), ...(search.get("series") === "amm" ? { series: AMM.series, format: "letter" as const } : {}) } });
  const [workspace, setWorkspace] = useState<WritingWorkspace | null>(null);
  const [works, setWorks] = useState<WritingWork[]>([]);
  const [workId, setWorkId] = useState<string | null>(null);
  const [slug, setSlug] = useState("");
  const [draft, setDraft] = useState<WritingDraft>(initialDraft);
  const [saved, setSaved] = useState<WritingDraft>(initialDraft);
  const [claims, setClaims] = useState<WritingClaim[]>([emptyClaim()]);
  const [savedClaims, setSavedClaims] = useState<WritingClaim[]>([emptyClaim()]);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [approved, setApproved] = useState(false);
  const [reviewed, setReviewed] = useState("");
  const [releaseNumber, setReleaseNumber] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState<(() => void) | null>(null);
  const editor = useRef<MarkdownManuscriptEditorHandle>(null);
  const blobUrls = useRef(new Set<string>());
  const saveAttempt = useRef<{ signature: string; id: string } | null>(null);
  const sourceOpened = useRef(false);
  const currentSignature = signature(draft, claims);
  const dirty = currentSignature !== signature(saved, savedClaims);
  const issues = writingReadiness(draft, claims);
  const presentation = draft.presentation ?? emptyPresentation();
  const canSave = !!workspace && !busy && !!draft.title.trim() && !!draft.body.trim() && (dirty || !saved.revisionId);
  const canPublish = !busy && !dirty && !!saved.revisionId && !issues.length && approved && reviewed === currentSignature;

  useEffect(() => {
    const abort = new AbortController();
    void fetchWritingWorkspace(abort.signal).then(async next => {
      const entries = await fetchWritingWorks(next.id, abort.signal);
      if (!abort.signal.aborted) { setWorkspace(next); setWorks(entries.filter(entry => entry.kind === "essay")); }
    }).catch((reason: unknown) => { if (!abort.signal.aborted) setError(reason instanceof Error ? reason.message : "The writing workspace is unavailable."); });
    return () => abort.abort();
  }, []);
  const openSourceRef = useRef<(slug: string) => Promise<void>>(async () => {});
  useEffect(() => {
    const source = search.get("source");
    if (workspace && source && !sourceOpened.current && ammLibrary.some(item => item.slug === source)) {
      sourceOpened.current = true;
      void openSourceRef.current(source);
    }
  }, [workspace, search]);
  useEffect(() => {
    const urls = blobUrls.current;
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const protect = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    const protectLink = (event: MouseEvent) => {
      const link = (event.target as Element).closest?.("a[href]");
      if (!link || link.getAttribute("href")?.startsWith("#") || link.hasAttribute("download") || link.getAttribute("target") === "_blank" || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (!window.confirm("Leave with unsaved changes? Save privately or download your Markdown to keep them.")) { event.preventDefault(); event.stopPropagation(); }
    };
    window.addEventListener("beforeunload", protect);
    document.addEventListener("click", protectLink, true);
    return () => { window.removeEventListener("beforeunload", protect); document.removeEventListener("click", protectLink, true); };
  }, [dirty]);

  function change(update: Partial<WritingDraft>) { setDraft(value => ({ ...value, ...update })); setApproved(false); setMessage(null); }
  function go(next: number) { setStep(next); if (next === 2) setReviewed(currentSignature); }
  function guard(action: () => void) { if (dirty) setPending(() => action); else action(); }
  function exportDraft() { downloadText(exportManuscript(draft, claims, slug || writingSlug(draft.title) || undefined), `${slug || writingSlug(draft.title) || "writing-draft"}.md`); }
  async function open(work: WritingWork | null) {
    setBusy(true); setError(null);
    try {
      const content = work ? await fetchWritingDraft(work.id) : null;
      const published = work ? await fetchWritingDelivery(work.id).catch(() => null) : null;
      const { claims: declared, ...text } = content ?? initialDraft();
      const next = { ...emptyDraft(), ...text };
      const nextClaims = declared?.length ? declared : [emptyClaim()];
      setDraft(next); setSaved(next); setClaims(nextClaims); setSavedClaims(nextClaims);
      setWorkId(work?.id ?? null); setSlug(work?.canonical_slug ?? ""); setApproved(false); setReviewed("");
      setReleaseNumber(published?.delivery.manifest?.release.number ?? null); setMessage(null); setStep(work ? 1 : 0); saveAttempt.current = null;
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The saved text could not be opened."); }
    finally { setBusy(false); }
  }
  async function save() {
    if (!canSave) return;
    setBusy(true); setError(null); setMessage(null);
    try {
      let id = workId;
      if (!id) {
        const canonical = slug || writingSlug(draft.title) || `writing-${crypto.randomUUID()}`;
        const created = await createWritingWork(workspace!.id, canonical);
        id = created.id; setWorkId(id); setSlug(canonical); setWorks(entries => [...entries, created]);
      }
      const attemptSignature = JSON.stringify({ id, currentSignature, base: saved.revisionId ?? null });
      if (saveAttempt.current?.signature !== attemptSignature) saveAttempt.current = { signature: attemptSignature, id: crypto.randomUUID() };
      const revision = await saveWritingSnapshot(id, draft, claims, saveAttempt.current.id, saved.revisionId ?? null);
      const next = { ...draft, revisionId: revision.id, revisionNumber: revision.revision_number,
        assets: draft.assets?.map(({ data_base64: _upload, ...asset }) => ({ ...asset, source_revision_id: revision.id })),
      };
      setDraft(next); setSaved(next); setSavedClaims(claims.map(claim => ({ ...claim }))); setApproved(false);
      setMessage(`Revision ${revision.revision_number} saved privately. Text, settings, images and claim notes are together.`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The draft could not be saved. Your changes remain here."); }
    finally { setBusy(false); }
  }
  async function openSource(source: string) {
    const existing = works.find(work => work.canonical_slug === source);
    setBusy(true); setError(null);
    try {
      if (existing && await fetchWritingDraft(existing.id)) { await open(existing); return; }
      const next = await importPublishedEssay(source);
      setDraft(next); setSaved(emptyDraft()); setClaims([emptyClaim()]); setSavedClaims([emptyClaim()]);
      setWorkId(existing?.id ?? null); setSlug(source); setReleaseNumber(null); setApproved(false); setReviewed(""); setStep(1);
      setMessage("Original text and artwork opened. Save privately to begin editing; publishing will update the existing reading address.");
      saveAttempt.current = null;
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The source could not be opened."); }
    finally { setBusy(false); }
  }
  openSourceRef.current = openSource;
  const saveRef = useRef(save); saveRef.current = save;
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") { event.preventDefault(); void saveRef.current(); } };
    window.addEventListener("keydown", shortcut); return () => window.removeEventListener("keydown", shortcut);
  }, []);
  async function publish() {
    if (!canPublish || !workId || !saved.revisionId) return;
    setBusy(true); setError(null);
    try { const release = await releaseSavedWriting(workId, saved.revisionId); setReleaseNumber(release.release_number); setApproved(false); setMessage(`Version ${release.release_number} is published on this website.`); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Publication could not be confirmed. Your private revision is saved; retrying will not duplicate the release."); }
    finally { setBusy(false); }
  }
  async function importFile(file?: File) {
    if (!file) return;
    try {
      if (file.size > 2_000_000 || !/\.(md|markdown|txt|json)$/i.test(file.name)) throw new Error("Choose a Markdown, text or draft backup file under 2 MB.");
      const imported = importManuscript(await file.text(), file.name);
      guard(() => {
        if (workId) {
          setDraft({ ...imported.draft, assets: draft.assets, revisionId: saved.revisionId, revisionNumber: saved.revisionNumber });
        } else {
          setSlug(imported.slug); setDraft(imported.draft); setSaved(emptyDraft()); setSavedClaims([emptyClaim()]); setReleaseNumber(null);
        }
        setClaims(imported.claims.length ? imported.claims : [emptyClaim()]);
        setApproved(false); setReviewed(""); setError(null);
        setMessage(workId ? "Revised manuscript imported into this draft. Its published versions stay intact." : "Manuscript imported. Add its images, then save your private draft."); setStep(1);
      });
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The file could not be read. Your text is unchanged."); }
  }
  function edit(transform: (start: number, end: number) => MarkdownEdit) {
    const selection = editor.current?.getSelection() ?? { start: draft.body.length, end: draft.body.length };
    const result = transform(selection.start, selection.end); change({ body: result.value });
    requestAnimationFrame(() => editor.current?.setSelection(result.selectionStart, result.selectionEnd));
  }
  function insert(markdown: string) { edit((start, end) => insertMarkdownBlock(draft.body, start, end, markdown)); }

  return <PageShell wide header={<PageHeader />}>
    <div className="writing-desk">
      <header className="writing-desk-header"><div><p className="dot-label">Private workspace</p><h1>Writing studio</h1><p>Your manuscript. Your images. A considered publication.</p></div><div className="writing-actions"><Link to="/blog">Public blog</Link><Link to="/studio/newsletter">AMM newsletter</Link><Link to="/studio">Book projects</Link></div></header>
      {import.meta.env.DEV && <p className="writing-environment">Development preview · drafts and publication use the API configured for this preview.</p>}
      {error && <p role="alert" className="writing-error">{error}</p>}
      {!workspace ? <p role="status">{error ? "The workspace could not be opened. Reload after signing in to retry." : "Opening your workspace…"}</p> : <div className="writing-desk-layout">
        <aside className="writing-library"><details open><summary>Your writing</summary><button type="button" className="dot-pill" disabled={busy} onClick={() => guard(() => void open(null))}><Plus aria-hidden="true" />New writing</button>
          {!works.length && <p className="writing-hint">Your saved drafts will appear here.</p>}
          <ul>{works.map(work => <li key={work.id}><button type="button" disabled={busy} aria-current={workId === work.id ? "page" : undefined} onClick={() => guard(() => void open(work))}>{work.canonical_slug.replaceAll("-", " ")}<span>{work.lifecycle_state === "released" ? "Published" : "Saved work"}</span></button></li>)}</ul>
        </details><details className="writing-source-library" open={search.get("series") === "amm" || !!search.get("source")}><summary>AMM manuscripts</summary><p className="writing-hint">Open the existing work to revise it. Published versions stay intact.</p><ul>{ammLibrary.map(item => <li key={item.slug}><button type="button" disabled={busy} onClick={() => guard(() => void openSource(item.slug))}>{item.title}<span>{works.some(work => work.canonical_slug === item.slug) ? "Open saved work" : item.revision ? "Original · revision requested" : "Open source manuscript"}</span></button></li>)}</ul></details></aside>
        <div className="writing-workbench" aria-busy={busy}>
          <nav className="writing-pipeline" aria-label="Publishing steps">{steps.map(({ label, icon: Icon }, index) => <button type="button" key={label} disabled={busy} aria-label={`${index + 1}. ${label}`} aria-current={step === index ? "step" : undefined} onClick={() => go(index)}><span className="writing-step-icon"><Icon aria-hidden="true" /></span><span><small>0{index + 1}</small>{label}</span></button>)}</nav>
          <div className="writing-step-content">
            {step === 0 && <section className="writing-import"><Upload aria-hidden="true" /><h2>{workId ? "Bring in a revised manuscript." : "Start with your Markdown."}</h2><p>{workId ? `Replace the text and settings for “${saved.title}”. Its attached images and published versions are kept. Choose New writing to start a separate post.` : "Bring a .md file, add its images, and keep editing here. Title and settings in the file become editable fields."}</p><div className="writing-actions"><label className="dot-reading-action writing-primary">Import manuscript<input aria-label="Import manuscript" type="file" accept=".md,.markdown,.txt,.json" disabled={busy} className="sr-only" onChange={event => { void importFile(event.target.files?.[0]); event.target.value = ""; }} /></label><button type="button" className="dot-pill" onClick={() => go(1)}>Write a blank draft</button></div><button type="button" className="writing-text-button" onClick={() => downloadText(exportManuscript(initialDraft(), [emptyClaim()]), "writing-template.md")}>Download Markdown template</button><p className="writing-hint">Imported files stay private until you save, review and approve a release. Add image files separately in Edit.</p></section>}
            {step === 1 && <div>
              {slug === "amm-chapter-one-the-leech" && <details className="writing-revision-brief"><summary>Chapter One · editorial revision</summary><p>Your direction: examine Western imperial history, white supremacy as an institutional ideology, and private power operating beyond the state. Preserve the original as an earlier edition.</p><blockquote>{CHAPTER_ONE_PROPOSAL}</blockquote><p>This proposed replacement changes two framing passages only. Review the rest of the chapter and its historical claims before releasing a new version.</p><button type="button" className="dot-pill" disabled={busy} onClick={() => { try { change({ body: proposeChapterOneRevision(draft.body) }); setMessage("Two framing passages revised in this private draft. Review the full chapter and claim notes before publication."); } catch (reason) { setError(reason instanceof Error ? reason.message : "Edit the current text directly."); } }}>Apply proposed framing to this draft</button></details>}
              <fieldset disabled={busy} className="writing-fields"><label>Title<input value={draft.title} maxLength={256} onChange={event => change({ title: event.target.value })} /></label><label>Summary <span>(optional · 280 characters)</span><textarea value={draft.summary} maxLength={280} rows={3} onChange={event => change({ summary: event.target.value })} /></label>
                <div className="writing-field-row"><label>Format<select value={presentation.format} onChange={event => change({ presentation: { ...presentation, format: event.target.value as typeof presentation.format } })}><option value="essay">Essay</option><option value="case-study">Case study</option><option value="letter">Letter</option></select></label><label>Series <span>(optional)</span><input list="writing-series" value={presentation.series} maxLength={100} onChange={event => change({ presentation: { ...presentation, series: event.target.value } })} /><datalist id="writing-series"><option value={AMM.series} /></datalist></label></div>
                {!workId && <label>Draft identifier<input value={slug} placeholder={writingSlug(draft.title) || "my-new-piece"} maxLength={150} onChange={event => setSlug(writingSlug(event.target.value))} /><span>Used to find this piece in your workspace.</span></label>}
              </fieldset>
              <div className="writing-manuscript" inert={busy || undefined}><div className="writing-format-tools" role="group" aria-label="Manuscript formatting">
                <span>Manuscript</span><button type="button" aria-label="Heading" onClick={() => edit((start, end) => prefixMarkdownLines(draft.body, start, end, "## ", "Heading"))}><Heading2 /></button><button type="button" aria-label="Bold" onClick={() => edit((start, end) => wrapMarkdownSelection(draft.body, start, end, "**", "**", "text"))}><Bold /></button><button type="button" aria-label="Italic" onClick={() => edit((start, end) => wrapMarkdownSelection(draft.body, start, end, "*", "*", "text"))}><Italic /></button><button type="button" aria-label="Link" onClick={() => edit((start, end) => wrapMarkdownSelection(draft.body, start, end, "[", "](https://)", "link text"))}><Link2 /></button>
              </div><div className="writing-editor"><MarkdownManuscriptEditor ref={editor} value={draft.body} ariaLabel="Manuscript" onChange={body => change({ body })} /></div></div>
              <WritingArtwork draft={draft} disabled={busy} onChange={change} onInsert={insert} onError={setError} onImport={urls => urls.forEach(url => blobUrls.current.add(url))} onBusy={setBusy} />
              <WritingClaimsEditor claims={claims} onChange={value => { setClaims(value); setApproved(false); setMessage(null); }} disabled={busy} />
              <p className="writing-hint">Claim notes may be incomplete in a private draft. Finish them before publishing.</p>
            </div>}
            {step === 2 && <section aria-label="Publication preview"><div className="writing-preview-note"><Eye aria-hidden="true" /><p>Private preview · this is how your post reads, including its banner and inline images.</p></div><WritingPost draft={draft} edition="Private draft" /></section>}
            {step === 3 && <section className="writing-publish"><p className="dot-label">A deliberate release</p><h2>Ready for readers?</h2><p>Publish the saved version to your blog. Later edits stay private until you publish another version.</p>
              <ul className="writing-checklist"><li><Check aria-hidden="true" />{saved.revisionId && !dirty ? `Revision ${saved.revisionNumber} saved privately` : "Save your current changes before publishing"}</li><li><Eye aria-hidden="true" />{reviewed === currentSignature ? "Current version opened in Preview" : "Open Preview to review this version"}</li></ul>
              {issues.length > 0 && <div className="writing-readiness"><h3>Before publication</h3><ul>{issues.map(issue => <li key={issue}>{issue}</li>)}</ul><button type="button" className="writing-text-button" onClick={() => go(1)}>Return to Edit</button></div>}
              <label className="writing-approval"><input type="checkbox" checked={approved} disabled={busy || dirty || !saved.revisionId || !!issues.length || reviewed !== currentSignature} onChange={event => setApproved(event.target.checked)} />I have reviewed this saved version and its material claims, and approve public release.</label>
              <button type="button" className="dot-reading-action writing-primary" disabled={!canPublish} onClick={() => void publish()}><Upload aria-hidden="true" />Publish on this website</button>
              <p className="writing-hint">The blog and reader update immediately. Search previews, RSS and the sitemap refresh with the next site build. Publishing here sends no email or social post.</p>
            </section>}
          </div>
          <div className="writing-save-bar"><div className="writing-save-state"><span className="writing-state-dot" data-dirty={dirty || undefined} /><span>{busy ? "Working…" : dirty ? "Unsaved changes" : saved.revisionId ? `Saved · revision ${saved.revisionNumber}` : "Private draft"}</span></div><div className="writing-actions"><button type="button" className="dot-pill" disabled={busy} onClick={exportDraft}><Download aria-hidden="true" />Download .md</button><button type="button" className="dot-reading-action writing-primary" disabled={!canSave} onClick={() => void save()}><Save aria-hidden="true" />Save private revision</button>{step > 0 && step < 3 && <button type="button" className="dot-pill" disabled={busy} onClick={() => go(step + 1)}>{steps[step + 1].label}<ArrowRight aria-hidden="true" /></button>}</div></div>
          {dirty && <button type="button" disabled={busy} className="writing-text-button mt-4" onClick={() => setPending(() => () => { setDraft(saved); setClaims(savedClaims); setApproved(false); setMessage(null); })}>Discard unsaved changes</button>}
          {message && <p role="status" className="writing-message">{message}</p>}
          {workId && releaseNumber && <section className="writing-release"><Link to={writingRoute(workId, releaseNumber)} target="_blank" rel="noreferrer">Read released version {releaseNumber} ↗</Link><WritingDistribution workId={workId} number={releaseNumber} automaticResult={null} /></section>}
        </div>
      </div>}
      <AlertDialog.Root open={!!pending} onOpenChange={open => { if (!open) setPending(null); }}><AlertDialog.Portal><AlertDialog.Overlay className="fixed inset-0 z-[80] bg-background/80" /><AlertDialog.Content className="appearance-ui-panel fixed left-1/2 top-1/2 z-[81] w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded border border-border p-6"><AlertDialog.Title className="font-serif text-xl">Leave these unsaved changes?</AlertDialog.Title><AlertDialog.Description className="mt-3 text-sm">Save privately or download your Markdown before replacing this draft. Download attached images separately if you need a local copy.</AlertDialog.Description><div className="writing-actions mt-5"><AlertDialog.Cancel className="dot-pill">Keep editing</AlertDialog.Cancel><button type="button" className="dot-pill" onClick={exportDraft}>Download .md</button><AlertDialog.Action className="dot-pill" onClick={() => { pending?.(); setPending(null); }}>Discard and continue</AlertDialog.Action></div></AlertDialog.Content></AlertDialog.Portal></AlertDialog.Root>
    </div>
  </PageShell>;
}
