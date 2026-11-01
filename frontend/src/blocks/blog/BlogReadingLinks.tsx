import { Rss } from "lucide-react";

import blog from "../../content/blog.json";
import { projectInquiryHref } from "../../content/builder";
import { FEED_URL } from "../../content/essays/essays";
import { TextLink } from "../../shared/design-system/Editorial";

/** Reading stays first; these quiet alternatives follow the archive on mobile. */
export function BlogReadingLinks() {
  return (
    <aside className="blog-reading-links" aria-label="Follow and connect">
      <section className="blog-follow" aria-labelledby="blog-follow-title">
        <Rss className="blog-support-icon" aria-hidden="true" />
        <h2 id="blog-follow-title" className="dot-section-heading">Follow</h2>
        <div className="blog-support-links">
          <TextLink href={FEED_URL}>Follow with RSS</TextLink>
          <TextLink to="/readers">Open the reader list</TextLink>
        </div>
      </section>

      <section className="blog-contact" aria-labelledby="blog-contact-title">
        <p className="dot-label">AI & digital products</p>
        <h2 id="blog-contact-title" className="dot-section-heading">{blog.contactTitle}</h2>
        <div className="blog-support-links">
          <TextLink to={projectInquiryHref()}>Discuss a project</TextLink>
          <TextLink to="/about#about-products">View projects</TextLink>
        </div>
      </section>
    </aside>
  );
}
