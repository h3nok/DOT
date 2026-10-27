import { ArrowRight, Compass, HelpCircle, MessageCircle } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

import { READING_PATHS } from "../../attention-os/reader/readingPaths";
import landing from "../../content/academy/landing.json";
import { PageHeader, PageShell } from "../../shared/PageShell";
import { SiteColophon } from "../../shared/SiteColophon";
import "./academy-hub.css";

const BOOK = "/book/digital-organism-theory";

const INQUIRY_LINKS = [
  {
    to: "/doctrine",
    title: "Explore the concept map",
    description: "Trace the terms and relationships in the model.",
    Icon: Compass,
  },
  {
    to: "/applied",
    title: "Review open questions",
    description: "Examine the claims, their limits, and what could test them.",
    Icon: HelpCircle,
  },
  {
    to: "/contact?purpose=writing",
    title: "Bring a question to the conversation",
    description: "Share an experience or a thoughtful question with Henok.",
    Icon: MessageCircle,
  },
];

export default function AcademyPage() {
  return (
    <PageShell
      wide
      className="academy-hub"
      header={<PageHeader />}
      footer={<SiteColophon />}
    >
      <Helmet>
        <title>{landing.title}</title>
        <meta name="description" content={landing.description} />
      </Helmet>

      <header className="academy-hub-masthead">
        <p className="dot-label">DOT Academy</p>
        <h1 className="dot-page-heading">{landing.heading}</h1>
        <p className="academy-hub-introduction">{landing.introduction}</p>
      </header>

      <section id="academy-read" className="academy-hub-section" aria-labelledby="academy-read-title">
        <header className="academy-hub-section-heading">
          <p className="dot-label">Read · Book One</p>
          <h2 id="academy-read-title">Choose a way into the book.</h2>
          <p>Begin with your own life or follow the argument from its foundations. Both paths read the same fixed edition.</p>
          <Link className="academy-hub-edition" to={BOOK}>View Book One and its contents <ArrowRight aria-hidden="true" /></Link>
        </header>
        <ol className="academy-hub-paths" aria-label="Reading paths">
          {READING_PATHS.map((path, index) => (
            <li key={path.id}>
              <Link to={`${BOOK}/${path.steps[0].slug}?path=${path.id}`} className="academy-hub-path">
                <span className="academy-hub-path-number" aria-hidden="true">0{index + 1}</span>
                <div>
                  <h3>{path.label}</h3>
                  <p>{path.purpose}</p>
                </div>
                <ArrowRight className="academy-hub-path-arrow" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="academy-hub-section academy-hub-inquiry" aria-labelledby="academy-inquiry-title">
        <header className="academy-hub-section-heading">
          <p className="dot-label">Explore · Question · Discuss</p>
          <h2 id="academy-inquiry-title">Follow your questions.</h2>
          <p>Look closely at the model. Bring it back to something you have experienced. Leave room to change your mind.</p>
        </header>
        <nav aria-label="Continue the inquiry" className="academy-hub-tools">
          {INQUIRY_LINKS.map(({ to, title, description, Icon }) => (
            <Link key={to} to={to} className="academy-hub-tool">
              <Icon className="academy-hub-tool-icon" aria-hidden="true" />
              <span><strong>{title}</strong><span>{description}</span></span>
              <ArrowRight className="academy-hub-tool-arrow" aria-hidden="true" />
            </Link>
          ))}
        </nav>
      </section>
    </PageShell>
  );
}
