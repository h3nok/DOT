import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Check, Save } from 'lucide-react';
import AMM from '../../content/amm.json';
import { ammCopyFields, type CopyField } from '../../content/editable/ammCopy.js';
import { useSiteContent } from '../../content/editable/SiteContentProvider';
import { fetchDrafts, type SiteContentDraft } from '../../services/SiteContentService';
import { AmmShell } from '../amm/AmmIdentity';
import { AmmButton, AmmTextField } from '../amm/AmmControls';
import './page-copy-studio.css';

const fields = ammCopyFields(AMM);
const groups = [...new Set(fields.map(field => field.group))];

/** Landing copy uses the established plain-text draft/publish boundary (ADR-0021). */
export default function PageCopyStudio() {
  const [rows, setRows] = useState<SiteContentDraft[] | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set());
  const [openedGroups, setOpenedGroups] = useState(() => new Set([groups[0]]));
  const markDirty = useCallback((key: string, dirty: boolean) => {
    setDirtyKeys(current => {
      const next = new Set(current);
      if (dirty) next.add(key); else next.delete(key);
      return next;
    });
  }, []);
  useEffect(() => {
    if (!dirtyKeys.size) return;
    const protect = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    const protectLink = (event: MouseEvent) => {
      const link = (event.target as Element).closest?.('a[href]');
      if (!link || link.getAttribute('href')?.startsWith('#') || link.getAttribute('target') === '_blank' || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (!window.confirm('Leave with unsaved page changes? Save each changed field as a draft to keep it.')) { event.preventDefault(); event.stopPropagation(); }
    };
    window.addEventListener('beforeunload', protect);
    document.addEventListener('click', protectLink, true);
    return () => { window.removeEventListener('beforeunload', protect); document.removeEventListener('click', protectLink, true); };
  }, [dirtyKeys.size]);
  useEffect(() => {
    const abort = new AbortController();
    setError('');
    void fetchDrafts(abort.signal, true).then(value => {
      if (!abort.signal.aborted) setRows(value);
    }).catch(reason => { if (!abort.signal.aborted) setError(reason instanceof Error ? reason.message : 'Could not load your saved edits.'); });
    return () => abort.abort();
  }, [attempt]);
  return <AmmShell reading><div className="page-copy-studio">
    <Helmet><title>Edit AMM’s pages</title><meta name="robots" content="noindex, nofollow" /></Helmet>
    <Link to="/studio/newsletter" className="page-copy-back"><ArrowLeft aria-hidden="true" />Publication desk</Link>
    <header><p className="dot-label">Private workspace · Page copy</p><h1>AMM’s pages.</h1><p>Edit a section, save a private draft, then publish when it is ready. Edit the landing page, How power works, reading companions, archive, and signup copy here. Chapters and letters have their own manuscript editors.</p><AmmButton to="/amm" label="View the page" /> <AmmButton to="/amm/editions" label="View editions and signup" /> <AmmButton to="/amm/power" label="View How power works" /><p className="page-copy-hint">Published wording appears on the website immediately. Search previews refresh with the next site build. Layout and navigation stay managed by the design system.</p></header>
    {error ? <p role="alert">{error} <AmmButton onClick={() => setAttempt(value => value + 1)} label="Try again" /></p> : rows === null ? <p role="status">Opening your saved page copy…</p> :
      <div className="page-copy-sections">{groups.map((group, index) => <details key={group} open={index === 0} onToggle={event => {
        if (event.currentTarget.open) setOpenedGroups(current => current.has(group) ? current : new Set([...current, group]));
      }}>
        <summary>{group}</summary>
        {openedGroups.has(group) && fields.filter(field => field.group === group).map(field => <CopyEditor key={field.key} field={field} row={rows.find(row => row.key === field.key)} onDirty={markDirty} />)}
      </details>)}</div>}
  </div></AmmShell>;
}

function CopyEditor({ field, row, onDirty }: { field: CopyField; row?: SiteContentDraft; onDirty: (key: string, dirty: boolean) => void }) {
  const { save } = useSiteContent();
  const [value, setValue] = useState(row?.draft_value ?? row?.published_value ?? field.text);
  const [saved, setSaved] = useState(value);
  const [live, setLive] = useState(row?.published_value ?? field.text);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [updatedAt, setUpdatedAt] = useState(row?.updated_at ?? null);
  const dirty = value !== saved;
  const unpublished = value.trim() !== live;
  useEffect(() => {
    onDirty(field.key, dirty);
    return () => onDirty(field.key, false);
  }, [dirty, field.key, onDirty]);
  async function commit(publish: boolean) {
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await save(field.key, value, { publish, expectedUpdatedAt: updatedAt });
      if (result) setUpdatedAt(result.updated_at);
      const text = value.trim();
      setSaved(text); setValue(text);
      if (publish) setLive(text);
      setNotice(publish ? 'Published on the page.' : 'Draft saved privately.');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not save. Your changes remain here.'); }
    finally { setBusy(false); }
  }
  return <section className="page-copy-field" aria-label={field.label}>
    <AmmTextField label={field.label} id={field.key} value={value} rows={value.length > 150 ? 4 : 2} maxLength={4000} disabled={busy} onChange={event => { setValue(event.target.value); setNotice(''); }} />
    <div className="page-copy-actions">
      <AmmButton label="Save draft" disabled={busy || !dirty || !value.trim()} onClick={() => void commit(false)} icon={<Save />} />
      <AmmButton label="Publish change" variant="primary" disabled={busy || !unpublished || !value.trim()} onClick={() => void commit(true)} icon={<Check />} />
      <span>{dirty ? 'Unsaved changes' : unpublished ? 'Private draft' : 'Published wording'}</span>
    </div>
    {unpublished && <details className="page-copy-current"><summary>Currently published</summary><p>{live}</p></details>}
    <p role="status">{notice}</p>{error && <p role="alert">{error}</p>}
  </section>;
}
