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
  return <figure className="evidence-chart" aria-labelledby={id}>
    <figcaption><p className="evidence-chart-period">{data.period} · {data.unit}</p><h3 id={id}>{data.title}</h3><p>{data.status}</p></figcaption>
    <div className="evidence-chart-bars" role="group" aria-label="Inspect a value">{data.rows.map((item, index) => <button type="button" key={index} aria-label={`Inspect ${item.label}: ${item.value.toLocaleString("en-US")} ${data.unit}`} aria-pressed={index === selected} onClick={() => setSelected(index)}><span>{item.label}</span><span className="evidence-chart-track"><i style={{ width: `${item.value / data.maximum * 100}%` }} /></span><strong>{item.value.toLocaleString("en-US")}</strong></button>)}</div>
    <p className="evidence-chart-scale">Scale begins at 0 · ends at {data.maximum.toLocaleString("en-US")} {data.unit}</p>
    <div className="evidence-chart-source" aria-live="polite"><strong>{row.label}: {row.value.toLocaleString("en-US")} {data.unit}</strong><p>Cited in the manuscript: <a href={row.url} rel="noreferrer">{row.source}</a></p></div>
    <p className="evidence-chart-limits">{data.limits}</p>
    <details><summary>All values and sources</summary><div className="evidence-chart-table"><table><caption>{data.title} · {data.period} · {data.unit}</caption><thead><tr><th scope="col">Category</th><th scope="col">Value</th><th scope="col">Cited source</th></tr></thead><tbody>{data.rows.map((item, index) => <tr key={index}><th scope="row">{item.label}</th><td>{item.value}</td><td><a href={item.url} rel="noreferrer">{item.source}</a></td></tr>)}</tbody></table></div></details>
  </figure>;
}
