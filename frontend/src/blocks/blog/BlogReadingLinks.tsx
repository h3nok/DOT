import { ArrowUpRight, Rss, Send } from "lucide-react";
import { Link } from "react-router-dom";

import { FocusNav } from "../../attention-os/focus-nav/FocusNav";
import blog from "../../content/blog.json";
import { projectInquiryHref } from "../../content/builder";
import { FEED_URL } from "../../content/essays/essays";

/** Reading stays first; these quiet alternatives follow the archive on mobile. */
export function BlogReadingLinks() {
  return (
    <aside className="blog-reading-links" aria-label="Follow the writing and work together">
      <section className="blog-follow" aria-labelledby="blog-follow-title">
        <div className="blog-follow-art" aria-hidden="true"><span /><span /><Send /></div>
        <p className="dot-label">Stay in touch</p>
        <h2 id="blog-follow-title" className="dot-section-heading">Read at your pace.</h2>
        <p className="blog-support-copy">{blog.followDescription}</p>
        <FocusNav
          label="Ways to follow the writing"
          primary={{ href: FEED_URL, label: "Follow with RSS", icon: <Rss /> }}
          secondary={[
            { to: "/readers", label: "Open the reader list" },
          ]}
        />
      </section>

      <section className="blog-contact" aria-labelledby="blog-contact-title">
        <p className="dot-label">Work together</p>
        <h2 id="blog-contact-title" className="dot-section-heading">{blog.contactTitle}</h2>
        <p className="blog-support-copy">{blog.contactDescription}</p>
        <FocusNav
          label="Discuss a build"
          primary={{ to: projectInquiryHref(), label: "Discuss a project", endIcon: <ArrowUpRight /> }}
        />
        <Link to="/about#about-resume" className="blog-profile-link">Background &amp; résumé<ArrowUpRight aria-hidden="true" /></Link>
      </section>
    </aside>
  );
}
