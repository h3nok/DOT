import { useEffect } from "react";
import { ArrowDown, MessageCircle } from "lucide-react";

import { FocusNav } from "../../attention-os/focus-nav/FocusNav";
import { author } from "../../content/author";
import BLOG from "../../content/blog.json";
import COMMUNITY from "../../content/community.json";
import { PageHeader, PageShell } from "../../shared/PageShell";
import { SiteColophon } from "../../shared/SiteColophon";
import { PageIntro, Surface, TextLink } from "../../shared/design-system/Editorial";
import "./community.css";

export default function CommunityPage() {
  useEffect(() => { document.title = `${COMMUNITY.title} — ${author.name}`; }, []);

  return (
    <PageShell className="community-page" header={<PageHeader />} footer={<SiteColophon />}>
      <PageIntro eyebrow={`${COMMUNITY.title} · ${author.name}`} title={COMMUNITY.heading}>
        <p>{COMMUNITY.description}</p>
        <nav className="community-page-nav" aria-label="On this page">
          <a href="#community-conversation-title">Conversation<ArrowDown aria-hidden="true" /></a>
          <a href="#community-passage-title">A starting passage<ArrowDown aria-hidden="true" /></a>
        </nav>
        <p className="community-invitation">{COMMUNITY.invitation}</p>
      </PageIntro>

      <Surface as="section" className="community-passage" aria-labelledby="community-passage-title">
        <p className="dot-label">{BLOG.startingPoint.label}</p>
        <h2 id="community-passage-title" tabIndex={-1} className="dot-section-heading">{BLOG.startingPoint.title}</h2>
        <p>{BLOG.startingPoint.description}</p>
        <blockquote>
          <p>“{BLOG.startingPoint.quote}”</p>
          <cite>{BLOG.startingPoint.sourceLabel}</cite>
        </blockquote>
        <TextLink to={BLOG.startingPoint.to}>{BLOG.startingPoint.linkLabel}</TextLink>
      </Surface>

      <section className="community-section" aria-labelledby="community-conversation-title">
        <h2 id="community-conversation-title" tabIndex={-1} className="dot-section-heading">{COMMUNITY.conversationTitle}</h2>
        <p>{COMMUNITY.conversationDescription}</p>
        <FocusNav label="Take part" primary={{ to: "/contact?purpose=writing", label: COMMUNITY.conversationAction, icon: <MessageCircle /> }} />
        <p className="community-note">{COMMUNITY.status}</p>
        <TextLink to="/join">Request an invitation</TextLink>
      </section>

      <section className="community-section" aria-labelledby="community-principles-title">
        <h2 id="community-principles-title" className="dot-section-heading">{COMMUNITY.principlesTitle}</h2>
        <dl className="community-principles">
          {COMMUNITY.principles.map(principle => <div key={principle.title}>
            <dt>{principle.title}</dt><dd>{principle.description}</dd>
          </div>)}
        </dl>
      </section>

      <section className="community-section" aria-labelledby="community-follow-title">
        <h2 id="community-follow-title" className="dot-section-heading">{COMMUNITY.followTitle}</h2>
        <p>{COMMUNITY.followDescription}</p>
        <div className="community-links">
          <TextLink to="/readers">Open the reader list</TextLink>
          <TextLink href="/feed.xml">Follow with RSS</TextLink>
        </div>
      </section>

      <Surface as="section" tone="copper" className="community-support" aria-labelledby="community-support-title">
        <h2 id="community-support-title" className="dot-section-heading">{COMMUNITY.supportTitle}</h2>
        <p>{COMMUNITY.supportDescription}</p>
        <TextLink to="/support?purpose=author">{COMMUNITY.supportAction}</TextLink>
        <p className="community-note">{COMMUNITY.supportNote}</p>
      </Surface>
      <p className="community-ending">There is no need to sign up to keep reading. <TextLink to="/blog">Explore the writing</TextLink></p>
    </PageShell>
  );
}
