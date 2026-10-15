import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import firstCover from "../../content/essays/amm-chapter-one-the-leech/cover.webp";
import secondCover from "../../content/essays/amm-chapter-two-the-leechs-anatomy/cover.webp";
import AMM from "../../content/amm.json";
import { fetchReleasedWriting, type ReleasedWriting } from "../../services/OrchestratorWritingService";

export function AmmChapters() {
  const [writing, setWriting] = useState<ReleasedWriting[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    void fetchReleasedWriting(controller.signal, true).then(entries => { if (!controller.signal.aborted) setWriting(entries); }).catch(() => { /* The cards identify earlier editions; the reader checks the live release before opening. */ });
    return () => controller.abort();
  }, []);
  const chapters = [
    { slug: "amm-chapter-one-the-leech", title: "The Leech", cover: firstCover, summary: "Inversion, inherited culture, and the organization of power.", note: "Under revision · the author’s framing is changing" },
    { slug: "amm-chapter-two-the-leechs-anatomy", title: "The Leech’s Anatomy", cover: secondCover, summary: "Two strategic heads. Four feeding interfaces. One public sustaining them.", note: "Figures include their cited sources and limits" },
  ];
  return <section className="amm-chapters" id="amm-chapters" aria-labelledby="amm-chapters-title">
    <header className="amm-section-heading"><div><p className="amm-eyebrow">The longer argument</p><h2 id="amm-chapters-title">Read the manifesto.</h2></div><p>Begin with the short introduction, or enter through the chapters. Earlier editions remain available while the work develops.</p></header>
    <div className="amm-chapter-grid">
      {chapters.map((chapter, index) => {
        const native = writing.find(entry => entry.work_slug === chapter.slug);
        const cover = native ? native.cover?.src : chapter.cover;
        return <article key={chapter.slug}>{cover && !native?.withdrawn_at && <Link to={`/essays/${chapter.slug}`} className="amm-chapter-image" aria-hidden="true" tabIndex={-1}><img src={cover} alt="" width={1280} height={720} loading="lazy" /></Link>}<div className="amm-chapter-copy"><p className="amm-eyebrow">Chapter 0{index + 1} · {native?.withdrawn_at ? "Withdrawn" : native ? `Version ${native.release_number}` : "Earlier edition"}</p><h3><Link to={`/essays/${chapter.slug}`}>{native?.title ?? chapter.title} <ArrowRight aria-hidden="true" /></Link></h3><p>{native?.withdrawn_at ? "The latest edition has been withdrawn." : native ? native.summary : chapter.summary}</p><span className="amm-revision-label">{native ? "Open the publication record" : chapter.note}</span></div></article>;
      })}
    </div>
  </section>;
}

export function AmmMovement() {
  return <section className="amm-movement" aria-labelledby="amm-movement-title"><a className="amm-movement-mark" href={AMM.artwork.movementUrl} aria-label="4Us — Economy for Us"><span>4</span>Us<small>Economy for Us</small></a><div><p className="amm-eyebrow">From critique to construction</p><h2 id="amm-movement-title">Build the alternative.</h2><p>4Us is an economic sovereignty movement developing practical alternatives through cooperation. Sullix is its first platform test: useful technology, shared capacity, and communities with a say in the systems they depend on.</p><a className="amm-text-link" href={AMM.artwork.movementUrl} rel="noreferrer">Explore the 4Us movement <ArrowUpRight aria-hidden="true" /></a><span className="amm-movement-stage">In development · Start small. Test with real people.</span></div></section>;
}
