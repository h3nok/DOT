import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, Download } from "lucide-react";
import { Link } from "react-router-dom";

import aboutText from "../../content/pages/about.md?raw";
import { author, authorContact, authorProfiles } from "../../content/author";
import {
  builder,
  builderProjects,
  career,
  otherBuilderProjects,
  projectDestination,
  projectInquiryHref,
  resumeHref,
} from "../../content/builder";
import { formatReference } from "../../content/publications/citation";
import {
  DOT_BOOK_ONE_ROUTE,
  fetchDotBookOneManifest,
  type DotBookOneManifest,
} from "../../content/publications/dotBookOne";
import { DotButton } from "../../shared/DotButton";
import { PageHeader, PageShell } from "../../shared/PageShell";
import { ProseMarkdown } from "../../shared/ProseMarkdown";
import { SiteColophon } from "../../shared/SiteColophon";
import "./about.css";

/** The supplied career establishes the work; one direct inquiry remains primary. */
export default function AboutPage() {
  const contact = authorContact();
  const [manifest, setManifest] = useState<DotBookOneManifest | null>(null);

  useEffect(() => {
    document.title = `${author.name} — ${builder.title}`;
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchDotBookOneManifest(controller.signal)
      .then(setManifest)
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  return (
    <PageShell
      header={<PageHeader />}
      footer={<SiteColophon variant="personal" />}
      className="about-page"
    >
      <div className="about-hero">
        <div className="about-hero-copy">
          <p className="dot-label">{builder.title}</p>
          {author.photo && (
            <img src={author.photo} alt={`Portrait of ${author.name}`} className="about-portrait" />
          )}
          <h1 className="dot-page-heading about-name">
            {author.name}{author.suffix && <span className="about-suffix">, {author.suffix}</span>}
          </h1>
          <p className="about-role">{author.role}</p>
          <p className="about-headline">{builder.headline}</p>
          <p className="about-intro">{builder.summary}</p>
          <div className="about-actions">
            <DotButton
              to={projectInquiryHref()}
              label="Discuss a project"
              endIcon={<ArrowUpRight />}
              className="about-primary"
            />
            <a href="#about-resume" className="about-link">Explore the background <ArrowRight aria-hidden="true" /></a>
          </div>
        </div>
        <aside className="about-background" aria-label="Career at a glance">
          <p className="dot-label">Research depth. Product experience.</p>
          <dl>
            <div><dt>Enterprise AI</dt><dd>{career.experience[0].company}<span>{career.experience[0].role}</span></dd></div>
            <div><dt>Product co-founding</dt><dd>Sullix & Avia<span>Hands-on architecture and engineering</span></dd></div>
            {author.credentials[0] && <div><dt>Research foundation</dt><dd>{author.credentials[0].degree}<span>{author.credentials[0].institution}</span></dd></div>}
          </dl>
          <p className="about-location">Based in {career.location}</p>
        </aside>
      </div>

      <nav aria-label="On this page" className="about-section-nav">
        <a href="#about-products">Selected work</a>
        <a href="#about-services">Ways to work together</a>
        <a href="#about-resume">Career & résumé</a>
        <a href="#about-contact">Contact</a>
      </nav>

      <section aria-labelledby="about-products" className="about-section">
        <div className="about-section-heading">
          <p className="dot-label">Products & projects</p>
          <h2 id="about-products">Selected work</h2>
        </div>
        <ul className="about-projects">
          {builderProjects.map((project) => {
            const destination = projectDestination(project);
            return (
              <li key={project.slug} id={`project-${project.slug}`} className="about-project">
                <div className="about-project-identity">
                  <h3>{project.name}</h3>
                  <p className="about-project-role">{project.role}</p>
                  <p className="about-period">{project.period}</p>
                </div>
                <div className="about-project-detail">
                  <p className="about-project-tagline">{project.tagline}</p>
                  <p>{project.description}</p>
                  {destination && (
                    <a href={destination.href} className="about-link" aria-label={`${destination.label}: ${project.name}`}>
                      {destination.label}<ArrowUpRight aria-hidden="true" />
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        {otherBuilderProjects.map((project) => {
          const destination = projectDestination(project);
          return destination && (
            <p key={project.slug} className="about-other-work">
              Also in open source:{" "}
              <a href={destination.href} className="about-link">{project.name}<ArrowUpRight aria-hidden="true" /></a>
              <span>Isolation for AI agent tools.</span>
            </p>
          );
        })}
      </section>

      <section aria-labelledby="about-services" className="about-section">
        <div className="about-section-heading">
          <p className="dot-label">Independent contract work</p>
          <h2 id="about-services">Ways to work together</h2>
        </div>
        <div className="about-services">
          {builder.services.map((service) => (
            <div key={service.title}>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              <p className="about-service-deliverable">{service.deliverable}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="about-resume" className="about-section">
        <div className="about-section-heading">
          <p className="dot-label">Enterprise research to product co-founding</p>
          <h2 id="about-resume">Career & résumé</h2>
        </div>
        <div className="about-career-grid">
          <ol className="about-experience">
            {career.experience.map((job) => (
              <li key={job.id}>
                <p className="about-period">{job.period}</p>
                <h3>{job.company}</h3>
                <p className="about-job-role">{job.role}</p>
                <p className="about-job-summary">{job.summary}</p>
              </li>
            ))}
          </ol>
          <div className="about-credentials">
            <section aria-labelledby="about-education">
              <h3 id="about-education">Education</h3>
              <ul className="about-education">
                {author.credentials.map((credential) => (
                  <li key={`${credential.degree}-${credential.institution}`}>
                    <p className="about-degree">{credential.degree}</p>
                    <p>{credential.institution}, {credential.year}</p>
                    {credential.dissertation && (
                      <details className="about-disclosure">
                        <summary>Doctoral research</summary>
                        <p>
                          {credential.dissertation.url ? (
                            <a href={credential.dissertation.url} className="about-text-link">{credential.dissertation.title}</a>
                          ) : credential.dissertation.title}
                        </p>
                      </details>
                    )}
                  </li>
                ))}
              </ul>
            </section>
            <details className="about-disclosure about-toolkit">
              <summary>Technical toolkit</summary>
              <dl>
                {career.skills.map((skill) => (
                  <div key={skill.domain}><dt>{skill.domain}</dt><dd>{skill.technologies}</dd></div>
                ))}
              </dl>
            </details>
            <div className="about-resume-actions">
              <a href={resumeHref()} className="about-link" download={author.resumeUrl?.startsWith("/") || undefined}>
                {author.resumeUrl ? "Download résumé" : "Request full résumé"}<Download aria-hidden="true" />
              </a>
              {author.resumeOnlineUrl && <a href={author.resumeOnlineUrl} className="about-link">Read online<ArrowUpRight aria-hidden="true" /></a>}
            </div>
            <p className="about-resume-note">Full experience, research, and technical background.</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="about-writing" className="about-section about-writing">
        <div>
          <p className="dot-label">Alongside the engineering</p>
          <h2 id="about-writing">Writing & research</h2>
        </div>
        <div>
          <p className="about-writing-intro">{author.summary}</p>
          <div className="about-writing-links">
            <Link to={DOT_BOOK_ONE_ROUTE} className="about-link">Read Book One<ArrowUpRight aria-hidden="true" /></Link>
            <Link to="/blog" className="about-link">Essays and letters<ArrowUpRight aria-hidden="true" /></Link>
          </div>
          <details className="about-disclosure about-origin">
            <summary>Where the work comes from</summary>
            <div className="mt-5"><ProseMarkdown content={aboutText} /></div>
            <p className="mt-4 text-sm text-muted-foreground">
              From the <Link to={`${DOT_BOOK_ONE_ROUTE}/preface`} className="about-text-link">preface to Book One</Link>.
            </p>
            <p className="mt-3 text-sm">
              <Link to="/doctrine" className="about-text-link">The concept map</Link>{" · "}
              <Link to="/applied" className="about-text-link">Open seams</Link>
            </p>
          </details>
          {manifest && (
            <details className="about-disclosure about-citation">
              <summary>Citing Book One</summary>
              <p className="about-reference">{formatReference(manifest, null)}</p>
              <p className="mt-3 text-xs text-muted-foreground">Each chapter offers its own citation, with BibTeX, at its end.</p>
            </details>
          )}
        </div>
      </section>

      <section aria-labelledby="about-contact" className="about-section about-contact">
        <div>
          <p className="dot-label">Have something in mind?</p>
          <h2 id="about-contact">Contact</h2>
        </div>
        <div>
          <p className="about-contact-intro">{builder.contactIntro}</p>
          <Link to="/contact" className="about-link">Start a conversation <ArrowUpRight aria-hidden="true" /></Link>
          <a href={contact.href} className="about-contact-address">{contact.label}<ArrowUpRight aria-hidden="true" /></a>
          <p className="about-profiles">
            {authorProfiles().map((profile) => (
              <a key={profile.href} href={profile.href} className="about-link" rel="noreferrer me">{profile.label}<ArrowUpRight aria-hidden="true" /></a>
            ))}
          </p>
          <p className="about-contact-note">Also for writing, research, interviews, and requests about your data.</p>
        </div>
      </section>
    </PageShell>
  );
}
