import { useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { type PublicationProjectRead, type PublicationSectionRead } from "../../../services/OrchestratorPublicationService";
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
      {/* Studio Header */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border/50 px-4">
        <div className="flex items-center gap-3">
          <span className="font-serif font-semibold">DOT Studio</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm">{project.title}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full bg-accent px-2 py-1 text-accent-foreground">
            {project.status}
          </span>
        </div>
      </header>

      {/* Split Canvas Workspace */}
      <main className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* Left Sidebar: Outline */}
          <Panel defaultSize={20} minSize={15} maxSize={30}>
            <ProjectOutline
              project={project}
              sections={sections}
              activeSectionId={activeSectionId}
              onSelectSection={setActiveSectionId}
              onRefresh={onRefreshSections}
            />
          </Panel>

          <PanelResizeHandle className="w-1 bg-border/50 hover:bg-primary/50 transition-colors" />

          {/* Center Canvas: Editor */}
          <Panel defaultSize={60} minSize={40}>
            <SectionEditor section={activeSection} onRefresh={onRefreshSections} />
          </Panel>

          <PanelResizeHandle className="w-1 bg-border/50 hover:bg-primary/50 transition-colors" />

          {/* Right Sidebar: Release Panel */}
          <Panel defaultSize={20} minSize={15} maxSize={30}>
            <ReleasePanel project={project} />
          </Panel>
        </PanelGroup>
      </main>
    </div>
  );
}
