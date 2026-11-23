import { Helmet } from "react-helmet-async";
import { ArrowRight } from "lucide-react";
import { AppearanceControl } from "../../organism/AppearanceControl";
import { DotButton } from "../../shared/DotButton";
import { PageShell } from "../../shared/PageShell";
import { AmmButton } from "../amm/AmmControls";
import { Cited, CiteThis, Eyebrow, LevelKey, LevelMark, Locator, ModelMap, Notebook, Records, Scene, ShareLink, Terms, type ModelPlace } from "../../attention-os/inquiry";
import { AMM_LEVELS, AMM_MODEL, AMM_RECORDS, AMM_TERMS, ammParts, cite } from "../../content/ammModel";
import "./design-system-lab.css";

const SWATCHES = ["--background", "--foreground", "--muted", "--muted-foreground", "--border", "--primary", "--space-accent", "--scene-band"] as const;
/** Space tokens are unset until a space sets them; primitives then use these. */
const FALLBACK: Partial<Record<string, string>> = { "--space-accent": "var(--primary)", "--scene-band": "color-mix(in oklab, var(--foreground) 7%, var(--background))" };
const PLACES: ModelPlace[] = ["above", "line", "on", "below", "outside"];
const TYPE = [
  ["Display", "var(--inq-display)", "var(--font-serif)"],
  ["Statement", "var(--inq-statement)", "var(--font-serif)"],
  ["Lead", "var(--inq-lead)", "var(--font-serif)"],
  ["Body", "var(--inq-body)", "var(--font-sans)"],
  ["Small", "var(--inq-small)", "var(--font-sans)"],
] as const;

/**
 * The design-system lab (development only, /_preview/design-system), after Sullix's
 * protected lab: every token and inquiry primitive on one page, drawn with real
 * AMM data, in the reader's current theme and in the AMM space. Switch the theme
 * with the appearance control to check both lights. It proves the system; it is
 * not a page readers see.
 */
export default function DesignSystemLab() {
  const space = (name: string, accent?: string) => (
    <section className="ds-space" style={accent ? ({ "--space-accent": accent } as React.CSSProperties) : undefined} aria-label={name}>
      <h2>{name}</h2>
      <div className="ds-row">{SWATCHES.map((token) => <figure key={token} className="ds-swatch"><span style={{ background: `var(${token}, ${FALLBACK[token] ?? "transparent"})` }} /><figcaption>{token}{FALLBACK[token] ? " (falls back)" : ""}</figcaption></figure>)}</div>
      <div className="ds-row">{AMM_LEVELS.map((level) => <LevelMark key={level.id} level={level} />)}</div>
      <div className="ds-row">{PLACES.map((place) => <span key={place} className="ds-locator"><Locator lit={place} /><span>{place}</span></span>)}</div>
    </section>
  );
  return <PageShell wide header={<div className="ds-header"><strong>Design system lab</strong><AppearanceControl placement="inline" /></div>}>
    <Helmet><title>Design system lab</title><meta name="robots" content="noindex" /></Helmet>
    <div className="ds-lab">
      <h1>Design system lab</h1>
      <p className="ds-note">Layers: raw values → roles (shared/design-system/tokens.css) → Attention OS primitives (attention-os/*) → page patterns (blocks/*). Pages set <code>--space-accent</code> and <code>--scene-band</code>; they never restyle a primitive.</p>

      <h2 className="ds-group">Tokens</h2>
      {space("Digital Organism Theory")}
      <div className="amm-shell">{space("American Millennial Manifesto", "var(--amm-rust, #a73524)")}</div>
      <section className="ds-space" aria-label="Type scale">
        <h2>Type scale (follows the reader's text size)</h2>
        {TYPE.map(([name, size, family]) => <p key={name} style={{ margin: ".35rem 0", fontSize: size, fontFamily: family, lineHeight: 1.2 }}>{name} · The observer belongs in the inquiry.</p>)}
      </section>
      <section className="ds-space" aria-label="Focus and motion">
        <h2>Focus and motion</h2>
        <p><a href="#lab-focus" id="lab-focus">Tab to this link</a> to see the shared focus ring. Motion uses --motion-quick, --motion-base and --motion-reveal, and stops for reduced motion, "Hold still" and environment off.</p>
      </section>
      <section className="ds-space" aria-label="Action primitives">
        <h2>Action primitives</h2>
        <div className="ds-row">
          <DotButton label="DOT shared button" endIcon={<ArrowRight />} />
        </div>
        <div className="amm-shell" style={{ minHeight: "auto", padding: ".75rem", borderRadius: ".5rem" }}>
          <div className="ds-row">
            <AmmButton variant="primary" label="Primary action" endIcon={<ArrowRight />} />
            <AmmButton variant="secondary" label="Secondary action" endIcon={<ArrowRight />} />
            <AmmButton variant="quiet" label="Quiet action" endIcon={<ArrowRight />} />
            <ShareLink target="lab-scene" labels={{ action: "Copy a link to this idea", done: "Link copied.", unavailable: "Address:" }} />
          </div>
        </div>
      </section>

      <h2 className="ds-group">Inquiry primitives</h2>
      <Scene id="lab-scene" labelledBy="lab-scene-title" wide>
        <Eyebrow><Locator lit="above" /><span>Scene · paper · Eyebrow with locator</span></Eyebrow>
        <Cited heading={2} id="lab-scene-title" size="display" quote={cite(AMM_MODEL.scenes.model.heading)} />
        <ModelMap parts={ammParts()} label="ModelMap" caption="ModelMap: the drawing for the eye, the list for everyone." current="leech" />
      </Scene>
      <Scene id="lab-night" labelledBy="lab-night-title" tone="night" wide>
        <h2 id="lab-night-title">Scene · night · LevelKey</h2>
        <LevelKey levels={AMM_LEVELS} label="LevelKey" />
      </Scene>
      <Scene id="lab-cited" labelledBy="lab-cited-title" wide>
        <h2 id="lab-cited-title">Cited · statement and line</h2>
        <Cited size="statement" quote={{ ...cite(AMM_MODEL.scenes.inquire.heading), level: "observation" }} levels={AMM_LEVELS} />
        <Cited quote={cite(AMM_MODEL.scenes.division.lines[0])} />
      </Scene>
      <Scene id="lab-terms" labelledBy="lab-terms-title" tone="night" wide>
        <h2 id="lab-terms-title">Terms and Records</h2>
        <Terms terms={AMM_TERMS.filter((term) => ["canvas", "painting", "moral-erosion"].includes(term.id))} label="Terms" appliesLabel="Applies:" />
        <Records records={AMM_RECORDS.slice(0, 3)} label="Records" />
      </Scene>
      <Scene id="lab-notebook" labelledBy="lab-notebook-title" wide>
        <h2 id="lab-notebook-title">Notebook and CiteThis</h2>
        <Notebook storageKey="design-lab-notebook" title="Notebook" fileName="lab.txt" privacy="Stays in this tab."
          prompts={AMM_MODEL.method.steps.slice(0, 2).map((step) => ({ id: step.id, label: step.label, prompt: step.prompt.text }))}
          labels={{ save: "Save as a text file", clear: "Clear", confirmClear: "Clear everything", keep: "Keep", saved: "Saved.", cleared: "Cleared." }} />
        <CiteThis citations={[{ id: "lab", label: "Example", text: "Author. “Title.” Work. Edition. Date. https://dotheory.org/" }]} labels={{ copy: "Copy", copied: "Copied.", unavailable: "Select the text to copy it." }} />
      </Scene>
    </div>
  </PageShell>;
}
