import { useState } from "react";
import { FilePlus2, Loader2 } from "lucide-react";
import { 
  type PublicationProjectRead, 
  type PublicationSectionRead, 
  createPublicationSection 
} from "../../../services/OrchestratorPublicationService";

interface ProjectOutlineProps {
  project: PublicationProjectRead;
  sections: PublicationSectionRead[];
  activeSectionId: string | null;
  onSelectSection: (sectionId: string) => void;
  onRefresh: () => void;
}

export function ProjectOutline({ project, sections, activeSectionId, onSelectSection, onRefresh }: ProjectOutlineProps) {
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateSection = async () => {
    try {
      setIsCreating(true);
      const newSection = await createPublicationSection(project.id, {
        title: "Untitled Section",
        order: sections.length,
      });
      onRefresh();
      onSelectSection(newSection.id);
    } catch (err) {
      alert("Failed to create section");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <aside className="flex h-full flex-col bg-background">
      <div className="border-b border-border/60 px-4 py-3">
        <p className="font-mono dot-micro uppercase text-muted-foreground">Manuscript</p>
        <h2 className="mt-1 truncate font-serif text-sm font-semibold">{project.title}</h2>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {sections.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No sections yet.
          </div>
        ) : (
          <ol>
            {sections.map((section, index) => (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => onSelectSection(section.id)}
                  className={`grid w-full grid-cols-[1.5rem_minmax(0,1fr)] gap-2 border-l-2 px-3 py-2.5 text-left text-sm transition-colors ${
                    activeSectionId === section.id
                      ? "border-[color:var(--organism-accent-strong)] bg-foreground/[0.04] text-foreground"
                      : "border-transparent text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground"
                  }`}
                >
                  <span className="pt-0.5 font-mono opacity-60">{String(index + 1).padStart(2, "0")}</span>
                  <span className="min-w-0 truncate font-serif text-sm font-medium">{section.title}</span>
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>
      <div className="border-t border-border/60 p-3">
        <button
          type="button"
          onClick={handleCreateSection}
          disabled={isCreating}
          className="flex min-h-9 w-full items-center justify-center gap-2 border border-border/70 px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        >
          {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FilePlus2 className="h-4 w-4" />}
          New section
        </button>
      </div>
    </aside>
  );
}
