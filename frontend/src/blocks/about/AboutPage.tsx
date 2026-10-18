import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, Blocks, Download, Layers, Workflow } from "lucide-react";
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
import { AppearanceControl } from "../../organism/AppearanceControl";
import { PageHeader, PageShell } from "../../shared/PageShell";
import { ProseMarkdown } from "../../shared/ProseMarkdown";
import { SiteColophon } from "../../shared/SiteColophon";
import { PageIntro, SectionHeading, Surface, TextLink } from "../../shared/design-system/Editorial";
import type { IntentTone } from "../../attention-os/focus-nav/IntentCard";
import BookOneCover from "../publication/BookOneCover";
import { ProductArtwork } from "./AboutArtwork";
import { ProjectShowcase } from "./ProjectShowcase";
import { MovementShowcase } from "./MovementShowcase";
import "./about.css";

const projectTones: Record<string, IntentTone> = { sullix: "copper", medroute: "blue", stay: "forest" };
const serviceVisuals = [{ icon: <Blocks />, tone: "forest" }, { icon: <Workflow />, tone: "blue" }, { icon: <Layers />, tone: "plum" }] as const;

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
      wide
      header={<PageHeader controls={<AppearanceControl placement="inline" />} />}
      footer={<SiteColophon variant="personal" />}
      className="about-page"
    >
      <div className="about-hero">
        <div className="about-hero-copy">
          {author.photo && (
            <img src={author.photo} alt={`Portrait of ${author.name}`} className="about-portrait" />
          )}
          <PageIntro eyebrow={builder.title} title={<>{author.name}{author.suffix && <span className="about-suffix">, {author.suffix}</span>}</>} titleClassName="about-name">
            <p className="about-role">{author.role}</p>
          </PageIntro>
        </div>
        <div className="about-hero-invitation">
          <p className="about-headline">{builder.headline}</p>
          <div className="about-actions">
            <DotButton
              to={projectInquiryHref()}
              label="Discuss a project"
              endIcon={<ArrowUpRight />}
              className="about-primary"
            />
            <TextLink href="#about-resume" icon={<ArrowRight />}>View résumé</TextLink>
          </div>
        </div>
      </div>

      <nav aria-label="On this page" className="about-section-nav">
        <a href="#about-products">Selected work</a>
        <a href="#about-services">Project work</a>
        <a href="#about-resume">Career & résumé</a>
        <a href="#about-contact">Contact</a>
      </nav>

      <section aria-labelledby="about-products" className="about-section">
        <SectionHeading id="about-products" eyebrow="Ventures & products" title="Selected work" />
        <ul className="about-projects">
          {builderProjects.map((project) => {
            const destination = projectDestination(project);
            const ProjectHeading = project.movement ? "h4" : "h3";
            const identity = (
              <div className="about-project-identity">
                <div className="about-project-name">
                  <p className="dot-label">{project.status}</p>
                  <ProjectHeading>{project.name}</ProjectHeading>
                </div>
                <div className="about-project-byline">
                  <p className="about-project-role">{project.role}</p>
                  <p className="about-period">{project.period}</p>
                </div>
              </div>
            );
            const card = (
              <Surface as={project.movement ? "article" : "li"} variant="open" key={project.slug} id={`project-${project.slug}`} className="about-project" tone={projectTones[project.slug] ?? "forest"}>
                <div className="about-project-visual">{project.showcase ? <ProjectShowcase showcase={project.showcase} /> : <ProductArtwork kind={project.slug} />}</div>
                <div className="about-project-copy">
                  {identity}
                  <div className="about-project-detail">
                    <div className="about-project-description">
                      <p className="about-project-tagline">{project.tagline}</p>
                    </div>
                    <div className="about-project-links">
                      {destination && (
                        <TextLink href={destination.href} aria-label={`${destination.label}: ${project.name}`}>{destination.label}</TextLink>
                      )}
                      <details className="about-disclosure about-project-notes">
                        <summary>Project details</summary>
                        <p>{project.description}</p>
                        <ul className="about-project-stack" aria-label={`Technologies for ${project.name}`}>
                          {project.stack.map(technology => <li key={technology}>{technology}</li>)}
                        </ul>
                      </details>
                    </div>
                  </div>
                </div>
              </Surface>
            );
            return project.movement ? (
              <Surface as="li" variant="open" key={project.slug} className="about-project-family" tone="forest">
                <MovementShowcase movement={project.movement} />
                {card}
              </Surface>
            ) : card;
          })}
        </ul>
        {otherBuilderProjects.map((project) => {
          const destination = projectDestination(project);
          return destination && (
            <p key={project.slug} className="about-other-work">
              Also in open source:{" "}
              <TextLink href={destination.href}>{project.name}</TextLink>
              <span>Isolation for AI agent tools.</span>
            </p>
          );
        })}
      </section>

      <section aria-labelledby="about-services" className="about-section">
        <SectionHeading id="about-services" eyebrow="Independent contracts" title="Project work" />
        <div className="about-services">
          {builder.services.map((service, index) => (
            <Surface variant="open" key={service.title} tone={serviceVisuals[index % serviceVisuals.length].tone}>
              <span className="about-service-symbol" aria-hidden="true">{serviceVisuals[index % serviceVisuals.length].icon}</span>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </Surface>
          ))}
        </div>
      </section>

      <section aria-labelledby="about-resume" className="about-section">
        <SectionHeading id="about-resume" eyebrow={career.background} title="Career & résumé" />
        <div className="about-career-grid">
          <ol className="about-experience">
            {career.experience.map((job) => (
              <li key={job.id}>
                <p className="about-period">{job.period}</p>
                <h3>{job.company}</h3>
                <p className="about-job-role">{job.role}</p>
              </li>
            ))}
          </ol>
          <Surface className="about-credentials" tone="plum">
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
              <TextLink href={resumeHref()} download={author.resumeUrl?.startsWith("/") || undefined} icon={<Download />}>
                {author.resumeUrl ? "Download résumé" : "Request full résumé"}
              </TextLink>
              {author.resumeOnlineUrl && <TextLink href={author.resumeOnlineUrl}>Read online</TextLink>}
            </div>
            <p className="about-resume-note">Full experience, research, and technical background.</p>
          </Surface>
        </div>
      </section>

      <section aria-labelledby="about-writing" className="about-section about-writing">
        <div className="about-writing-jacket">
          <Link to={DOT_BOOK_ONE_ROUTE} aria-label="Open Book One: Consciousness, A Digital Organism">
            <BookOneCover manifest={manifest ?? undefined} />
          </Link>
        </div>
        <div>
          <SectionHeading id="about-writing" eyebrow="Alongside the engineering" title="Writing & research" />
          <p className="about-writing-intro">{author.summary}</p>
          <div className="about-writing-links">
            <TextLink to={DOT_BOOK_ONE_ROUTE}>Read Book One</TextLink>
            <TextLink to="/blog">Essays and letters</TextLink>
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

      <Surface as="section" aria-labelledby="about-contact" className="about-section about-contact" tone="blue">
        <SectionHeading id="about-contact" eyebrow="Have something in mind?" title="Contact" />
        <div>
          <p className="about-contact-intro">{builder.contactIntro}</p>
          <TextLink to="/contact">Start a conversation</TextLink>
          <a href={contact.href} className="about-contact-address">{contact.label}<ArrowUpRight aria-hidden="true" /></a>
          <p className="about-profiles">
            {authorProfiles().map((profile) => (
              <TextLink key={profile.href} href={profile.href} rel="noreferrer me">{profile.label}</TextLink>
            ))}
          </p>
          <p className="about-contact-note">Also for writing, research, interviews, and requests about your data.</p>
        </div>
      </Surface>
    </PageShell>
  );
}
