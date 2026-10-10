import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import { author } from "../../../content/author";
import { pageUrl } from "../../../content/pageUrl";
import { writingRoute, type WritingDelivery } from "../../../services/OrchestratorWritingService";

const SITE_URL = import.meta.env.VITE_SITE_URL || "https://dotheory.org";

export function writingExport(workId: string, number: number, source: { delivery: WritingDelivery; body: string }) {
  const manifest = source.delivery.manifest;
  if (!manifest || source.delivery.withdrawn || manifest.release.number !== number) throw new Error("Only the selected public release can be exported.");
  const url = pageUrl(writingRoute(workId, number));
  const claims = manifest.claims.map((claim) => `- ${claim.statement} (${claim.epistemic_level}; ${claim.origin === "sourced" ? "Sourced" : "Author-originated"})`).join("\n");
  const sources = manifest.sources?.map((source) => `- ${source.external_uri}${source.locator ? ` — ${source.locator}` : ""}`).join("\n");
  const markdown = [source.body, `Originally published by ${author.name}: ${url}`, `Published version ${number}.`, ...(claims ? ["## Claim ledger", claims] : []), ...(sources ? ["## Sources", sources] : [])].join("\n\n") + "\n";
  const transformUrl = (value: string) => {
    const safe = defaultUrlTransform(value);
    return safe.startsWith("/") && !safe.startsWith("//") ? new URL(safe, SITE_URL).href : safe;
  };
  const bodyHtml = renderToStaticMarkup(<ReactMarkdown skipHtml remarkPlugins={[remarkGfm]} urlTransform={transformUrl}>{markdown}</ReactMarkdown>);
  const html = renderToStaticMarkup(<><h1>{manifest.title}</h1>{manifest.summary && <p>{manifest.summary}</p>}<div dangerouslySetInnerHTML={{ __html: bodyHtml }} /></>);
  const document = `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><title>${escapeHtml(manifest.title)}</title><link rel="canonical" href="${escapeHtml(url)}"></head><body>${html}</body></html>\n`;
  return { title: manifest.title, summary: manifest.summary, url, markdown: `# ${manifest.title}\n\n${manifest.summary ? `${manifest.summary}\n\n` : ""}${markdown}`, html, document, text: `${manifest.title}\n\n${manifest.summary ? `${manifest.summary}\n\n` : ""}${markdown}` };
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
