import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, BriefcaseBusiness, Handshake, Lightbulb, Mail, Mic, ShieldCheck, Check } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { author } from "../../content/author";
import contact from "../../content/contact.json";
import { IntentionPicker } from "../../attention-os/intention/IntentionPicker";
import type { IntentTone } from "../../attention-os/focus-nav/IntentCard";
import { FormField } from "../../attention-os/forms/FormField";
import { DotButton } from "../../shared/DotButton";
import { PageHeader, PageShell } from "../../shared/PageShell";
import { SiteColophon } from "../../shared/SiteColophon";
import { PageIntro, Surface, TextLink } from "../../shared/design-system/Editorial";
import { fetchContactStatus, sendContactMessage, type ContactDraft, type ContactPurpose } from "../../services/OrchestratorContactService";
import "./contact.css";

const icons = { project: <BriefcaseBusiness />, collaboration: <Handshake />, writing: <Lightbulb />, speaking: <Mic />, general: <Mail />, privacy: <ShieldCheck /> };
const purposes = contact.purposes.map(item => ({ ...item, value: item.value as ContactPurpose, tone: item.tone as IntentTone, icon: icons[item.value as ContactPurpose] }));
const empty = (purpose: ContactPurpose): ContactDraft => ({ purpose, name: "", email: "", organization: "", message: "", timeline: "", budget: "", consent: false, website: "" });

