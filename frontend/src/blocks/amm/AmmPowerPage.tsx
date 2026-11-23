import { useRef } from "react";
import { ArrowRight, Building2, Coins, Cpu, DoorClosed, DoorOpen, GraduationCap, HeartPulse, Home, Landmark, LayoutGrid, MonitorSmartphone, ShieldPlus, Store, Users } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { BarList, Contrast, CycleMark, Disclosure, FigureKey, FigureRow, GatePath, Note, ReachFunnel, ShareGrid, SourceList } from "../../attention-os/explainer";
import { Marked, Scene } from "../../attention-os/inquiry";
import { useReveal } from "../../attention-os/motion";
import FIGURES from "../../content/amm-capital.json";
import MEDIA from "../../content/amm-media.json";
import { AMM_MODEL as M, cite, chapterRoute, type ModelQuote } from "../../content/ammModel";
import { useAmmContent } from "../../content/editable/useAmmContent";
import { AmmShell } from "./AmmIdentity";
import { AmmButton } from "./AmmControls";
import { ModelStep, Screen, ScreenFoot } from "./AmmScreens";
import "../../attention-os/explainer/reading-scene.css";
import "./amm-power.css";

const W = M.power;
const chart = (title: string) => FIGURES.charts.find((item) => item.title === title);
const WEALTH = chart("Household wealth is unevenly distributed");
const EQUITY = chart("Ownership of corporate equity");
const ADMIN = FIGURES.administration;
const share = (rows: ReadonlyArray<{ label: string; value: number }> | undefined, label: string) => rows?.find((row) => row.label === label)?.value ?? 0;
const MANAGED = Math.round(ADMIN.rows.reduce((sum, row) => sum + row.value, 0));
const HOMES = W.housing.ftc.text.match(/roughly ([\d,]+)/)?.[1] ?? "";
const record = (id: string) => M.records.find((item) => item.id === id);
/** "Between you and shelter stands …": the need, then who stands in front of it. */
const between = (quote: ModelQuote) => quote.text.match(/^Between you and (.+?) stands (.+)\.$/)?.slice(1) ?? [quote.text, ""];
/** Colour means a position in the arrangement, the same on every figure (amm-model.css). */
const ROLE = { most: "var(--amm-most)", mostInk: "var(--amm-most-ink)", top: "var(--amm-top)", topInk: "var(--amm-top-ink)", gate: "var(--amm-gate)", gateInk: "var(--amm-gate-ink)", rest: "color-mix(in oklab, var(--foreground) 38%, transparent)" } as const;
const GROUP_FILL: Record<string, string> = { "Bottom 50%": ROLE.most, "Top 1%": ROLE.top };
/** Icons for each need and the gate in front of it, in the chapter's order. */
const NEED_ICONS = [<Home key="home" />, <HeartPulse key="care" />, <Store key="market" />, <Users key="people" />];
const GATE_ICONS = [<Building2 key="fund" />, <ShieldPlus key="insurer" />, <LayoutGrid key="platform" />, <Cpu key="algorithm" />];
const POWER_ICONS = { state: <Landmark aria-hidden="true" />, technology: <MonitorSmartphone aria-hidden="true" />, knowledge: <GraduationCap aria-hidden="true" /> };

/**
 * Organized Power (/amm/power), decided with the author on 2026-11-17: economic
 * disparity and dependence first (who holds the wealth, who needs what, and what
 * dependence does to a person's choices), then the other powers, how it enters a
 * person, the missing anchor, and how it is carried on. Every sentence is published
 * text (amm-model.json); every figure keeps its source. What a civilization is moved
 * to the diagnosis of the culture (/amm/reflect) at the author's request, 2026-11-18.
 * Colour follows a position, never a verdict: blue where most people are, rust
 * where wealth and control concentrate, brass for the gatekeepers between people
 * and what they need. Each screen of the loop says where it sits (CycleMark).
 */
