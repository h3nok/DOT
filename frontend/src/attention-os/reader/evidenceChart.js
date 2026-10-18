/** Portable, bounded chart data. No remote queries or executable expressions. */
export function parseEvidenceChart(source) {
  if (typeof source !== "string" || source.length > 24_000) return null;
  try {
    const value = JSON.parse(source);
    const text = (s, max = 800) => typeof s === "string" && s.trim().length > 0 && s.length <= max;
    if (!text(value.title, 200) || !text(value.period, 100) || !text(value.unit, 80)
      || !text(value.status) || !text(value.limits) || !Array.isArray(value.rows)
      || value.rows.length < 2 || value.rows.length > 24) return null;
    if (!value.rows.every(row => text(row.label, 140) && Number.isFinite(row.value) && row.value >= 0
      && text(row.source, 400) && text(row.url, 2048) && /^https:\/\//i.test(row.url)
      && (row.kind === undefined || ['estimate', 'projection', 'observed'].includes(row.kind)))) return null;
    const maximum = Math.max(...value.rows.map(row => row.value));
    if (!Number.isFinite(value.maximum) || value.maximum < maximum || value.maximum <= 0) return null;
    return value;
  } catch { return null; }
}
