import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { 
  type PublicationSectionRead,
  updatePublicationSection,
  createPublicationRevision 
} from "../../../services/OrchestratorPublicationService";

interface SectionEditorProps {
  section: PublicationSectionRead | null;
  onRefresh: () => void;
}

export function SectionEditor({ section, onRefresh }: SectionEditorProps) {
  const [title, setTitle] = useState(section?.title ?? "");
  const [body, setBody] = useState(section?.body_ref ?? "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setTitle(section?.title ?? "");
    setBody(section?.body_ref ?? "");
  }, [section?.id, section?.title, section?.body_ref]);

  if (!section) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground p-8 text-center">
        <div>
          <p className="mb-2">No section selected</p>
          <p className="text-sm opacity-70">Select a section from the outline to start editing.</p>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    try {
      setIsSaving(true);
      if (title !== section.title) {
        await updatePublicationSection(section.id, { title });
      }
      if (body !== section.body_ref) {
        await createPublicationRevision(section.id, { body_ref: body });
      }
      onRefresh();
    } catch (err) {
      alert("Failed to save draft");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="border-b border-border/50 px-8 py-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-transparent text-2xl font-serif font-medium outline-none placeholder:text-muted-foreground/50"
          placeholder="Section Title"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-8">
        <textarea
          className="w-full h-full resize-none bg-transparent outline-none placeholder:text-muted-foreground/50 font-mono text-sm leading-relaxed"
          placeholder="Start writing..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>
      <div className="border-t border-border/50 px-8 py-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>Status: {section.status}</span>
        <button 
          onClick={handleSave}
          disabled={isSaving || (title === section.title && body === (section.body_ref || ""))}
          className="flex items-center gap-2 rounded bg-primary px-3 py-1 text-primary-foreground hover:bg-primary/90 font-medium disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Draft"}
        </button>
      </div>
    </div>
  );
}
