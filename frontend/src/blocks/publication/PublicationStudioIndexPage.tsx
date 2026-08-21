import { ArrowRight, FileText, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  fetchPublicationProjects,
  type PublicationProjectRead,
} from "../../services/OrchestratorPublicationService";
import { PageHeader, PageShell } from "../../shared/PageShell";

export default function PublicationStudioIndexPage() {
  const [projects, setProjects] = useState<PublicationProjectRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abort = new AbortController();

    void fetchPublicationProjects(undefined, abort.signal)
      .then(setProjects)
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError(reason instanceof Error ? reason.message : "The studio could not be opened.");
      })
      .finally(() => setLoading(false));

    return () => abort.abort();
  }, []);

  return (
    <PageShell header={<PageHeader />}>
      <header className="border-b border-border/60 pb-8">
        <p className="dot-label">Private workspace</p>
        <h1 className="dot-page-heading mt-2">Publication studio</h1>
        <p className="dot-lede mt-3 max-w-2xl">
          Manuscript, evidence, edition.
        </p>
        <p className="dot-caption mt-3 max-w-xl">
          Write in durable Markdown, distinguish observation from model and hypothesis, then inspect the exact reader experience before publishing a finite edition.
        </p>
      </header>

        {loading ? (
          <div className="flex min-h-52 items-center justify-center" aria-label="Loading projects">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
          </div>
        ) : error ? (
          <div className="border-b border-border/60 py-10">
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Sign in as the steward and try again. Public reading remains available outside this workspace.
            </p>
          </div>
        ) : projects.length === 0 ? (
          <div className="border-b border-border/60 py-10">
            <p className="text-sm text-foreground">No manuscript projects are available yet.</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              The released Book One remains the public source until a studio project is created.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border/60 border-b border-border/60">
            {projects.map((project) => (
              <li key={project.id}>
                <Link
                  to={`/studio/${encodeURIComponent(project.id)}`}
                  className="group flex min-h-24 items-center gap-4 py-5 transition-colors hover:text-[color:var(--organism-accent-strong)]"
                >
                  <span className="dot-surface flex h-10 w-10 shrink-0 items-center justify-center text-muted-foreground">
                    <FileText className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="dot-section-heading block truncate">
                      {project.title}
                    </span>
                    <span className="mt-1.5 flex flex-wrap gap-1.5">
                      <span className="dot-chip">{project.type}</span>
                      <span className="dot-chip">{project.status}</span>
                      <span className="dot-chip">{project.visibility}</span>
                    </span>
                  </span>
                  <ArrowRight
                    className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-[color:var(--organism-accent-strong)]"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
    </PageShell>
  );
}
