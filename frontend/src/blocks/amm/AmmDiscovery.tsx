import { useState } from "react";
import { pageUrl } from "../../content/pageUrl";
import AMM from "../../content/amm.json";
import type { ReleasedWriting } from "../../services/OrchestratorWritingService";
import { PublicationSharing } from "../publication/components/PublicationSharing";
import { WritingDistribution } from "../publication/components/WritingDistribution";

/** Discovery uses public URLs. Only an explicit action can publish externally. */
export function AmmDiscovery({ releases }: { releases: ReleasedWriting[] }) {
  const [selected, setSelected] = useState("");
  const release = releases.find(item => item.work_id === selected);
  const sitemap = new URL("sitemap.xml", pageUrl("/")).href;
  const feed = new URL(AMM.feed, pageUrl("/")).href;
  return <section className="amm-discovery" aria-label="AMM discovery and distribution">
    <h2>Help people find the work.</h2>
    <p>Share an entry into the writing. The original edition and reader relationship stay on this website.</p>
    <PublicationSharing title={AMM.title} path="/amm" />
    <section className="amm-discovery-search" aria-labelledby="amm-discovery-search"><h3 id="amm-discovery-search">Search and RSS</h3>
      <p>The public pages include readable HTML, canonical addresses, structured data, and a sitemap. Search-engine indexing is separate from publishing; it is not guaranteed.</p>
      <dl><dt>Sitemap</dt><dd><a href={sitemap}>{sitemap}</a></dd><dt>AMM RSS</dt><dd><a href={AMM.feed}>{feed}</a></dd><dt>Reader signup</dt><dd><a href="/amm/editions#amm-subscribe">{pageUrl("/amm/editions")}#amm-subscribe</a></dd></dl>
      <p>Verify the site and submit its sitemap in your search accounts.</p>
      <div className="amm-discovery-actions"><a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer">Open Google Search Console</a><a href="https://www.bing.com/webmasters/" target="_blank" rel="noopener noreferrer">Open Bing Webmaster Tools</a></div>
    </section>
    <section className="amm-discovery-copies" aria-labelledby="amm-discovery-copies"><h3 id="amm-discovery-copies">External editions</h3>
      <p>Prepare a complete released piece for LinkedIn, Substack, or Medium. Review its text, publish deliberately, and record the external address. Reader addresses are not transferred.</p>
      {releases.length === 0 ? <p>Publish an AMM edition from Writing Studio to prepare external copies here.</p> : <><label htmlFor="amm-distribute-release">Published AMM edition</label><select id="amm-distribute-release" value={selected} onChange={event => setSelected(event.target.value)}><option value="">Choose an edition</option>{releases.map(item => <option key={item.work_id} value={item.work_id}>{item.title} · Version {item.release_number}</option>)}</select>{release && <WritingDistribution key={`${release.work_id}-${release.release_number}`} workId={release.work_id} number={release.release_number} />}</>}
    </section>
  </section>;
}
