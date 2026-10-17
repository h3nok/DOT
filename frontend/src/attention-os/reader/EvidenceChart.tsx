import { useId, useState } from "react";
import { parseEvidenceChart } from "./evidenceChart";
import "./evidence-chart.css";

/** One reader-controlled figure with the same data in a plain table. */
export function EvidenceChart({ source }: { source: string }) {
  const data = parseEvidenceChart(source);
  const [selected, setSelected] = useState(0);
  const id = useId();
  if (!data) return <aside className="evidence-chart-error"><p>This figure’s data needs correction before it can be displayed.</p><details><summary>Inspect the supplied data</summary><pre>{source}</pre></details></aside>;
  const row = data.rows[selected] ?? data.rows[0];
  const ticks = [0, .25, .5, .75, 1];
  return <figure className="evidence-chart" aria-labelledby={id}>
    <figcaption><p className="evidence-chart-period">{data.period} · {data.unit}</p><h3 id={id}>{data.title}</h3><p>{data.status}</p></figcaption>
    <p className="evidence-chart-instruction">Select a bar to inspect its source.</p>
    <div className="evidence-chart-bars" role="group" aria-label="Inspect a value">{data.rows.map((item, index) => <button type="button" key={index} data-kind={item.kind} aria-label={`Inspect ${item.label}: ${item.value.toLocaleString("en-US")} ${data.unit}`} aria-pressed={index === selected} onClick={() => setSelected(index)}>
      <span>{item.label}</span><strong>{item.value.toLocaleString("en-US")}</strong>
      <svg className="evidence-chart-plot" viewBox="0 0 1000 48" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <defs><pattern id={`${id}-hatch-${index}`} width="12" height="12" patternUnits="userSpaceOnUse"><path d="M-3 3L3-3M0 12L12 0M9 15L15 9" className="evidence-chart-hatch" /></pattern></defs>
        {ticks.map(tick => <line key={tick} x1={tick * 1000} x2={tick * 1000} y1="0" y2="48" className="evidence-chart-gridline" />)}
        <rect className="evidence-chart-bar" x="0" y="6" width={item.value / data.maximum * 1000} height="36" />
        {item.kind === "projection" && <rect x="0" y="6" width={item.value / data.maximum * 1000} height="36" fill={`url(#${id}-hatch-${index})`} />}
      </svg>
    </button>)}</div>
    <div className="evidence-chart-axis" aria-hidden="true">{ticks.map(tick => <span key={tick}>{(tick * data.maximum).toLocaleString("en-US")}</span>)}</div>
    {data.rows.some(item => item.kind === "projection") && <p className="evidence-chart-key"><span aria-hidden="true" />Hatched bar: projection</p>}
    <p className="evidence-chart-scale">Scale begins at 0 · ends at {data.maximum.toLocaleString("en-US")} {data.unit}</p>
    <div className="evidence-chart-source" aria-live="polite"><strong>{row.label}: {row.value.toLocaleString("en-US")} {data.unit}</strong><p>Cited in the manuscript: <a href={row.url} rel="noreferrer">{row.source}</a></p></div>
    <p className="evidence-chart-limits">{data.limits}</p>
    <details><summary>All values and sources</summary><div className="evidence-chart-table"><table><caption>{data.title} · {data.period} · {data.unit}</caption><thead><tr><th scope="col">Category</th><th scope="col">Value</th><th scope="col">Cited source</th></tr></thead><tbody>{data.rows.map((item, index) => <tr key={index}><th scope="row">{item.label}</th><td>{item.value}</td><td><a href={item.url} rel="noreferrer">{item.source}</a></td></tr>)}</tbody></table></div></details>
  </figure>;
}
