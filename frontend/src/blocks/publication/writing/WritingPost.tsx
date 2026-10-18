import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import BookMarkdown from "../../../attention-os/reader/BookMarkdown";
import { author } from "../../../content/author";
import type { WritingDraft } from "../../../services/OrchestratorWritingService";
import { imageMap } from "./manuscriptMedia";
import "../../essays/essay.css";

/** The same typography, artwork and reading measure in Studio and publication. */
export function WritingPost({ draft, edition, children }: { draft: WritingDraft; edition: string; children?: ReactNode }) {
  const cover = draft.presentation?.cover;
  const banner = cover && draft.assets?.find(asset => asset.path === cover.path);
  const format = draft.presentation?.format === "case-study" ? "Case study" : draft.presentation?.format === "letter" ? "Letter" : "Essay";
  return <article className="post-article">
    <header className="post-heading">
      <p className="dot-label post-kicker">{draft.presentation?.series || format}</p>
      <h1 className="post-title">{draft.title || "Untitled draft"}</h1>
      {draft.summary && <p className="post-summary">{draft.summary}</p>}
      <div className="post-byline"><Link to="/about">{author.name}</Link><span>{edition}</span></div>
    </header>
    {cover && banner && <figure className="post-cover"><img src={banner.src} alt={cover.alt} width={banner.width} height={banner.height} decoding="async" />{cover.caption && <figcaption>{cover.caption}</figcaption>}</figure>}
    <div className="post-reading-column mt-10">
      <BookMarkdown content={draft.body} variant="post" images={imageMap(draft.assets)} restrictImages />
      {children}
    </div>
  </article>;
}
