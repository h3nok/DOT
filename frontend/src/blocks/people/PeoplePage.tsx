import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpRight, Copy, RefreshCw } from "lucide-react";

import { FormField } from "../../attention-os/forms/FormField";
import { useAuth } from "../../dot/useAuth";
import { DotButton } from "../../shared/DotButton";
import { PageHeader, PageShell } from "../../shared/PageShell";
import {
  declineRequest, fetchInvitations, fetchJoinRequests, fetchMembers, fetchSubscribers, fetchSupportTotals,
  findMember, inviteRequester, removeSubscriber, revokeInvitation, setMemberStatus,
  type Invitation, type JoinRequest, type Member, type Subscriber, type SupportTotals,
} from "../../services/OrchestratorPeopleService";
import "../contact/contact.css";
import "./people.css";

const VIEWS = [
  { id: "subscribers", title: "Subscribers", lede: "Everyone who confirmed an address for your writing." },
  { id: "requests", title: "Requests", lede: "People who proved their address and asked to join." },
  { id: "members", title: "Members", lede: "Everyone with an account. Addresses are never stored readably, so they are not listed." },
  { id: "invitations", title: "Invitations", lede: "Links you have issued. Each works once and expires after 14 days." },
  { id: "support", title: "Support", lede: "Voluntary, one-time support. Payments themselves stay with the provider." },
] as const;

const date = (value: string | null) => value ? new Date(value).toLocaleDateString(undefined, { dateStyle: "medium" }) : "Not recorded";
const errorText = (reason: unknown) => reason instanceof Error ? reason.message : "That did not go through. Try again.";

/** Load one finite list, and reload it after every change. */
function useList<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    setError("");
    void load(abort.signal).then(setData).catch(reason => { if (!abort.signal.aborted) setError(errorText(reason)); });
    return () => abort.abort();
  }, [load, refresh]);
  return { data, setData, error, reload: useCallback(() => setRefresh(value => value + 1), []) };
}

/** One action on one row: busy state and error reporting live here, once. */
function useAction(onDone: () => void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const run = async (action: () => Promise<unknown>) => {
    setBusy(true); setError("");
    try { await action(); onDone(); } catch (reason) { setError(errorText(reason)); } finally { setBusy(false); }
  };
  return { busy, error, run };
}

function Row({ title, detail, children, error }: { title: ReactNode; detail: ReactNode; children?: ReactNode; error?: string }) {
  return <li className="people-row">
    <strong>{title}</strong>
    <p>{detail}</p>
    {error && <p role="alert" className="contact-error">{error}</p>}
    {children && <div className="people-actions">{children}</div>}
  </li>;
}

/** An action that takes something away asks once, in place. */
function ConfirmAction({ label, question, disabled, onConfirm }: { label: string; question: string; disabled: boolean; onConfirm: () => void }) {
  const [asking, setAsking] = useState(false);
  if (!asking) return <button type="button" className="contact-quiet-action" disabled={disabled} onClick={() => setAsking(true)}>{label}…</button>;
  return <div className="inbox-delete"><p>{question}</p>
    <button type="button" className="contact-quiet-action" disabled={disabled} onClick={onConfirm}>{label}</button>
    <button type="button" className="contact-quiet-action" disabled={disabled} onClick={() => setAsking(false)}>Cancel</button>
  </div>;
}

function ListState<T>({ data, error, empty, children }: { data: T[] | null; error: string; empty: string; children: (items: T[]) => ReactNode }) {
  if (error) return <p role="alert" className="contact-error">{error}</p>;
  if (!data) return <p role="status">Opening…</p>;
  if (data.length === 0) return <p className="inbox-empty">{empty}</p>;
  return <ul className="inbox-list">{children(data)}</ul>;
}

function SubscriberRow({ item, onChange }: { item: Subscriber; onChange: () => void }) {
  const { busy, error, run } = useAction(onChange);
  return <Row title={item.email ?? "This address cannot currently be opened."} detail={`${item.publication === "amm" ? "AMM" : "All writing"} · Confirmed ${date(item.confirmed_at)}`} error={error}>
    <ConfirmAction label="Remove" question="Remove this subscription? They stop receiving this list, and no email is sent. They can subscribe again themselves." disabled={busy} onConfirm={() => void run(() => removeSubscriber(item.id))} />
  </Row>;
}

