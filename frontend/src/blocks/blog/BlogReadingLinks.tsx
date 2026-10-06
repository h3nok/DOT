import { ArrowUpRight, BookOpen, Rss } from "lucide-react";

import { FocusNav } from "../../attention-os/focus-nav/FocusNav";
import newsletter from "../../content/newsletter.json";
import { FEED_URL } from "../../content/essays/essays";

/** Reading stays first; these quiet alternatives follow the archive on mobile. */
export function BlogReadingLinks() {
  return (
    <aside className="blog-reading-links" aria-label="Follow the writing and explore the theory">
      <section className="blog-newsletter" aria-labelledby="blog-newsletter-title">
        <p className="dot-label">The newsletter</p>
        <h2 id="blog-newsletter-title" className="dot-section-heading">{newsletter.title}</h2>
        <p className="blog-support-copy">{newsletter.cadence} on LinkedIn.</p>
        <FocusNav
          label="Ways to follow the writing"
          primary={{ href: newsletter.url, label: "Read on LinkedIn", endIcon: <ArrowUpRight /> }}
          secondary={[
            { href: FEED_URL, label: "RSS feed", icon: <Rss /> },
            { to: "/readers", label: "Reader list" },
          ]}
        />
      </section>

      <section className="blog-book" aria-labelledby="blog-book-title">
        <BookOpen className="blog-book-icon" aria-hidden="true" />
        <p className="dot-label">The foundation</p>
        <h2 id="blog-book-title" className="dot-section-heading">Book One</h2>
        <p className="blog-support-copy">Digital Organism Theory, in full. The complete edition is free to read.</p>
        <FocusNav
          label="Explore the theory"
          primary={{ to: "/book/digital-organism-theory", label: "Read Book One" }}
        />
      </section>
    </aside>
  );
}
