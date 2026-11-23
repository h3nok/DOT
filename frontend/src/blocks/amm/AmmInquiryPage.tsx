import { ArrowRight } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Cited, CiteThis, Eyebrow, LevelKey, ModelMap, Notebook, Records, Scene, Terms } from "../../attention-os/inquiry";
import AUTHOR from "../../content/author.json";
import { AMM_DOT_CONCEPTS, AMM_LEVELS, AMM_MODEL as M, AMM_RECORDS, AMM_TERMS, ammParts, chapterRoute, cite, type ModelQuote } from "../../content/ammModel";
import { useAmmContent } from "../../content/editable/useAmmContent";
import { DOT_BOOK_ONE_ROUTE } from "../../content/publications/dotBookOne";
import { AmmShell } from "./AmmIdentity";
import { AmmButton } from "./AmmControls";
import "./amm-model.css";

const SITE = "https://dotheory.org";
const published = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${M.edition.published}T00:00:00Z`));

/** Whole paragraphs from one section, then that section, once. */
function Paragraphs({ items }: { items: ReadonlyArray<ModelQuote> }) {
  const source = cite(items[0]).source;
  return (
    <figure className="amm-passage">
      <blockquote cite={source.href} className="amm-inquiry-paragraphs">{items.map((item) => <p key={item.text}>{item.text}</p>)}</blockquote>
      <figcaption className="inq-source"><a href={source.href}>{source.label}</a></figcaption>
    </figure>
  );
}

/**
 * For the serious inquirer (/amm/inquiry): everything needed to examine the
 * manifesto on its own terms and grow one's own account. The model, the levels
 * of claim, the working definitions, the method with a private notebook, the
 * book's own tests of itself, its records, the DOT concepts it applies, and
 * citations. Every sentence of the work is quoted, sourced and linked; the page's
 * own words are labels. Nothing the reader writes leaves the tab.
 */
export default function AmmInquiryPage() {
  const AMM = useAmmContent();
  const I = AMM.inquiry;
  const sections = [
    { id: "inquiry-model", title: I.modelTitle },
    { id: "inquiry-levels", title: I.levelsTitle },
    { id: "inquiry-terms", title: I.termsTitle },
    { id: "inquiry-method", title: I.methodTitle },
    { id: "inquiry-notebook", title: I.notebookTitle },
    { id: "inquiry-weaken", title: I.weakenTitle },
    { id: "inquiry-change", title: I.changeTitle },
    { id: "inquiry-records", title: I.recordsTitle },
    { id: "inquiry-dot", title: I.dotTitle },
    { id: "inquiry-cite", title: I.citeTitle },
  ];
  const book = `${AUTHOR.name}. The American Millennial Manifesto. ${M.edition.label}. ${published}. ${SITE}${AMM.route}`;
  const citations = [
    { id: "book", label: AMM.title, text: book },
    ...M.chapters.map((chapter) => ({ id: chapter.slug, label: chapter.title, text: `${AUTHOR.name}. “${chapter.title}.” The American Millennial Manifesto. ${M.edition.label}. ${published}. ${SITE}${chapterRoute(chapter.n)}` })),
  ];
  const steps = M.method.steps;

  return <AmmShell><div className="amm-inquiry">
    <Helmet>
      <title>{`${I.eyebrow} — ${AMM.title}`}</title>
      <meta name="description" content={I.description} />
      <meta property="og:title" content={`${I.title} — ${AMM.title}`} />
      <meta property="og:description" content={I.description} />
    </Helmet>

    <Scene id="inquiry" labelledBy="inquiry-title" wide>
      <Eyebrow>{I.eyebrow}</Eyebrow>
      <h1 id="inquiry-title" className="inq-heading">{I.title}</h1>
      <Cited size="statement" quote={cite(M.scenes.inquire.heading)} />
      <nav aria-label={I.contentsLabel}>
        <ol className="amm-inquiry-contents">{sections.map((section) => <li key={section.id}><a href={`#${section.id}`}>{section.title}</a></li>)}</ol>
      </nav>
    </Scene>

    <Scene id="inquiry-model" labelledBy="inquiry-model-title" wide>
      <h2 id="inquiry-model-title">{I.modelTitle}</h2>
      <ModelMap parts={ammParts(AMM.route)} label={AMM.model.mapLabel} caption={AMM.model.mapCaption} />
    </Scene>

    <Scene id="inquiry-levels" labelledBy="inquiry-levels-title" tone="night" wide>
      <h2 id="inquiry-levels-title">{I.levelsTitle}</h2>
      <LevelKey levels={AMM_LEVELS} label={I.levelsLabel} />
      <h3 className="amm-inquiry-subtitle">{I.argumentTitle}</h3>
      <Paragraphs items={M.argument} />
    </Scene>

    <Scene id="inquiry-terms" labelledBy="inquiry-terms-title" wide>
      <h2 id="inquiry-terms-title">{I.termsTitle}</h2>
      <Terms terms={AMM_TERMS} label={I.termsLabel} appliesLabel={I.appliesLabel} />
    </Scene>

    <Scene id="inquiry-method" labelledBy="inquiry-method-title" tone="night" wide>
      <h2 id="inquiry-method-title">{I.methodTitle}</h2>
      <Cited quote={cite(M.method.intro)} />
      <ol className="amm-inquiry-steps">
        {steps.map((step) => <li key={step.id}><div><h3>{step.label}</h3><p>{step.text.text}</p></div></li>)}
      </ol>
      <Cited quote={cite(M.method.counter)} />
    </Scene>

    <Scene id="inquiry-notebook" labelledBy="inquiry-notebook-title" wide>
      <h2 id="inquiry-notebook-title">{I.notebookTitle}</h2>
      <Notebook storageKey="amm-inquiry-notebook" title={I.notebookTitle} fileName={I.notebookFile} privacy={I.notebookPrivacy}
        prompts={steps.map((step) => ({ id: step.id, label: step.label, prompt: step.prompt.text }))}
        labels={{ save: I.notebookSave, clear: I.notebookClear, confirmClear: I.notebookConfirm, keep: I.notebookKeep, saved: I.notebookSaved, cleared: I.notebookCleared }} />
    </Scene>

    <Scene id="inquiry-weaken" labelledBy="inquiry-weaken-title" tone="night" wide>
      <h2 id="inquiry-weaken-title">{I.weakenTitle}</h2>
      <Paragraphs items={M.weaken} />
    </Scene>

    <Scene id="inquiry-change" labelledBy="inquiry-change-title" wide>
      <h2 id="inquiry-change-title">{I.changeTitle}</h2>
      <Paragraphs items={M.change} />
    </Scene>

    <Scene id="inquiry-records" labelledBy="inquiry-records-title" tone="night" wide>
      <h2 id="inquiry-records-title">{I.recordsTitle}</h2>
      <Records records={AMM_RECORDS} label={I.recordsLabel} />
    </Scene>

    <Scene id="inquiry-dot" labelledBy="inquiry-dot-title" wide>
      <h2 id="inquiry-dot-title">{I.dotTitle}</h2>
      <ul className="amm-inquiry-concepts" aria-label={I.dotLabel}>
        {AMM_DOT_CONCEPTS.map((concept) => <li key={concept.href}><a href={concept.href}>{concept.label}</a></li>)}
      </ul>
      <div className="amm-model-actions"><AmmButton to={DOT_BOOK_ONE_ROUTE} label={I.dotAction} endIcon={<ArrowRight />} /></div>
    </Scene>

    <Scene id="inquiry-cite" labelledBy="inquiry-cite-title" wide>
      <h2 id="inquiry-cite-title">{I.citeTitle}</h2>
      <CiteThis citations={citations} labels={{ copy: I.citeCopy, copied: I.citeCopied, unavailable: I.citeUnavailable }} />
      <div className="amm-model-actions">
        <AmmButton variant="primary" to={chapterRoute(1)} label={I.endAction} endIcon={<ArrowRight />} />
        <AmmButton to={AMM.route} label={I.homeAction} />
      </div>
    </Scene>
  </div></AmmShell>;
}