export default function AmmPowerPage() {
  const AMM = useAmmContent();
  const P = AMM.power;
  const S = P.screens;
  const page = useRef<HTMLDivElement>(null);
  useReveal(page);
  /*
   * The loop as it reaches a person: power concentrates (capital, the state, technology,
   * knowledge), need becomes dependence on the gatekeepers, dependence closes the doors
   * of choice, and it enters you. Each layer wears its colour from the key.
   */
  const [concentrates, need, choice, enters, carry] = P.steps;
  const reach = [
    // Each picture names itself on hover; the layer's title carries the meaning for everyone.
    { id: concentrates.id, title: concentrates.title, href: `#${concentrates.id}`, fill: ROLE.top, ink: ROLE.topInk, icons: [
      <Coins key="capital"><title>Capital and finance</title></Coins>, <Landmark key="state"><title>The state</title></Landmark>,
      <MonitorSmartphone key="technology"><title>Technology and platforms</title></MonitorSmartphone>, <GraduationCap key="knowledge"><title>Knowledge and permission</title></GraduationCap>] },
    { id: need.id, title: need.title, href: `#${need.id}`, fill: ROLE.gate, ink: ROLE.gateInk, icons: [
      <Building2 key="fund"><title>Landlord, lender or fund</title></Building2>, <ShieldPlus key="insurer"><title>Insurer</title></ShieldPlus>,
      <LayoutGrid key="platform"><title>Platform</title></LayoutGrid>, <Cpu key="algorithm"><title>Algorithm</title></Cpu>] },
    { id: choice.id, title: choice.title, href: `#${choice.id}`, icons: [
      <DoorOpen key="open"><title>One door still open</title></DoorOpen>, ...["a", "b", "c"].map((key) => <DoorClosed key={key}><title>A door closed</title></DoorClosed>)] },
    { id: enters.id, title: enters.title, href: `#${enters.id}`, fill: ROLE.most, ink: ROLE.mostInk },
  ];
  // What the person sends back up, in Chapter Three's words: first a carrier, then an enforcer, and the thought that protects the rest.
  const citizen = W.citizen;
  const giveBack = { title: carry.title, href: `#${carry.id}`, voices: [...citizen.carrier, ...citizen.enforcer].map((line) => cite(line).text), crown: cite(citizen.protects).text };
  const state = record(W.concentrated.records.state);
  const technology = record(W.concentrated.records.technology);
  const wealthRows = ["Bottom 50%", "Middle 40%", "Next 9%", "Top 1%"].map((label) => ({ id: label, label, value: share(WEALTH?.rows, label), display: `${share(WEALTH?.rows, label)}%`, fill: GROUP_FILL[label] ?? ROLE.rest }));
  const firms = ADMIN.rows.map((row) => ({ id: row.label, label: row.label, value: row.value, display: `$${row.value} trillion`, fill: ROLE.gate }));
  const metros = W.housing.metros.map((metro) => ({ id: metro.label, label: metro.label, value: metro.value, display: `${metro.value}%`, fill: ROLE.top }));
  const roles = (["most", "top", "gate"] as const).map((id) => ({ label: P.roles[id].label, swatch: ROLE[id] }));
  /** Which step of the loop a screen belongs to. */
  const mark = (step: number) => <CycleMark count={P.steps.length} current={step} label={P.steps[step].title} />;
  const gates = W.necessity.between.map((line, index) => { const [need, gate] = between(line); return { id: need, sentence: line.text, need, gate, needIcon: NEED_ICONS[index], gateIcon: GATE_ICONS[index] }; });
  const figureSources = [...(WEALTH?.rows ?? []).slice(0, 1), ...(EQUITY?.rows ?? []), ...ADMIN.rows]
    .map((row) => ({ id: `${row.label}-${row.source}`, title: row.source, url: row.url, note: row.label }));
  const sources = [
    ...figureSources,
    { id: "ftc-homes", title: "Federal Trade Commission, single-family rental mega-investors study, 2025", url: W.housing.sources.ftc, note: HOMES },
    { id: "gao-rentals", title: "Government Accountability Office, GAO-26-108675, 2026", url: W.housing.sources.gao, note: metros.map((m) => `${m.label} ${m.display}`).join(" · ") },
  ];
  const cover = MEDIA.erosion;

  return <AmmShell><div ref={page} className="amm-power amm-home-screens">
    <Helmet>
      <title>{`${P.title} — ${AMM.title}`}</title>
      <meta name="description" content={P.description} />
      <meta property="og:title" content={P.title} />
      <meta property="og:description" content={P.description} />
      <meta property="og:image" content={`https://dotheory.org${cover.full}`} />
      <meta property="og:image:alt" content={cover.alt} />
    </Helmet>

    <Scene id="organized-power" labelledBy="organized-power-title" reveal media={<ReachFunnel layers={reach} flow={P.loopCentre} back={giveBack} label={P.loopLabel} />}>
      <ModelStep step={P.eyebrow} />
      <h1 id="organized-power-title" className="amm-power-title">{P.title}</h1>
      <p className="amm-screen-line amm-power-lead"><Marked text={cite(W.map.heading).text} mark="determine terms other people must live under" /></p>
      <ScreenFoot quotes={[W.map.heading, ...W.citizen.carrier, ...W.citizen.enforcer, W.citizen.protects]} />
      <FigureKey label={P.keyLabel} items={roles} />
    </Scene>

    <Screen id="wealth" title={S.wealth} eyebrow={mark(0)} lines={W.wealth.lines} media={
      <div className="amm-power-figures">
        <p className="amm-power-sum" data-role="most"><strong>{share(WEALTH?.rows, "Bottom 50%")}%</strong> {P.wealthBottom}</p>
        <BarList title={P.wealthTitle} rows={wealthRows} max={100} note={`${WEALTH?.period} · ${WEALTH?.rows[0].source}`} />
      </div>}>
      <ScreenFoot id="wealth" quotes={W.wealth.lines} />
    </Screen>

    <Screen id="equity" tone="night" title={S.equity} eyebrow={mark(0)} lines={W.equity.lines} reverse media={
      <FigureRow><ShareGrid value={share(EQUITY?.rows, "Top 1%")} label={P.equityTop} fill={ROLE.top} ink={ROLE.topInk} /><ShareGrid value={share(EQUITY?.rows, "Bottom 50%")} label={P.equityBottom} fill={ROLE.most} ink={ROLE.mostInk} /></FigureRow>}>
      <p className="amm-power-figure-note">{EQUITY?.period} · {EQUITY?.rows.map((row) => row.source).join(", ")}</p>
      <ScreenFoot id="equity" quotes={W.equity.lines} />
    </Screen>

    <Screen id="savings" title={S.savings} eyebrow={mark(0)} lines={W.savings.lines} media={<div className="amm-power-figures">
      <p className="amm-power-sum" data-role="gate"><strong>${MANAGED} trillion</strong> {P.managers}</p>
      <BarList title={P.savingsTitle} rows={firms} note={ADMIN.limits} />
    </div>}>
      <ScreenFoot id="savings" quotes={W.savings.lines} />
    </Screen>

    <Screen id="income" tone="night" title={S.income} eyebrow={mark(0)} lines={[W.income.drain, W.income.close]} reverse media={
      <Contrast sides={[{ direction: "up", ...W.income.upWords }, { direction: "down", ...W.income.downWords }]} />}>
      <ScreenFoot id="income" quotes={[W.income.drain, W.income.up, W.income.down, W.income.close]} />
    </Screen>

    <Screen id="housing" title={S.housing} eyebrow={mark(0)} lines={W.housing.lines} media={<div className="amm-power-figures">
      <p className="amm-power-sum" data-role="top"><strong>{HOMES}</strong> {P.homesLabel}</p>
      <BarList title={P.metrosTitle} rows={metros} max={100} note={cite(W.housing.caveat).text} />
    </div>}>
      <ScreenFoot id="housing" quotes={[W.housing.ftc, W.housing.gao, W.housing.caveat, ...W.housing.lines]} />
    </Screen>

    <Screen id="powers" tone="night" title={S.powers} eyebrow={mark(0)} lines={W.concentrated.lines} reverse media={
      <dl className="amm-power-four" aria-label={P.powersLabel}>
        <div><dt>{POWER_ICONS.state}{P.powers[1].term}</dt><dd>{state && <p><a href={state.href} rel="noopener">{state.title}</a></p>}</dd></div>
        <div><dt>{POWER_ICONS.technology}{P.powers[2].term}</dt><dd>{technology && <p><a href={technology.href} rel="noopener">{technology.title}</a></p>}</dd></div>
        <div><dt>{POWER_ICONS.knowledge}{P.powers[3].term}</dt><dd><p>{cite(W.concentrated.knowledge).text}</p></dd></div>
      </dl>}>
      <ScreenFoot id="powers" quotes={[...W.concentrated.lines, W.concentrated.knowledge]} />
    </Screen>

    <Screen id="necessity" title={S.necessity} eyebrow={mark(1)} lines={W.necessity.lines} media={
      <div className="amm-power-between">
        <p className="amm-power-between-label">{P.betweenLabel}</p>
        <GatePath steps={gates} you={P.you} label={P.betweenLabel} />
        <p className="amm-power-between-close">{cite(W.necessity.close).text}</p>
      </div>}>
      <ScreenFoot id="necessity" quotes={[...W.necessity.lines, ...W.necessity.between, W.necessity.close]} />
    </Screen>

    <Screen id="choices" tone="night" title={S.choices} eyebrow={mark(2)} lines={W.choices.lines} art="fear-the-closing-stall" reverse>
      <ScreenFoot id="choices" quotes={W.choices.lines} />
    </Screen>

    <Screen id="enters" title={S.enters} eyebrow={mark(3)} lines={[W.enters.heading, ...W.enters.lines]} art="anatomy">
      <ScreenFoot id="enters" quotes={[W.enters.heading, ...W.enters.lines]} />
    </Screen>

    <Screen id="anchor" tone="night" title={S.anchor} lines={W.anchor.lines} art="belief-6-weight-of-history" reverse>
      <ScreenFoot id="anchor" quotes={W.anchor.lines} />
      <div className="amm-model-actions"><AmmButton variant="secondary" to="/doctrine/big-c" label={P.anchorAction} endIcon={<ArrowRight />} /></div>
    </Screen>

    <Screen id="next" title={S.next} eyebrow={mark(4)} lines={[W.carry.heading, ...W.carry.lines]} art="belief-1-host-at-home">
      <ScreenFoot id="next" quotes={[W.carry.heading, ...W.carry.lines]} />
      <div className="amm-model-actions">
        <AmmButton variant="primary" to={AMM.reflect.route} label={P.carryAction} endIcon={<ArrowRight />} />
        <AmmButton variant="secondary" to={chapterRoute(2)} label={P.chapterAction} endIcon={<ArrowRight />} />
        <AmmButton variant="quiet" to={M.sources["amm-2-earlier"].route} label={P.earlierAction} />
      </div>
    </Screen>

    <Disclosure id="sources" summary={P.sourcesTitle} className="amm-power-sources">
      {WEALTH && <Note kind="source">{WEALTH.title} · {WEALTH.period}. {WEALTH.limits} {WEALTH.status}</Note>}
      {EQUITY && <Note kind="source">{EQUITY.title} · {EQUITY.period}. {EQUITY.limits} {EQUITY.status}</Note>}
      <Note kind="source">{ADMIN.title} · {ADMIN.period}. {ADMIN.limits}</Note>
      {[state, technology].map((item) => item && <Note key={item.id} kind="source">{item.title} · {item.issuer}, {item.date.slice(0, 4)}. {item.use}</Note>)}
      <SourceList sources={sources} />
    </Disclosure>
  </div></AmmShell>;
}
