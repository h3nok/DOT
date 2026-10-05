import { useEffect } from "react";

import termsText from "../../content/pages/terms.md?raw";
import { PageHeader, PageShell } from "../../shared/PageShell";
import { ProseMarkdown } from "../../shared/ProseMarkdown";
import { SiteColophon } from "../../shared/SiteColophon";

/**
 * Who runs the site, what an optional payment is, and how to undo one (L7).
 *
 * Like the privacy page, the text lives in `content/pages/terms.md` so that the
 * build can also serve it to readers without JavaScript. When the payment path
 * changes, this page changes in the same commit.
 */
export default function TermsPage() {
  useEffect(() => {
    document.title = "Terms and refunds — Digital Organism Theory";
  }, []);

  return (
    <PageShell header={<PageHeader />} footer={<SiteColophon />}>
      <div className="mx-auto max-w-2xl">
        <ProseMarkdown content={termsText} />
      </div>
    </PageShell>
  );
}
