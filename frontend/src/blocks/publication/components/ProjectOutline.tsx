import { useState } from "react";
import { Loader2 } from "lucide-react";
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
    <div className="flex h-full flex-col bg-background/50 border-r border-border/50">
      <div className="p-4 border-b border-border/50">
        <h2 className="font-semibold text-sm truncate">{project.title}</h2>
        <p className="text-xs text-muted-foreground mt-1 capitalize">{project.visibility} Project</p>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {sections.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No sections yet.
          </div>
        ) : (
          <ul className="space-y-1">
            {sections.map((section) => (
              <li key={section.id}>
                <button
                  onClick={() => onSelectSection(section.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    activeSectionId === section.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                  }`}
                >
                  {section.title}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="p-4 border-t border-border/50">
        <button
          onClick={handleCreateSection}
          disabled={isCreating}
          className="w-full flex items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
        >
          {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "+ New Section"}
        </button>
      </div>
    </div>
  );
}
