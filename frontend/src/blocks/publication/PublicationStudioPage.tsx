import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import {
  fetchPublicationProject,
  fetchPublicationSections,
  type PublicationProjectRead,
  type PublicationSectionRead,
} from "../../services/OrchestratorPublicationService";
import { PublicationStudioShell } from "./components/PublicationStudioShell";

export default function PublicationStudioPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<PublicationProjectRead | null>(null);
  const [sections, setSections] = useState<PublicationSectionRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      navigate("/");
      return;
    }

    const abort = new AbortController();
    setLoading(true);

    async function loadData() {
      try {
        const [proj, sects] = await Promise.all([
          fetchPublicationProject(projectId!, undefined, abort.signal),
          fetchPublicationSections(projectId!, undefined, abort.signal),
        ]);
        setProject(proj);
        setSections(sects);
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message || "Failed to load project");
        }
      } finally {
        setLoading(false);
      }
    }

    loadData();

    return () => abort.abort();
  }, [projectId, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background text-foreground">
        <p className="text-destructive mb-4">{error || "Project not found"}</p>
        <button
          onClick={() => navigate("/")}
          className="text-sm underline text-muted-foreground"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <PublicationStudioShell
      project={project}
      sections={sections}
      onRefreshSections={async () => {
        const sects = await fetchPublicationSections(project.id);
        setSections(sects);
      }}
    />
  );
}