function Subscribers() {
  const { data, error, reload } = useList(fetchSubscribers);
  return <ListState data={data} error={error} empty="Nobody has confirmed a subscription yet.">{items => items.map(item => <SubscriberRow key={item.id} item={item} onChange={reload} />)}</ListState>;
}

function RequestRow({ item, onChange, onDevLink }: { item: JoinRequest; onChange: () => void; onDevLink: (link: string) => void }) {
  const { busy, error, run } = useAction(onChange);
  return <Row title={item.email ?? "This address cannot currently be opened."} detail={<>{item.reason || "No reason given."} · Asked {date(item.created_at)}</>} error={error}>
    <button type="button" className="contact-quiet-action" disabled={busy || !item.email} onClick={() => void run(async () => { const { dev_link: link } = await inviteRequester(item.id); if (link) onDevLink(link); })}>Invite by email</button>
    <ConfirmAction label="Decline" question="Decline and delete this request? No email is sent, and the address is removed." disabled={busy} onConfirm={() => void run(() => declineRequest(item.id))} />
  </Row>;
}

function Requests() {
  const { data, error, reload } = useList(fetchJoinRequests);
  const [devLink, setDevLink] = useState("");
  return <>
    {devLink && <p role="status" className="inbox-notice">No mail provider is configured here. Local invitation link: <span className="people-link">{devLink}</span></p>}
    <ListState data={data} error={error} empty="No open requests.">{items => items.map(item => <RequestRow key={item.id} item={item} onChange={reload} onDevLink={setDevLink} />)}</ListState>
    <p className="contact-privacy">Answering removes the request and its address. An invited person’s address is kept only as a blind index once they sign in.</p>
  </>;
}

function MemberRow({ item, onChange }: { item: Member; onChange: () => void }) {
  const { busy, error, run } = useAction(onChange);
  const suspended = item.status === "suspended";
  return <Row title={item.display_name ?? `Unnamed member …${item.id.slice(-6)}`} detail={`${item.role === "member" ? "Member" : "Owner"}${suspended ? " · Suspended" : ""} · Joined ${date(item.joined_at)}${item.invited_by ? ` · Invited by ${item.invited_by}` : ""}`} error={error}>
    {item.role === "member" && (suspended
      ? <button type="button" className="contact-quiet-action" disabled={busy} onClick={() => void run(() => setMemberStatus(item.id, "active"))}>Restore access</button>
      : <ConfirmAction label="Suspend" question="Suspend this member? They are signed out now and cannot sign in until you restore them. Public reading stays open, and nothing they own is deleted." disabled={busy} onConfirm={() => void run(() => setMemberStatus(item.id, "suspended"))} />)}
  </Row>;
}

function Members() {
  const { data, setData, error, reload } = useList(fetchMembers);
  const [email, setEmail] = useState("");
  const [filtered, setFiltered] = useState(false);
  const [findError, setFindError] = useState("");
  const find = async (event: FormEvent) => {
    event.preventDefault(); setFindError("");
    try { setData(await findMember(email.trim())); setFiltered(true); } catch (reason) { setFindError(errorText(reason)); }
  };
  const clear = () => { setEmail(""); setFiltered(false); reload(); };
  return <>
    <form className="people-find" onSubmit={event => void find(event)}>
      <FormField label="Find by email address" hint="Matches an address you already know. It is not saved.">{props => <input {...props} type="email" required value={email} onChange={event => setEmail(event.target.value)} />}</FormField>
      <button type="submit" className="contact-quiet-action">Find member</button>
      {filtered && <button type="button" className="contact-quiet-action" onClick={clear}>Show everyone</button>}
    </form>
    {findError && <p role="alert" className="contact-error">{findError}</p>}
    <ListState data={data} error={error} empty={filtered ? "No member holds that address." : "No members yet."}>{items => items.map(item => <MemberRow key={item.id} item={item} onChange={filtered ? clear : reload} />)}</ListState>
  </>;
}

const INVITE_STATUS: Record<Invitation["status"], string> = { open: "Open", accepted: "Accepted", revoked: "Revoked", expired: "Expired" };

