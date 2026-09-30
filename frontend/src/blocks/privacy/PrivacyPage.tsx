import { useEffect } from "react";

import privacyText from "../../content/pages/privacy.md?raw";
import { PageHeader, PageShell } from "../../shared/PageShell";
import { ProseMarkdown } from "../../shared/ProseMarkdown";
import { SiteColophon } from "../../shared/SiteColophon";

/**
 * What the site handles, stated plainly enough to check (L7, L9; ADR-0033).
 *
 * The text lives in `content/pages/privacy.md` so that the build can also serve
 * it to readers without JavaScript. When a feature starts handling personal
 * data, this page changes in the same commit.
 */
export default function PrivacyPage() {
  useEffect(() => {
    document.title = "Privacy — Digital Organism Theory";
  }, []);

  return (
    <PageShell header={<PageHeader />} footer={<SiteColophon />}>
      <div className="mx-auto max-w-2xl">
        <ProseMarkdown content={privacyText} />
      </div>
    </PageShell>
  );
}
