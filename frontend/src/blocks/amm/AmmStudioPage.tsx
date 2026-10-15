import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Download, Eye, Mail, Pause, RefreshCw } from "lucide-react";
import AMM from "../../content/amm.json";
import library from "../../content/amm-library.json";
import { AmmShell } from "./AmmIdentity";
import { fetchReleasedWriting, type ReleasedWriting } from "../../services/OrchestratorWritingService";
import { approveNewsletter, cancelNewsletter, dispatchNewsletter, newsletterCampaigns, newsletterStatus, prepareNewsletter, retryRejectedNewsletter, type NewsletterCampaign, type NewsletterReadiness } from "../../services/OrchestratorNewsletterService";
import { downloadText } from "../publication/writing/manuscriptFile";
import "../publication/writing/writing-desk.css";
import "./amm-studio.css";

const TEMPLATE = `---\ntitle: ""\nsummary: ""\nformat: letter\nseries: "The American Millennial Manifesto"\ndraft: true\n---\n\n<!-- Write your edition here. Separate evidence, interpretation, and proposals. Link to original sources; add image files through Studio. -->\n`;
const STATES: Record<string, string> = { pending: "Waiting", sending: "In progress", accepted: "Accepted by email provider", delivered: "Delivered to mail server", skipped: "Skipped", needs_review: "Outcome uncertain — review in Resend", rejected: "Rejected", bounced: "Bounced", complained: "Complaint — suppressed", suppressed: "Suppressed" };

