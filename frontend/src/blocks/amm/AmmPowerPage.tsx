import { ArrowRight, Briefcase, Building2, CreditCard, Database, Eye, Home, Landmark, PiggyBank, Pill, ShoppingBag, Store, Zap, type LucideIcon } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useAmmContent } from '../../content/editable/useAmmContent';
import { EvidenceChart } from '../../attention-os/reader/EvidenceChart';
import { Artwork, BarList, CardGrid, Contrast, CycleDiagram, Disclosure, ExplainerHero, ExplainerSection, FigureRow, FlowMap, Glossary, Handoff, Ledger, Note, PullQuote, Questions, ScrollStory, ShareGrid, SourceList, type FlowTier } from '../../attention-os/explainer';
import FIGURES from '../../content/amm-capital.json';
import MEDIA from '../../content/amm-media.json';
import { AmmShell } from './AmmIdentity';
import { AmmButton } from './AmmControls';
import { POWER_SECTIONS as SECTIONS } from './ammPowerMoves';
import './amm-power.css';

const LEDGER_ICONS: Record<string, LucideIcon> = { labor: Briefcase, taxes: Landmark, savings: PiggyBank, purchases: ShoppingBag, debt: CreditCard, land: Zap, attention: Eye, data: Database };
const INTERFACE_ICONS: Record<string, LucideIcon> = { home: Home, landmark: Landmark, store: Store, building: Building2, pill: Pill };
/** Chapter Two's order of the feeding interfaces: digital access, assets and finance, knowledge, public necessity. */
const ORDER = ['platforms', 'housing', 'borrowing', 'knowledge', 'public'] as const;
const TONES = ['strong', 'plain', 'dashed', 'accent'] as const;

const icon = (icons: Record<string, LucideIcon>, id: string) => { const Icon = icons[id] ?? Landmark; return <Icon />; };
const equity = (label: string) => FIGURES.charts.find(chart => chart.title === 'Ownership of corporate equity')?.rows.find(row => row.label === label)?.value ?? 0;

/**
 * How power works: the framework the chapters assume, told as a visual story.
 * One payment is followed up the power map, then the scenes show what the
 * citizen supplies, how a claim compounds, where it is collected, who holds it,
 * and what stays behind. Every scene is composed from explainer primitives and
 * the editable copy; every figure keeps its source and its limits.
 */
