import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Download, RefreshCw } from "lucide-react";

import contact from "../../content/contact.json";
import { FormField } from "../../attention-os/forms/FormField";
import { DotButton } from "../../shared/DotButton";
import { PageHeader, PageShell } from "../../shared/PageShell";
import {
  deleteContactConversation, fetchContactConversation, fetchContactInbox,
  sendContactReply, updateContactStatus,
  type ContactConversation, type ContactMessage,
} from "../../services/OrchestratorContactService";
import "./contact.css";

const label = (purpose: string) => contact.purposes.find(item => item.value === purpose)?.title ?? purpose;
const date = (value: string) => new Date(value).toLocaleDateString(undefined, { dateStyle: "medium" });
const errorText = (reason: unknown) => reason instanceof Error ? reason.message : "The inbox could not be reached. Try again.";

function Conversation({ id, onBack }: { id: string; onBack: () => void }) {
  const [item, setItem] = useState<ContactConversation | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const attempt = useRef<{ message: string; key: string } | null>(null);

  useEffect(() => {
    let active = true;
    void fetchContactConversation(id).then(result => { if (active) setItem(result); })
      .catch(reason => { if (active) setError(errorText(reason)); });
    return () => { active = false; };
  }, [id, refresh]);

  const action = async (run: () => Promise<void>) => {
    setBusy(true); setError(""); setNotice("");
    try { await run(); } catch (reason) { setError(errorText(reason)); }
    finally { setBusy(false); }
  };
  const send = (text: string, key: string) => action(async () => {
    const result = await sendContactReply(id, text, key);
    if (result.status === "sent") {
      setNotice("Your reply was accepted for email delivery. It will come from the site's verified address, with replies going to henok@sullix.com.");
      setMessage(""); attempt.current = null;
    } else setError("Email delivery could not be confirmed. Retry this same reply below; its reference protects against duplicate delivery.");
    setRefresh(value => value + 1);
  });
  const exportConversation = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(item, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = `${id}.json`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return <section className="inbox-conversation" aria-label="Contact conversation" aria-busy={busy}>
    <button type="button" className="contact-quiet-action" onClick={onBack} disabled={busy}><ArrowLeft aria-hidden="true" /> Back to inbox</button>
    {error && <p role="alert" className="contact-error">{error}</p>}
    {notice && <p role="status" className="inbox-notice">{notice}</p>}
    {!item ? <p role="status">{error ? "" : "Opening message…"}</p> : <>
      <header className="inbox-message-header"><p className="dot-label">{label(item.purpose)} · {item.status}</p><h2 className="dot-section-heading">{item.name}</h2><a href={`mailto:${item.email}`}>{item.email}</a><p>Received {date(item.created_at)} · {item.id}</p></header>
      <dl className="inbox-context">{([["Organization", item.organization], ["Timeline", item.timeline], ["Budget", item.budget]] as const).filter(([, value]) => value).map(([term, value]) => <div key={term}><dt>{term}</dt><dd>{value}</dd></div>)}</dl>
      <p className="inbox-message-text">{item.message}</p>
      {item.notification_status !== "accepted" && <p className="inbox-notice">The inbox received this message. Delivery of the notice to your email was not confirmed.</p>}
      {item.replies.length > 0 && <section className="inbox-replies" aria-label="Replies"><h3 className="dot-section-heading">Replies</h3>{item.replies.map(reply => <article key={reply.id}><p className="dot-label">{date(reply.created_at)} · {reply.status === "sent" ? "Accepted for email delivery" : "Delivery not confirmed"}</p><p className="inbox-message-text">{reply.message ?? "This reply cannot currently be opened."}</p>{reply.status !== "sent" && reply.message && <button type="button" disabled={busy} className="contact-quiet-action" onClick={() => void send(reply.message!, reply.submission_key)}>Retry this reply</button>}</article>)}<p className="contact-privacy">Retry uses the original delivery reference. After 23 hours, check delivery with your email provider before composing another reply.</p></section>}
      <form className="inbox-reply-form" onSubmit={event => {
        event.preventDefault(); if (busy) return;
        const text = message.trim();
        if (attempt.current?.message !== text) attempt.current = { message: text, key: crypto.randomUUID() };
        void send(text, attempt.current.key);
      }}>
        <FormField label="Your reply" hint={`Sent by email to ${item.email}.`}>{props => <textarea {...props} required maxLength={6000} rows={6} value={message} disabled={busy} onChange={event => setMessage(event.target.value)} />}</FormField>
        <DotButton type="submit" label={busy ? "Working…" : "Send reply by email"} disabled={busy} endIcon={<ArrowUpRight />} />
      </form>
      <div className="inbox-management">
        <button type="button" className="contact-quiet-action" disabled={busy} onClick={() => void action(async () => { await updateContactStatus(id, item.status === "archived" ? "new" : "archived"); setRefresh(value => value + 1); })}>{item.status === "archived" ? "Reopen conversation" : "Archive conversation"}</button>
        <button type="button" className="contact-quiet-action" disabled={busy} onClick={exportConversation}><Download aria-hidden="true" /> Download conversation</button>
        {!confirmDelete ? <button type="button" className="contact-quiet-action" disabled={busy} onClick={() => setConfirmDelete(true)}>Delete conversation…</button> : <div className="inbox-delete"><p>Delete this message and all stored replies permanently? Copies already delivered by email remain in those mailboxes.</p><button type="button" disabled={busy} className="contact-quiet-action" onClick={() => void action(async () => { await deleteContactConversation(id); onBack(); })}>Delete permanently</button><button type="button" disabled={busy} className="contact-quiet-action" onClick={() => setConfirmDelete(false)}>Cancel</button></div>}
      </div>
    </>}
    <button className="contact-quiet-action" type="button" disabled={busy} onClick={() => { setError(""); setRefresh(value => value + 1); }}><RefreshCw aria-hidden="true" /> Refresh conversation</button>
  </section>;
}

export default function ContactInboxPage() {
  const [params, setParams] = useSearchParams();
  const id = params.get("id");
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState<{ messages: ContactMessage[]; has_more: boolean } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { document.title = "Private contact inbox — Henok Ghebrechristos"; }, []);
  useEffect(() => {
    if (id) return;
    const abort = new AbortController(); setResult(null); setError("");
    void fetchContactInbox(page, filter, abort.signal).then(setResult).catch(reason => { if (!abort.signal.aborted) setError(errorText(reason)); });
    return () => abort.abort();
  }, [page, filter, refresh, id]);
  return <PageShell header={<PageHeader backTo="/studio" backLabel="Studio" />} className="contact-page contact-inbox">
    <header className="contact-masthead"><p className="dot-label">Owner workspace</p><h1 className="dot-page-heading">Contact inbox</h1><p>Project discussions, collaboration, writing, speaking, and personal messages.</p></header>
    {id ? <Conversation key={id} id={id} onBack={() => setParams({})} /> : <>
      <div className="inbox-toolbar"><FormField label="Show conversations">{props => <select {...props} value={filter} onChange={event => { setFilter(event.target.value); setPage(1); }}><option value="">All messages</option><option value="new">New</option><option value="replied">Replied</option><option value="archived">Archived</option></select>}</FormField><button className="contact-quiet-action" type="button" onClick={() => setRefresh(value => value + 1)}><RefreshCw aria-hidden="true" /> Refresh inbox</button></div>
      {error ? <p role="alert" className="contact-error">{error}</p> : !result ? <p role="status">Opening inbox…</p> : result.messages.length === 0 ? <p className="inbox-empty">{filter ? "No conversations match this view." : "No messages yet. The public contact page is ready for the first conversation."}</p> : <ul className="inbox-list">{result.messages.map(item => <li key={item.id}><Link to={`?id=${encodeURIComponent(item.id)}`}><span className="dot-label">{label(item.purpose)} · {item.status}</span><strong>{item.name}</strong><span className="inbox-preview">{item.message}</span><span className="inbox-date">{date(item.created_at)}</span></Link></li>)}</ul>}
      {result && (page > 1 || result.has_more) && <nav className="inbox-pagination" aria-label="Inbox pages"><button type="button" className="contact-quiet-action" disabled={page === 1} onClick={() => setPage(value => value - 1)}>Previous page</button><span>Page {page}</span><button type="button" className="contact-quiet-action" disabled={!result.has_more} onClick={() => setPage(value => value + 1)}>Next page</button></nav>}
      <p className="contact-privacy">Messages stay private. Archive keeps a conversation; delete removes its stored message and replies. Download supports a visitor's request for a copy.</p>
    </>}
  </PageShell>;
}