function InvitationRow({ item, onChange }: { item: Invitation; onChange: () => void }) {
  const { busy, error, run } = useAction(onChange);
  const detail = item.status === "accepted" ? `Accepted${item.accepted_by ? ` by ${item.accepted_by}` : ""}` : item.status === "open" ? `Expires ${date(item.expires_at)}` : `Issued ${date(item.created_at)}`;
  return <Row title={INVITE_STATUS[item.status]} detail={detail} error={error}>
    {item.status === "open" && <ConfirmAction label="Revoke" question="Revoke this invitation? Its link stops working." disabled={busy} onConfirm={() => void run(() => revokeInvitation(item.id))} />}
  </Row>;
}

function Invitations() {
  const { createInvite } = useAuth();
  const { data, error, reload } = useList(fetchInvitations);
  const [link, setLink] = useState("");
  const [issueError, setIssueError] = useState("");
  const [copied, setCopied] = useState(false);
  const issue = async () => {
    setIssueError(""); setCopied(false);
    const result = await createInvite();
    if (result.ok && result.link) { setLink(result.link); reload(); } else setIssueError(result.error ?? "Could not create invitation.");
  };
  return <>
    <DotButton type="button" label="Create an invitation link" onClick={() => void issue()} />
    {issueError && <p role="alert" className="contact-error">{issueError}</p>}
    {link && <div className="inbox-notice" role="status"><p>Send this to one person. It is shown only now, because only its fingerprint is kept.</p><span className="people-link">{link}</span><button type="button" className="contact-quiet-action" onClick={() => void navigator.clipboard.writeText(link).then(() => setCopied(true))}><Copy aria-hidden="true" /> {copied ? "Copied" : "Copy link"}</button></div>}
    <div className="mt-8"><ListState data={data} error={error} empty="You have not issued an invitation yet.">{items => items.map(item => <InvitationRow key={item.id} item={item} onChange={reload} />)}</ListState></div>
  </>;
}

function money(totals: SupportTotals) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: totals.currency }).format(totals.total_minor / 100);
}

function Support() {
  const { data, error } = useList(fetchSupportTotals);
  if (error) return <p role="alert" className="contact-error">{error}</p>;
  if (!data) return <p role="status">Opening…</p>;
  return <section aria-label="Card support">
    <p className="people-total">{money(data)}</p>
    <p className="dot-caption mt-2">from {data.supporters === 1 ? "1 card supporter" : `${data.supporters} card supporters`}, as recorded from Stripe. Zelle and Cash App are not included; confirm those in the app that received them.</p>
    <a className="contact-quiet-action" href="https://dashboard.stripe.com/payments" target="_blank" rel="noreferrer">Open Stripe payments and refunds <ArrowUpRight aria-hidden="true" /></a>
    <p className="contact-privacy">DOT keeps totals only. Who paid, and every refund, stays in Stripe. Support is one-time, so there are no subscriptions to manage.</p>
  </section>;
}

export default function PeoplePage() {
  const [params] = useSearchParams();
  const view = VIEWS.find(item => item.id === params.get("view")) ?? VIEWS[0];
  const [revision, setRevision] = useState(0);
  useEffect(() => { document.title = "People — Private workspace"; }, []);
  return <PageShell header={<PageHeader backTo="/studio" backLabel="Studio" />} className="contact-page contact-inbox">
    <header className="contact-masthead"><p className="dot-label">Owner workspace</p><h1 className="dot-page-heading">{view.title}</h1><p>{view.lede}</p></header>
    <nav className="people-nav" aria-label="People">{VIEWS.map(item => <Link key={item.id} to={`?view=${item.id}`} aria-current={item.id === view.id ? "page" : undefined}>{item.title}</Link>)}</nav>
    <div key={`${view.id}-${revision}`}>
      {view.id === "subscribers" && <Subscribers />}
      {view.id === "requests" && <Requests />}
      {view.id === "members" && <Members />}
      {view.id === "invitations" && <Invitations />}
      {view.id === "support" && <Support />}
    </div>
    <button type="button" className="contact-quiet-action" onClick={() => setRevision(value => value + 1)}><RefreshCw aria-hidden="true" /> Refresh</button>
  </PageShell>;
}
