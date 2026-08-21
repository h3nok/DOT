import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpenText, ExternalLink, ShieldCheck, X } from "lucide-react";
import { type PublicationProjectRead, type PublicationSectionRead } from "../../../services/OrchestratorPublicationService";
import { DotWordmark } from "../../../shared/DotWordmark";
import { AppearanceControl } from "../../../organism";
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
  const [editorDirty, setEditorDirty] = useState(false);
  const [pendingSectionId, setPendingSectionId] = useState<string | null>(null);
  const [manuscriptRevision, setManuscriptRevision] = useState(0);

  useEffect(() => {
    if (activeSectionId && sections.some((section) => section.id === activeSectionId)) return;
    setActiveSectionId(sections[0]?.id ?? null);
  }, [activeSectionId, sections]);

  const activeSection = sections.find((s) => s.id === activeSectionId) || null;
  const readerHref = `/read/${encodeURIComponent(project.owner_id)}/${encodeURIComponent(project.slug)}`;

  const requestSection = (sectionId: string) => {
    if (sectionId === activeSectionId) return;
    if (editorDirty) {
      setPendingSectionId(sectionId);
      return;
    }
    setActiveSectionId(sectionId);
  };

  const refreshManuscript = async () => {
    await onRefreshSections();
    setManuscriptRevision((revision) => revision + 1);
  };

  return (
    <div className="publication-studio flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      <header className="appearance-ui-chrome publication-studio__chrome flex h-14 shrink-0 items-center justify-between border-b px-3 sm:px-4">
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
          <Link
            to={readerHref}
            target="_blank"
            rel="noopener noreferrer"
            className="dot-pill hidden sm:inline-flex"
          >
            <BookOpenText className="h-3.5 w-3.5" aria-hidden="true" />
            Read latest
            <ExternalLink className="h-3 w-3 opacity-60" aria-hidden="true" />
          </Link>
          <AppearanceControl placement="inline" />
          <Dialog.Root>
            <Dialog.Trigger asChild>
              <button
                type="button"
                className="dot-pill xl:hidden"
              >
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Edition</span>
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-[75] bg-background/55 backdrop-blur-sm" />
              <Dialog.Content
                aria-describedby={undefined}
                className="appearance-ui-panel dot-surface fixed inset-y-0 right-0 z-[76] w-[min(24rem,100vw)]"
              >
                <Dialog.Title className="sr-only">Edition desk</Dialog.Title>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                    aria-label="Close edition desk"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </Dialog.Close>
                <ReleasePanel project={project} manuscriptRevision={manuscriptRevision} />
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
          <label className="sr-only" htmlFor="studio-section-select">
            Current section
          </label>
          <select
            id="studio-section-select"
            value={activeSectionId ?? ""}
            onChange={(event) => {
              if (event.target.value) requestSection(event.target.value);
            }}
            className="max-w-36 bg-transparent font-serif text-xs text-foreground outline-none md:hidden"
          >
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.title}
              </option>
            ))}
          </select>
          <span className="dot-chip">
            {project.status}
          </span>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          <Panel
            id="studio-outline"
            defaultSize={20}
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
              onSelectSection={requestSection}
              onRefresh={refreshManuscript}
            />
          </Panel>

          <PanelResizeHandle className="group relative hidden w-px bg-border/60 transition-colors hover:bg-[color:var(--organism-accent-strong)] md:block">
            <span className="absolute left-1/2 top-1/2 h-10 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-border opacity-0 transition-opacity group-hover:opacity-100" />
          </PanelResizeHandle>

          <Panel id="studio-editor" defaultSize={59} minSize={42}>
            <SectionEditor
              section={activeSection}
              onRefresh={refreshManuscript}
              onDirtyChange={setEditorDirty}
            />
          </Panel>

          <PanelResizeHandle className="hidden w-px bg-border/60 transition-colors hover:bg-[color:var(--organism-accent-strong)] xl:block" />

          <Panel
            id="studio-release"
            defaultSize={21}
            minSize={15}
            maxSize={26}
            collapsible
            collapsedSize={0}
            className="hidden xl:block"
          >
            <ReleasePanel project={project} manuscriptRevision={manuscriptRevision} />
          </Panel>
        </PanelGroup>
      </main>

      <AlertDialog.Root
        open={pendingSectionId !== null}
        onOpenChange={(open) => !open && setPendingSectionId(null)}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-[80] bg-background/55 backdrop-blur-sm" />
          <AlertDialog.Content className="appearance-ui-panel dot-surface fixed left-1/2 top-1/2 z-[81] w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 p-6">
            <p className="font-mono dot-micro uppercase text-[color:var(--book-cinnabar)]">
              Unsaved revision
            </p>
            <AlertDialog.Title className="dot-section-heading mt-2">
              Leave this section?
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-3 text-sm leading-relaxed text-muted-foreground">
              The current manuscript has changes that have not been saved. Stay here to preserve them, or discard them and open the other section.
            </AlertDialog.Description>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <AlertDialog.Cancel className="dot-pill min-h-9">
                Keep editing
              </AlertDialog.Cancel>
              <AlertDialog.Action
                  className="dot-reading-action min-h-9 px-4 text-xs"
                onClick={() => {
                  if (pendingSectionId) setActiveSectionId(pendingSectionId);
                  setPendingSectionId(null);
                }}
              >
                Discard and open
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