export default function AmmPowerPage() {
  const AMM = useAmmContent();
  const { money, capital: c } = AMM;
  const tiers: FlowTier[] = c.tiers.map(tier => ({ ...tier, tone: TONES.find(tone => tone === tier.tone) }));
  const flows = c.flows.map(flow => ({ ...flow, items: flow.items.map(item => ({ label: item.label, direction: item.direction === 'up' ? 'up' as const : 'down' as const })) }));
  const labels = c.interfaceLabels as Record<string, string>;
  const cards = ORDER.flatMap(id => money.examples.filter(item => item.id === id)).map(item => ({
    id: item.id, icon: icon(INTERFACE_ICONS, item.icon), eyebrow: labels[item.id], title: item.title, meta: item.path, emphasis: item.question,
    more: { label: c.interfaceMore, body: [{ text: item.mechanic }, { heading: c.leverageLabel, text: item.pressure }] },
  }));
  const chain = money.cycle.map((item, index) => ({ ...item, label: c.links[index] }));
  const managers = FIGURES.administration.rows.map(row => ({ id: row.label, label: row.label, value: row.value, display: `$${row.value} trillion` }));
  const equityChart = FIGURES.charts.find(chart => chart.title === 'Ownership of corporate equity');

  return <AmmShell>
    {/* Hidden for now: reachable by its address for the author, unlinked and kept out of search. */}
    <Helmet><title>{`${c.title} — ${AMM.title}`}</title><meta name="description" content={c.intro} /><meta name="robots" content="noindex" /></Helmet>

    <ExplainerHero eyebrow={c.eyebrow} title={c.title} intro={c.intro}
      image={{ ...MEDIA.erosion, caption: c.erosionCaption }} figureKey={c.imageKey} figureKeyLabel={c.imageKeyLabel}
      contents={c.glance.map((label, index) => ({ href: `#${SECTIONS[index]}`, label }))} contentsLabel={c.contentsLabel} />

    <ExplainerSection id="power" number="01" title={c.mapTitle} lead={c.mapIntro}>
      <ScrollStory steps={c.story} label={c.mapLabel} figure={step => <FlowMap tiers={tiers} links={flows} rail={c.rail} lit={step.lit} />} />
    </ExplainerSection>

    <ExplainerSection id="assault" number="02" title={c.assaultTitle} lead={c.assaultIntro}>
      <FigureRow emphasis="illustration">
        <Artwork image={{ ...MEDIA.anatomy, caption: c.anatomyCaption }} />
        <Ledger title={c.assaultLine} entries={c.ledger.map(item => ({ ...item, icon: icon(LEDGER_ICONS, item.id) }))} />
      </FigureRow>
      <PullQuote tone="loud" source={c.assaultSource}>{c.assaultClose}</PullQuote>
    </ExplainerSection>

    <ExplainerSection id="chain" number="03" title={c.chainTitle} lead={<PullQuote source={c.chainSource}>{c.chainIntro}</PullQuote>}>
      <CycleDiagram steps={chain} centre={c.chainCentre} label={c.chainLabel} returnNote={c.chainReturn} />
      <Disclosure summary={c.termsLabel}><Glossary terms={money.definitions.map(item => ({ id: item.id, term: item.term, text: item.text }))} /></Disclosure>
    </ExplainerSection>

    <ExplainerSection id="interfaces" number="04" title={c.interfacesTitle} lead={c.interfacesIntro}>
      <CardGrid cards={cards} label={c.interfacesTitle} />
    </ExplainerSection>

    <ExplainerSection id="holders" number="05" title={c.holdersTitle} lead={c.holdersIntro}>
      <FigureRow emphasis="last">
        <ShareGrid value={equity('Top 1%')} label={c.equityTop} />
        <ShareGrid value={equity('Bottom 50%')} label={c.equityBottom} tone="ink" />
        <BarList title={c.managersTitle} rows={managers} note={c.managersNote} />
      </FigureRow>
      <Note kind="source">{equityChart?.period} · {equityChart?.status}</Note>
      <PullQuote source={c.holdersSource}>{c.holdersQuote}</PullQuote>
      <Disclosure summary={c.figuresLabel}><FigureRow>{[...FIGURES.charts, FIGURES.administration].map(chart => <EvidenceChart key={chart.title} source={JSON.stringify(chart)} />)}</FigureRow></Disclosure>
    </ExplainerSection>

    <ExplainerSection id="detachment" number="06" title={c.detachmentTitle}>
      <Contrast sides={[{ direction: 'up', line: c.wealthLine, words: c.wealthWords }, { direction: 'down', line: c.obligationLine, words: c.obligationWords }]} />
      <Note kind="source">{c.detachmentSource}</Note>
      <PullQuote tone="loud">{c.detachmentQuote}</PullQuote>
      <Note link={{ href: c.detachmentExampleUrl, label: c.detachmentExampleLabel }}>{c.detachmentExample}</Note>
    </ExplainerSection>

    <ExplainerSection id="tests" title={c.questionsTitle} lead={money.testIntro}>
      <Questions items={money.tests} label={c.questionsTitle} />
    </ExplainerSection>

    <Handoff id="alternatives" label={c.alternativeLabel} line={c.alternativeLine} link={{ href: AMM.artwork.movementUrl, label: c.movementLabel }}>
      <AmmButton variant="primary" to={AMM.introduction.route} label={AMM.reading.prereqThen} endIcon={<ArrowRight />} />
      <AmmButton to={AMM.route} label="AMM home" />
    </Handoff>

    <Disclosure id="sources" summary={money.sourcesTitle} className="amm-power-sources">
      <Note>{money.sourcesIntro}</Note>
      <Note>{money.creditNote}</Note>
      <SourceList sources={money.sources} />
    </Disclosure>
  </AmmShell>;
}
