import { useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Code2, PenLine, ShieldCheck } from "lucide-react";

import { author, authorContact } from "../../content/author";
import READERS from "../../content/readers.json";
import { ESSAYS_PUBLISHED, FEED_URL } from "../../content/essays/essays";
import { ReaderListForm } from "../../dot/ReaderListForm";
import { PageHeader, PageShell } from "../../shared/PageShell";
import { SiteColophon } from "../../shared/SiteColophon";
import { PageIntro, Surface, TextLink } from "../../shared/design-system/Editorial";
import type { IntentTone } from "../../attention-os/focus-nav/IntentCard";
import { AppearanceControl } from "../../organism/AppearanceControl";
import "./readers.css";

const LINK =
  "text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-[color:var(--organism-accent-strong)]";
const LIST_STATE = "readers-state";
const TOPIC_ICONS = [Code2, PenLine, BookOpen];

/**
 * The reader list's own address (ADR-0025), so a talk, a podcast, or an essay
 * can send someone to one place to hear again. It is the open door, not the
 * invited circle: nothing here admits anyone to anything.
 */
export default function ReadersPage() {
  useEffect(() => {
    document.title = `${READERS.title} — ${author.name}`;
  }, []);

  return (
    <PageShell wide className="readers-page" header={<PageHeader controls={<AppearanceControl placement="inline" />} />} footer={<SiteColophon variant="personal" />}>
      <div className="readers-layout">
        <div className="readers-editorial">
          <PageIntro eyebrow={READERS.title} title={READERS.heading} titleClassName="readers-title">
            <p className="readers-description">{READERS.description}</p>
          </PageIntro>
          <ul className="readers-topics" aria-label="What the writing covers">
            {READERS.topics.map((topic, index) => {
              const Icon = TOPIC_ICONS[index];
              return <Surface as="li" key={topic.id} tone={topic.tone as IntentTone} className="readers-topic">
                <Icon aria-hidden="true" />
                <div><h2>{topic.label}</h2><p>{topic.description}</p></div>
                <span className="readers-paper-lines" aria-hidden="true"><i /><i /><i /></span>
              </Surface>;
            })}
          </ul>
        </div>
        <div className="readers-signup">
          <ReaderListForm
            source="front"
            fallback={<ListNotOpen />}
            unavailableFallback={<ListUnavailable />}
            loadingFallback={<Surface className={LIST_STATE}><p role="status">Checking whether the list is open…</p></Surface>}
          />
          <div className="readers-commitments">
            <p className="readers-commitment-heading"><ShieldCheck aria-hidden="true" />Your address, respected.</p>
            <ul>{READERS.commitments.map((commitment) => <li key={commitment}>{commitment}</li>)}</ul>
            <TextLink to="/privacy" icon={null}>How addresses are kept</TextLink>
          </div>
        </div>
      </div>
      <p className="readers-browse">Prefer to read here? <TextLink to="/blog">Browse the writing</TextLink></p>
    </PageShell>
  );
}

function ListNotOpen() {
  return (
    <Surface as="section" className={LIST_STATE}>
      <h2 className="font-serif text-xl text-foreground">The list is not open yet.</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {ESSAYS_PUBLISHED ? (
          <>
            Until it is, the{" "}
            <a href={FEED_URL} className={LINK}>
              RSS feed
            </a>{" "}
            carries every new essay, with nothing to sign up for.
          </>
        ) : (
          <>
            Until it is, everything published so far is free to read with no
            account, beginning with{" "}
            <Link to="/book/digital-organism-theory" className={LINK}>
              Book One
            </Link>
            .
          </>
        )}
      </p>
    </Surface>
  );
}

function ListUnavailable() {
  const contact = authorContact();
  return (
    <Surface as="section" className={LIST_STATE} role="alert">
      <h2 className="font-serif text-xl text-foreground">
        The reader list could not be reached.
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Its availability could not be checked. Try again later, or contact the
        author via{" "}
        <a href={contact.href} className={LINK} rel="noreferrer">
          {contact.label}
        </a>
        .{" "}
        <Link to="/book/digital-organism-theory" className={LINK}>
          Book One
        </Link>{" "}
        is still free to read, with no account.
      </p>
    </Surface>
  );
}
