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
    <aside className="flex h-full flex-col bg-background">
      <div className="border-b border-border/60 px-4 py-3">
        <p className="font-mono dot-micro uppercase text-muted-foreground">Inspector</p>
        <h3 className="mt-1 font-serif text-sm font-semibold">Release</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <h4 className="mb-2 font-mono uppercase text-muted-foreground">Visibility</h4>
          <p className="border-block border-border/60 py-3 text-xs leading-relaxed">
            {project.visibility === "public" ? "Public when a release is published." : "Private to your signed-in workspace."}
          </p>
        </div>
        <div>
          <h4 className="mb-2 font-mono dot-micro uppercase text-muted-foreground">Publishing</h4>
          <button 
            onClick={handlePublish}
            disabled={isPublishing}
            className="flex min-h-10 w-full items-center justify-center gap-2 bg-foreground px-4 text-xs font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publish Release"}
          </button>
          <p className="text-xs text-muted-foreground mt-2">
            Creates a new immutable edition from the latest saved revisions.
          </p>
        </div>
      </div>
    </aside>
  );
}
