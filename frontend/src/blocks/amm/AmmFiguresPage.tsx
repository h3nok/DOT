import { useRef } from "react";
import { ArrowLeft } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { BarList, Disclosure, FigureRow, Note, ShareGrid, SourceList } from "../../attention-os/explainer";
import { useReveal } from "../../attention-os/motion";
import FIGURES from "../../content/amm-capital.json";
import { AMM_MODEL as M, chapterRoute, cite } from "../../content/ammModel";
import { useAmmContent } from "../../content/editable/useAmmContent";
import { AmmShell } from "./AmmIdentity";
import { AmmButton } from "./AmmControls";
import { Screen, ScreenFoot } from "./AmmScreens";
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
/** Colour means a position, the same on every figure: most people, concentration, and the gatekeepers. */
const ROLE = { most: "var(--amm-most)", mostInk: "var(--amm-most-ink)", top: "var(--amm-top)", topInk: "var(--amm-top-ink)", gate: "var(--amm-gate)", rest: "color-mix(in oklab, var(--foreground) 38%, transparent)" } as const;
const GROUP_FILL: Record<string, string> = { "Bottom 50%": ROLE.most, "Top 1%": ROLE.top };

/**
 * The figures behind Chapter Two (/amm/figures): the sourced charts the working
 * book refers to, four screens, each with its source. Reached from Chapter Two's
 * card on the AMM home; it replaces the longer Organized Power page (the author,
 * 2026-11-18). Nothing here asks anything of the reader (L9).
 */
export default function AmmFiguresPage() {
  const AMM = useAmmContent();
  const P = AMM.power;
  const S = P.screens;
  const page = useRef<HTMLDivElement>(null);
  useReveal(page);
  const wealthRows = ["Bottom 50%", "Middle 40%", "Next 9%", "Top 1%"].map((label) => ({ id: label, label, value: share(WEALTH?.rows, label), display: `${share(WEALTH?.rows, label)}%`, fill: GROUP_FILL[label] ?? ROLE.rest }));
  const firms = ADMIN.rows.map((row) => ({ id: row.label, label: row.label, value: row.value, display: `$${row.value} trillion`, fill: ROLE.gate }));
  const metros = W.housing.metros.map((metro) => ({ id: metro.label, label: metro.label, value: metro.value, display: `${metro.value}%`, fill: ROLE.top }));
  const sources = [
    ...[...(WEALTH?.rows ?? []).slice(0, 1), ...(EQUITY?.rows ?? []), ...ADMIN.rows].map((row) => ({ id: `${row.label}-${row.source}`, title: row.source, url: row.url, note: row.label })),
    { id: "ftc-homes", title: "Federal Trade Commission, single-family rental mega-investors study, 2025", url: W.housing.sources.ftc, note: HOMES },
    { id: "gao-rentals", title: "Government Accountability Office, GAO-26-108675, 2026", url: W.housing.sources.gao, note: metros.map((m) => `${m.label} ${m.display}`).join(" · ") },
  ];

  return <AmmShell><div ref={page} className="amm-power amm-home-screens">
    <Helmet>
      <title>{`${P.figuresTitle} — ${AMM.title}`}</title>
      <meta name="description" content={P.figuresIntro} />
      <meta property="og:title" content={P.figuresTitle} />
      <meta property="og:description" content={P.figuresIntro} />
    </Helmet>

    <header className="amm-figures-head" data-reveal>
      <h1 className="amm-power-title">{P.figuresTitle}</h1>
      <p className="amm-figures-intro">{P.figuresIntro}</p>
      <AmmButton variant="quiet" to={chapterRoute(2)} label={P.figuresBack} icon={<ArrowLeft />} />
    </header>

    <Screen id="wealth" title={S.wealth} lines={W.wealth.lines} media={
      <div className="amm-power-figures">
        <p className="amm-power-sum" data-role="most"><strong>{share(WEALTH?.rows, "Bottom 50%")}%</strong> {P.wealthBottom}</p>
        <BarList title={P.wealthTitle} rows={wealthRows} max={100} note={`${WEALTH?.period} · ${WEALTH?.rows[0].source}`} />
      </div>}>
      <ScreenFoot id="wealth" quotes={W.wealth.lines} />
    </Screen>

    <Screen id="equity" tone="night" title={S.equity} lines={W.equity.lines} reverse media={
      <FigureRow><ShareGrid value={share(EQUITY?.rows, "Top 1%")} label={P.equityTop} fill={ROLE.top} ink={ROLE.topInk} /><ShareGrid value={share(EQUITY?.rows, "Bottom 50%")} label={P.equityBottom} fill={ROLE.most} ink={ROLE.mostInk} /></FigureRow>}>
      <p className="amm-power-figure-note">{EQUITY?.period} · {EQUITY?.rows.map((row) => row.source).join(", ")}</p>
      <ScreenFoot id="equity" quotes={W.equity.lines} />
    </Screen>

    <Screen id="savings" title={S.savings} lines={W.savings.lines} media={<div className="amm-power-figures">
      <p className="amm-power-sum" data-role="gate"><strong>${MANAGED} trillion</strong> {P.managers}</p>
      <BarList title={P.savingsTitle} rows={firms} note={ADMIN.limits} />
    </div>}>
      <ScreenFoot id="savings" quotes={W.savings.lines} />
    </Screen>

    <Screen id="housing" tone="night" title={S.housing} lines={W.housing.lines} reverse media={<div className="amm-power-figures">
      <p className="amm-power-sum" data-role="top"><strong>{HOMES}</strong> {P.homesLabel}</p>
      <BarList title={P.metrosTitle} rows={metros} max={100} note={cite(W.housing.caveat).text} />
    </div>}>
      <ScreenFoot id="housing" quotes={[W.housing.ftc, W.housing.gao, W.housing.caveat, ...W.housing.lines]} />
    </Screen>

    <Disclosure id="sources" summary={P.sourcesTitle} className="amm-power-sources">
      {WEALTH && <Note kind="source">{WEALTH.title} · {WEALTH.period}. {WEALTH.limits} {WEALTH.status}</Note>}
      {EQUITY && <Note kind="source">{EQUITY.title} · {EQUITY.period}. {EQUITY.limits} {EQUITY.status}</Note>}
      <Note kind="source">{ADMIN.title} · {ADMIN.period}. {ADMIN.limits}</Note>
      <SourceList sources={sources} />
    </Disclosure>
  </div></AmmShell>;
}