export default function AmmStudioPage() {
  const [releases, setReleases] = useState<ReleasedWriting[]>([]);
  const [history, setHistory] = useState<NewsletterCampaign[]>([]);
  const [ready, setReady] = useState<NewsletterReadiness | null>(null);
  const [selected, setSelected] = useState("");
  const [campaign, setCampaign] = useState<NewsletterCampaign | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const [approved, setApproved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const running = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; running.current = false; }; }, []);
  useEffect(() => {
    const controller = new AbortController();
    setError(null); setLoaded(false);
    void Promise.all([fetchReleasedWriting(controller.signal), newsletterStatus(controller.signal), newsletterCampaigns(controller.signal)]).then(([writing, status, campaigns]) => {
      if (controller.signal.aborted) return;
      setReleases(writing.filter(item => item.presentation?.series === AMM.series)); setReady(status); setHistory(campaigns); setLoaded(true);
    }).catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "The newsletter desk could not be opened."); });
    return () => controller.abort();
  }, [attempt]);
  function open(value: NewsletterCampaign) { setCampaign(value); setReviewed(false); setApproved(false); setError(null); }
  function update(value: NewsletterCampaign) { setCampaign(value); setHistory(items => [value, ...items.filter(item => item.id !== value.id)]); }
  async function prepare() {
    const release = releases.find(item => item.work_id === selected);
    if (!release) return;
    setBusy(true); setError(null);
    try { const next = await prepareNewsletter(release.work_id, release.release_number); update(next); setReviewed(false); setApproved(false); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "The preview could not be prepared."); }
    finally { setBusy(false); }
  }
  async function send() {
    if (!campaign || !ready?.ready || (!campaign.approved_at && (!approved || !reviewed))) return;
    setBusy(true); setSending(true); setError(null); running.current = true;
    try {
      let current = campaign.approved_at ? campaign : await approveNewsletter(campaign);
      if (mounted.current) update(current);
      while (running.current && current.counts.pending > 0 && !current.cancelled_at) {
        current = await dispatchNewsletter(current.id);
        if (mounted.current) update(current);
        if ((current.counts.needs_review ?? 0) > 0 || (current.counts.rejected ?? 0) > 0) break;
      }
    } catch (reason) { if (mounted.current) setError(reason instanceof Error ? reason.message : "Sending paused. Reload delivery status before resuming; pending records are saved."); }
    finally { running.current = false; if (mounted.current) { setBusy(false); setSending(false); } }
  }
  async function cancel() {
    if (!campaign || !window.confirm("Cancel the remaining email deliveries? Messages already accepted by the provider cannot be recalled.")) return;
    setBusy(true); setError(null);
    try { update(await cancelNewsletter(campaign.id)); } catch (reason) { setError(reason instanceof Error ? reason.message : "Cancellation could not be confirmed."); }
    finally { setBusy(false); }
  }
  async function retryRejected() {
    if (!campaign || !window.confirm("Make definitely rejected attempts eligible for another send? Uncertain attempts remain held for review.")) return;
    setBusy(true); setError(null);
    try { update(await retryRejectedNewsletter(campaign.id)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Retry preparation failed."); }
    finally { setBusy(false); }
  }
  async function refresh() {
    setBusy(true); setError(null);
    try { const items = await newsletterCampaigns(); setHistory(items); if (campaign) setCampaign(items.find(item => item.id === campaign.id) ?? campaign); setReady(await newsletterStatus()); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Status could not be refreshed."); }
    finally { setBusy(false); }
  }
  return <AmmShell reading><div className="writing-desk amm-studio">
    <header className="writing-desk-header"><div><p className="dot-label">Private publication desk · AMM</p><h1>The newsletter.</h1><p>Write here. Publish here. Send with intention.</p></div><Link to="/amm">Open AMM <ArrowRight aria-hidden="true" /></Link></header>
    <ol className="amm-studio-spine" aria-label="AMM publication pipeline"><li><span>01</span><strong>Write</strong><p>Import Markdown, edit, add artwork.</p></li><li><span>02</span><strong>Publish</strong><p>Release the complete edition on the site.</p></li><li><span>03</span><strong>Review email</strong><p>Preview an exact published version.</p></li><li><span>04</span><strong>Send</strong><p>Deliver only to confirmed AMM readers.</p></li></ol>
    <div className="amm-studio-start"><Link to="/studio/writing?series=amm" className="dot-reading-action writing-primary">Write an AMM edition <ArrowRight aria-hidden="true" /></Link><button className="writing-text-button" onClick={() => downloadText(TEMPLATE, "amm-edition.md")}><Download aria-hidden="true" />Markdown template</button></div>
    <details className="amm-source-library"><summary>Edit an existing manuscript</summary><ul>{library.map(item => <li key={item.slug}><Link to={`/studio/writing?series=amm&source=${item.slug}`}>{item.title}<span>{item.revision ? "Revision requested" : "Text, images, and figures"} <ArrowRight aria-hidden="true" /></span></Link></li>)}</ul></details>
    {error && <p role="alert" className="writing-error">{error} <button className="writing-text-button" disabled={busy} onClick={() => setAttempt(value => value + 1)}>Reload desk</button></p>}
    {!loaded && !error && <p role="status">Opening your publication desk…</p>}
    {loaded && <div className="amm-studio-columns"><section className="amm-studio-select"><h2>Choose the edition.</h2>{!releases.length ? <p>Your first AMM edition will appear here after you publish it from Writing Studio.</p> : <><label htmlFor="amm-release">Published AMM writing</label><select id="amm-release" value={selected} disabled={busy} onChange={event => setSelected(event.target.value)}><option value="">Choose a published edition</option>{releases.map(item => <option key={item.work_id} value={item.work_id}>{item.title} · Version {item.release_number}</option>)}</select><button className="dot-pill" disabled={!selected || busy} onClick={() => void prepare()}><Eye aria-hidden="true" />Prepare email preview</button></>}
      <h3>Recent mailings</h3>{!history.length ? <p>No email editions prepared yet.</p> : <ul>{history.map(item => <li key={item.id}><button disabled={busy} aria-current={campaign?.id === item.id ? "true" : undefined} onClick={() => open(item)}>{item.title}<small>Version {item.release_number} · {item.cancelled_at ? "Cancelled" : item.approved_at ? "Approved mailing" : "Preview only"}</small></button></li>)}</ul>}
      {ready && !ready.ready && <aside className="amm-mail-setup"><h3>Email setup</h3><p>{ready.reason} Web publication and previews are available.</p>{ready.missing.length > 0 && <details><summary>Sender configuration</summary><ul>{ready.missing.map(item => <li key={item}><code>{item}</code></li>)}</ul></details>}<button onClick={() => void refresh()} disabled={busy} className="writing-text-button">Check again</button></aside>}
    </section><section className="amm-mail-review" aria-label="Email review">{!campaign ? <div className="amm-mail-empty"><Mail aria-hidden="true" /><h2>A separate moment to send.</h2><p>Publishing an edition does not email anyone. Choose a released edition to prepare its message and review the audience.</p></div> : <>
      <p className="dot-label">Exact published version {campaign.release_number}</p><h2>{campaign.title}</h2><dl className="amm-envelope"><dt>Subject</dt><dd>{campaign.envelope.subject}</dd><dt>From</dt><dd>{campaign.envelope.from || "Sender setup needed"}</dd><dt>Replies</dt><dd>{campaign.envelope.reply_to}</dd><dt>Audience</dt><dd>{campaign.approved_at ? "AMM readers confirmed when this mailing was approved" : `${campaign.eligible_readers} confirmed AMM readers`}</dd></dl>
      <details onToggle={event => { if (event.currentTarget.open) setReviewed(true); }}><summary><Eye aria-hidden="true" />Preview the email</summary><iframe title="AMM email preview" sandbox="" srcDoc={`<!doctype html><html><head><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src 'none';"><style>body{margin:0;background:white;color:#222}a{color:#93432d}pre{white-space:pre-wrap;overflow-wrap:anywhere}table{max-width:100%;font-size:14px}img{display:none}</style></head><body>${campaign.envelope.html}</body></html>`} /><p className="writing-hint">The delivered footer includes {campaign.envelope.postal_address || "[Public mailing address — to be added before sending]"}, Unsubscribe from AMM, and Leave all writing lists. Artwork stays in the linked web edition.</p></details>
      <button className="writing-text-button" onClick={() => downloadText(campaign.envelope.text, "amm-email-preview.txt")}><Download aria-hidden="true" />Download email text</button>
      {!campaign.approved_at && <><label className="writing-approval"><input type="checkbox" checked={approved} disabled={busy || !reviewed || !ready?.ready} onChange={event => setApproved(event.target.checked)} />I reviewed this email and approve sending this edition to confirmed AMM subscribers.</label><button className="dot-reading-action writing-primary" onClick={() => void send()} disabled={busy || !approved || !reviewed || !ready?.ready || !campaign.eligible_readers}><Mail aria-hidden="true" />Approve and send edition</button></>}
      {campaign.approved_at && <div className="amm-delivery-status" role="status"><h3>{campaign.cancelled_at ? "Mailing cancelled" : campaign.counts.pending > 0 ? "Delivery in progress" : "Delivery record"}</h3><ul>{Object.entries(campaign.counts).filter(([,count]) => count > 0).map(([state, count]) => <li key={state}>{STATES[state] ?? state}: {count}</li>)}</ul><p>Provider acceptance does not confirm inbox arrival. Uncertain attempts are held for review and will not be sent again automatically.</p></div>}
      <div className="writing-actions">{sending ? <button className="dot-pill" onClick={() => { running.current = false; }}><Pause aria-hidden="true" />Pause after this batch</button> : campaign.approved_at && !campaign.cancelled_at && campaign.counts.pending > 0 && <button className="dot-reading-action writing-primary" disabled={busy || !ready?.ready} onClick={() => void send()}>Resume remaining deliveries</button>}{campaign.approved_at && <button className="dot-pill" disabled={busy} onClick={() => void refresh()}><RefreshCw aria-hidden="true" />Refresh status</button>}{campaign.approved_at && !campaign.cancelled_at && campaign.counts.pending > 0 && <button className="writing-text-button" disabled={busy} onClick={() => void cancel()}>Cancel remaining deliveries</button>}</div>
      {campaign.approved_at && !campaign.cancelled_at && (campaign.counts.rejected ?? 0) > 0 && <button className="writing-text-button" disabled={busy} onClick={() => void retryRejected()}>Prepare rejected attempts for retry</button>}
      <p className="writing-hint">Keep this page open while sending. Closing it pauses after the current batch; remaining recipients stay saved here. A message already accepted cannot be recalled.</p>
    </>}</section></div>}
  </div></AmmShell>;
}
