import { useState } from "react";
import { Loader2 } from "lucide-react";
import { type PublicationProjectRead, createPublicationRelease } from "../../../services/OrchestratorPublicationService";

interface ReleasePanelProps {
  project: PublicationProjectRead;
}

export function ReleasePanel({ project }: ReleasePanelProps) {
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    if (!window.confirm("Publishing will create a new immutable release manifest and update the public pages. Proceed?")) return;
    try {
      setIsPublishing(true);
      const idempotencyKey = crypto.randomUUID();
      const release = await createPublicationRelease(project.id, { idempotencyKey });
      alert(`Release v${release.version} successfully published!`);
    } catch (err) {
      alert("Failed to publish release");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-background/50 border-l border-border/50">
      <div className="p-4 border-b border-border/50">
        <h3 className="font-semibold text-sm">Release Settings</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Visibility</h4>
          <div className="text-sm bg-accent/50 rounded-md p-3">
            {project.visibility === "public" ? "Public - Visible to everyone" : "Private - Only you can see this"}
          </div>
        </div>
        <div>
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Publishing</h4>
          <button 
            onClick={handlePublish}
            disabled={isPublishing}
            className="w-full flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publish Release"}
          </button>
          <p className="text-xs text-muted-foreground mt-2">
            Publishing will generate a new immutable manifest and make the latest drafts live.
          </p>
        </div>
      </div>
    </div>
  );
}
