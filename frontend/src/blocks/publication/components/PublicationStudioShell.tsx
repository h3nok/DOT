import { useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { type PublicationProjectRead, type PublicationSectionRead } from "../../../services/OrchestratorPublicationService";
import { DotWordmark } from "../../../shared/DotWordmark";
import { ProjectOutline } from "./ProjectOutline";
import { SectionEditor } from "./SectionEditor";
import { ReleasePanel } from "./ReleasePanel";

interface PublicationStudioShellProps {
  project: PublicationProjectRead;
  sections: PublicationSectionRead[];
  onRefreshSections: () => Promise<void>;
}

export function PublicationStudioShell({ project, sections, onRefreshSections }: PublicationStudioShellProps) {
  const [activeSectionId, setActiveSectionId] = useState<string | null>(
    sections.length > 0 ? sections[0].id : null
  );

  const activeSection = sections.find((s) => s.id === activeSectionId) || null;

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border/60 px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/studio"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
            title="All publications"
            aria-label="All publications"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
          <DotWordmark className="hidden font-mono dot-micro uppercase sm:inline" />
          <span className="hidden text-muted-foreground sm:inline">/</span>
          <span className="truncate font-serif text-sm font-semibold">{project.title}</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <label className="sr-only" htmlFor="studio-section-select">
            Current section
          </label>
          <select
            id="studio-section-select"
            value={activeSectionId ?? ""}
            onChange={(event) => setActiveSectionId(event.target.value || null)}
            className="max-w-36 bg-transparent font-serif text-xs text-foreground outline-none md:hidden"
          >
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.title}
              </option>
            ))}
          </select>
          <span className="font-mono uppercase text-muted-foreground">
            {project.status}
          </span>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          <Panel
            id="studio-outline"
            defaultSize={18}
            minSize={14}
            maxSize={28}
            collapsible
            collapsedSize={0}
            className="hidden md:block"
          >
            <ProjectOutline
              project={project}
              sections={sections}
              activeSectionId={activeSectionId}
              onSelectSection={setActiveSectionId}
              onRefresh={onRefreshSections}
            />
          </Panel>

          <PanelResizeHandle className="hidden w-px bg-border/60 transition-colors hover:bg-[color:var(--organism-accent-strong)] md:block" />

          <Panel id="studio-editor" defaultSize={64} minSize={42}>
            <SectionEditor section={activeSection} onRefresh={onRefreshSections} />
          </Panel>

          <PanelResizeHandle className="hidden w-px bg-border/60 transition-colors hover:bg-[color:var(--organism-accent-strong)] xl:block" />

          <Panel
            id="studio-release"
            defaultSize={18}
            minSize={15}
            maxSize={26}
            collapsible
            collapsedSize={0}
            className="hidden xl:block"
          >
            <ReleasePanel project={project} />
          </Panel>
        </PanelGroup>
      </main>
    </div>
  );
}