export default function ContactPage() {
  const [params] = useSearchParams();
  const selected = params.get("purpose");
  const initial: ContactPurpose = purposes.some(item => item.value === selected) ? selected as ContactPurpose : "project";
  const [draft, setDraft] = useState(() => empty(initial));
  const [availability, setAvailability] = useState<"loading" | "open" | "closed" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<string | null>(null);
  const submission = useRef<{ content: string; key: string } | null>(null);
  const receiptHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => { document.title = `Contact — ${author.name}`; }, []);
  useEffect(() => {
    const controller = new AbortController();
    setAvailability("loading");
    void fetchContactStatus(controller.signal).then(status => setAvailability(status.available ? "open" : "closed"))
      .catch(() => { if (!controller.signal.aborted) setAvailability("error"); });
    return () => controller.abort();
  }, [attempt]);
  useEffect(() => { if (receipt) receiptHeading.current?.focus(); }, [receipt]);
  const update = (field: keyof ContactDraft, value: string | boolean) => setDraft(previous => ({ ...previous, [field]: value }));

  const send = async () => {
    const payload = { ...draft, ...(draft.purpose === "project" ? {} : { budget: "", timeline: "" }) };
    const content = JSON.stringify(payload);
    if (submission.current?.content !== content) submission.current = { content, key: crypto.randomUUID() };
    setSending(true);
    setError("");
    try {
      const result = await sendContactMessage(payload, submission.current.key);
      if (result.status !== "received" || !result.reference) throw new Error("Receipt could not be confirmed. Your message is still here; try again.");
      setReceipt(result.reference);
      setDraft(empty(draft.purpose));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "That did not go through. Try again or use email."); }
    finally { setSending(false); }
  };

  return (
    <PageShell wide className="contact-page" header={<PageHeader />} footer={<SiteColophon variant="personal" />}>
      <PageIntro className="contact-masthead" eyebrow={`Get in touch · ${author.name}`} title={contact.title}>
        <p>{contact.description}</p>
      </PageIntro>
      <div className="contact-layout">
        <section className="contact-intake" aria-label="Send Henok a message">
          {receipt ? (
            <div className="contact-receipt">
              <span className="contact-receipt-mark" aria-hidden="true"><Check /></span>
              <h2 ref={receiptHeading} tabIndex={-1} className="dot-section-heading">Your message was received.</h2>
              <p>Thank you for reaching out. Henok can now review your message and reply to the email address you supplied.</p>
              <p className="contact-reference">Your reference <code>{receipt}</code></p>
              <DotButton label="Explore the work" to="/about#about-products" endIcon={<ArrowUpRight />} />
              <button type="button" className="contact-quiet-action" onClick={() => { setReceipt(null); submission.current = null; }}>Write another message</button>
            </div>
          ) : availability === "open" || availability === "loading" ? (
            // The form is laid out while availability is checked, so it does not
            // push the direct-contact panel down when the answer arrives.
            <form onSubmit={event => { event.preventDefault(); if (!sending && availability === "open") void send(); }}>
              <fieldset disabled={sending || availability === "loading"} className="contact-form-body">
                <IntentionPicker label="What brings you here?" options={purposes} value={draft.purpose} onChange={value => update("purpose", value)} />
                <div className="contact-fields">
                  <FormField label="Your name">{props => <input {...props} name="name" autoComplete="name" required maxLength={120} value={draft.name} onChange={event => update("name", event.target.value)} />}</FormField>
                  <FormField label="Email address" hint="The address Henok should reply to.">{props => <input {...props} name="email" type="email" autoComplete="email" required maxLength={254} value={draft.email} onChange={event => update("email", event.target.value)} />}</FormField>
                </div>
                <FormField label="Organization" optional>{props => <input {...props} name="organization" autoComplete="organization" maxLength={160} value={draft.organization} onChange={event => update("organization", event.target.value)} />}</FormField>
                <FormField label="Your message" hint={draft.purpose === "project" ? "What would you like to build, who is it for, and where are you starting?" : "Share a little context and what you would like to discuss."}>{props => <textarea {...props} name="message" required minLength={10} maxLength={6000} rows={6} value={draft.message} onChange={event => update("message", event.target.value)} />}</FormField>
                {draft.purpose === "project" && <div className="contact-fields">
                  <FormField label="Timeline" optional>{props => <input {...props} name="timeline" placeholder="A target date, or still exploring" maxLength={120} value={draft.timeline} onChange={event => update("timeline", event.target.value)} />}</FormField>
                  <FormField label="Budget range" optional>{props => <input {...props} name="budget" placeholder="A range, or not yet decided" maxLength={120} value={draft.budget} onChange={event => update("budget", event.target.value)} />}</FormField>
                </div>}
                <div className="contact-honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" value={draft.website} onChange={event => update("website", event.target.value)} /></label></div>
                <label className="contact-consent"><input type="checkbox" checked={draft.consent} required onChange={event => update("consent", event.target.checked)} /><span>I agree to have my details used to respond to this message.</span></label>
                <p className="contact-privacy">{contact.privacy} <Link to="/privacy">Read the privacy page.</Link></p>
                {availability === "loading" && <p role="status" className="contact-privacy">Checking contact availability…</p>}
                {error && <p role="alert" className="contact-error">{error}</p>}
                <DotButton label={sending ? "Sending your message…" : "Send message"} type="submit" disabled={sending} endIcon={<ArrowUpRight />} />
              </fieldset>
            </form>
          ) : <div className="contact-availability">
            <h2 className="dot-section-heading">{availability === "error" ? "The form could not be reached." : "Please use email for now."}</h2>
            <p>{availability === "error" ? "You can still contact Henok directly. No message has been sent." : "The contact form is temporarily unavailable. Send a note directly to the address alongside."}</p>
            <button className="contact-quiet-action" type="button" onClick={() => setAttempt(value => value + 1)}>Try the form again</button>
          </div>}
        </section>
        <Surface as="aside" className="contact-aside" aria-label="Direct contact and next steps">
          <div className="contact-letter-art" aria-hidden="true"><span /><span /><Mail /></div>
          <p className="dot-label">A direct conversation</p>
          <h2 className="dot-section-heading">Prefer email?</h2>
          <a className="contact-email" href={`mailto:${author.email}`}>{author.email}<ArrowUpRight aria-hidden="true" /></a>
          <p className="contact-aside-copy">For projects, collaboration, writing, speaking, or a simple hello.</p>
          <div className="contact-next"><h3 className="dot-section-heading">What happens next</h3><p>{contact.next}</p></div>
          <TextLink className="contact-quiet-action" to="/about#about-resume">Background &amp; résumé</TextLink>
        </Surface>
      </div>
    </PageShell>
  );
}
