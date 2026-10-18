import { useState } from "react";
import { Download, ImagePlus, Trash2 } from "lucide-react";
import { emptyPresentation, type WritingDraft } from "../../../services/OrchestratorWritingService";
import { importArtwork } from "./manuscriptMedia";

export function WritingArtwork({ draft, disabled, onChange, onInsert, onError, onImport, onBusy }: {
  draft: WritingDraft; disabled: boolean; onChange: (draft: Partial<WritingDraft>) => void;
  onInsert: (markdown: string) => void; onError: (message: string) => void; onImport: (urls: string[]) => void; onBusy: (busy: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});
  const presentation = draft.presentation ?? emptyPresentation();
  const cover = presentation.cover;
  async function add(files: File[]) {
    if (!files.length) return;
    setLoading(true); onBusy(true);
    try { const assets = await importArtwork(files, draft); onImport(assets.map(asset => asset.src)); onChange({ assets: [...(draft.assets ?? []), ...assets] }); }
    catch (error) { onError(error instanceof Error ? error.message : "The images could not be attached."); }
    finally { setLoading(false); onBusy(false); }
  }
  async function download(src: string, path: string) {
    try {
      const response = await fetch(src, { credentials: "include" });
      if (!response.ok) throw new Error();
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a"); link.href = url; link.download = path.split("/").at(-1) ?? path; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { onError("This image could not be downloaded. Your saved artwork is unchanged."); }
  }
  return <section className="writing-artwork" aria-label="Post images">
    <div className="writing-section-heading"><div><h2>Images</h2><p>Banner and inline artwork. PNG, JPEG or WebP; up to 750 KB each, 4 MB total.</p></div>
      <label className="dot-pill"><ImagePlus aria-hidden="true" />{loading ? "Adding images…" : "Add images"}<input aria-label="Add images" type="file" accept=".png,.jpg,.jpeg,.webp" multiple disabled={disabled || loading} className="sr-only" onChange={event => { void add(Array.from(event.target.files ?? [])); event.target.value = ""; }} /></label>
    </div>
    {!draft.assets?.length && <p className="writing-hint">Attach the files named in your Markdown, or add an image and insert it below. A 1600 × 900 banner works well.</p>}
    <div className="writing-artwork-grid">{draft.assets?.map(asset => <fieldset disabled={disabled || loading} className="writing-artwork-card" key={asset.path}>
      <img src={asset.src} alt="" width={asset.width} height={asset.height} />
      <div className="writing-artwork-controls"><p className="writing-filename">{asset.path}</p><p className="writing-hint">{asset.width} × {asset.height} · {Math.ceil(asset.bytes / 1000)} KB</p>
        <label>Description for insertion<input value={descriptions[asset.path] ?? ""} maxLength={300} onChange={event => setDescriptions(value => ({ ...value, [asset.path]: event.target.value }))} /></label>
        <div className="writing-actions"><button type="button" className="dot-pill" disabled={!descriptions[asset.path]?.trim()} onClick={() => onInsert(`![${descriptions[asset.path].replace(/[[\]\\]/g, "\\$&")}](${asset.path})`)}>Insert in text</button>
          <button type="button" className="dot-pill" aria-pressed={cover?.path === asset.path} onClick={() => onChange({ presentation: { ...presentation, cover: cover?.path === asset.path ? null : { path: asset.path, alt: descriptions[asset.path] ?? "", caption: "" } } })}>{cover?.path === asset.path ? "Remove banner" : "Use as banner"}</button>
          <button type="button" className="dot-pill" aria-label={`Download ${asset.path}`} onClick={() => void download(asset.src, asset.path)}><Download aria-hidden="true" /></button>
          <button type="button" className="dot-pill" aria-label={`Remove ${asset.path}`} onClick={() => onChange({ assets: draft.assets?.filter(item => item.path !== asset.path) })}><Trash2 aria-hidden="true" /></button>
        </div>
      </div>
    </fieldset>)}</div>
    {cover && <fieldset disabled={disabled} className="writing-banner-settings"><legend>Banner · {cover.path}</legend>
      <label>Banner description<input maxLength={300} value={cover.alt} onChange={event => onChange({ presentation: { ...presentation, cover: { ...cover, alt: event.target.value } } })} /></label>
      <label>Banner caption <span>(optional)</span><input maxLength={400} value={cover.caption} onChange={event => onChange({ presentation: { ...presentation, cover: { ...cover, caption: event.target.value } } })} /></label>
    </fieldset>}
  </section>;
}
