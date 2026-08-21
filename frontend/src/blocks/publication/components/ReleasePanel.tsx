import * as AlertDialog from "@radix-ui/react-alert-dialog";
import {
  BookOpenText,
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  createPublicationRelease,
  fetchPublicationReleases,
  type PublicationProjectRead,
  type PublicationReleaseRead,
  type PublicationValidationRead,
  validatePublicationProject,
} from "../../../services/OrchestratorPublicationService";

interface ReleasePanelProps {
  project: PublicationProjectRead;
  manuscriptRevision?: number;
}

function formatReleaseDate(value: string | null): string {
  if (!value) return "Not published";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function ReleasePanel({ project, manuscriptRevision = 0 }: ReleasePanelProps) {
  const [releases, setReleases] = useState<PublicationReleaseRead[]>([]);
  const [validation, setValidation] = useState<PublicationValidationRead | null>(null);
  const [loadingState, setLoadingState] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const publicHref = `/read/${encodeURIComponent(project.owner_id)}/${encodeURIComponent(project.slug)}`;
  const latestRelease = useMemo(
    () => [...releases].sort((a, b) => b.version - a.version)[0] ?? null,
    [releases],
  );

  const refreshReleaseState = useCallback(
    async (signal?: AbortSignal) => {
      setLoadingState(true);
      setMessage(null);
      try {
        const [nextReleases, nextValidation] = await Promise.all([
          fetchPublicationReleases(project.id, undefined, signal),
          validatePublicationProject(project.id, undefined, signal),
        ]);
        setReleases(nextReleases);
        setValidation(nextValidation);
      } catch (reason: unknown) {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setMessage({
          tone: "error",
          text: reason instanceof Error ? reason.message : "Release state could not be checked.",
        });
      } finally {
        if (!signal?.aborted) setLoadingState(false);
      }
    },
    [project.id],
  );

  useEffect(() => {
    const abort = new AbortController();
    void refreshReleaseState(abort.signal);
    return () => abort.abort();
  }, [manuscriptRevision, refreshReleaseState]);

  const handlePublish = async () => {
    if (!validation?.valid) {
      setMessage({ tone: "error", text: "Resolve the preflight findings before publishing." });
      return;
    }

    try {
      setIsPublishing(true);
      setMessage(null);
      const release = await createPublicationRelease(project.id, {
        idempotencyKey: crypto.randomUUID(),
      });
      await refreshReleaseState();
      setMessage({ tone: "success", text: `Edition v${release.version} is now public.` });
    } catch (reason: unknown) {
      setMessage({
        tone: "error",
        text: reason instanceof Error ? reason.message : "The edition could not be published.",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <aside className="appearance-ui-panel publication-studio__panel flex h-full flex-col">
      <div className="border-b border-border/60 px-4 py-3">
        <p className="font-mono dot-micro uppercase text-muted-foreground">Edition desk</p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <h3 className="font-serif text-base font-semibold">Release</h3>
          <button
            type="button"
            onClick={() => void refreshReleaseState()}
            disabled={loadingState || isPublishing}
            className="inline-flex h-7 w-7 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
            aria-label="Refresh release status"
            title="Run preflight again"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingState ? "animate-spin" : ""}`} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        <section>
          <p className="font-mono dot-micro uppercase text-muted-foreground">Public edition</p>
          <div className="mt-3 border-y border-border/60 py-3">
            {loadingState && !latestRelease ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                Checking edition
              </div>
            ) : latestRelease ? (
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-serif text-lg font-semibold">Version {latestRelease.version}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatReleaseDate(latestRelease.published_at)} · Immutable
                  </p>
                </div>
                <span className="mt-1 h-2 w-2 rounded-full bg-[color:var(--book-verdigris)]" title="Published" />
              </div>
            ) : (
              <p className="text-xs leading-relaxed text-muted-foreground">
                No public edition has been created from this project.
              </p>
            )}
          </div>
          {latestRelease && (
            <Link
              to={publicHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-foreground transition-colors hover:text-[color:var(--organism-accent-strong)]"
            >
              <BookOpenText className="h-3.5 w-3.5" aria-hidden="true" />
              Open public edition
              <ExternalLink className="h-3 w-3 opacity-60" aria-hidden="true" />
            </Link>
          )}
        </section>

        <section>
          <p className="font-mono dot-micro uppercase text-muted-foreground">Preflight</p>
          <div
            className={`mt-3 border-l-2 px-3 py-3 ${
              validation?.valid
                ? "border-[color:var(--book-verdigris)] bg-foreground/[0.025]"
                : "border-[color:var(--book-cinnabar)] bg-foreground/[0.025]"
            }`}
          >
            {loadingState && !validation ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                Inspecting manuscript
              </div>
            ) : validation?.valid ? (
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--book-verdigris)]" aria-hidden="true" />
                <div>
                  <p className="text-xs font-semibold text-foreground">Ready to publish</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Saved sections passed the release contract.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--book-cinnabar)]" aria-hidden="true" />
                <div>
                  <p className="text-xs font-semibold text-foreground">Needs attention</p>
                  <ul className="mt-1 space-y-1 text-xs leading-relaxed text-muted-foreground">
                    {(validation?.errors ?? ["Preflight has not completed."]).map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </section>

        {message && (
          <div
            className={`flex items-start gap-2 text-xs leading-relaxed ${
              message.tone === "success" ? "text-[color:var(--book-verdigris)]" : "text-destructive"
            }`}
            role={message.tone === "error" ? "alert" : "status"}
          >
            {message.tone === "success" ? (
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            )}
            <span>{message.text}</span>
          </div>
        )}
      </div>

      <div className="border-t border-border/60 p-4">
        <AlertDialog.Root>
          <AlertDialog.Trigger asChild>
            <button
              type="button"
              disabled={isPublishing || loadingState || !validation?.valid}
              className="flex min-h-10 w-full items-center justify-center gap-2 dot-reading-action disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isPublishing && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Publish new edition
            </button>
          </AlertDialog.Trigger>
          <AlertDialog.Portal>
            <AlertDialog.Overlay className="fixed inset-0 z-[80] bg-background/55 backdrop-blur-sm" />
            <AlertDialog.Content className="dot-surface fixed left-1/2 top-1/2 z-[81] w-[min(30rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 p-6">
              <p className="font-mono dot-micro uppercase text-[color:var(--book-cinnabar)]">Immutable edition</p>
              <AlertDialog.Title className="dot-section-heading mt-2">
                Publish the saved manuscript?
              </AlertDialog.Title>
              <AlertDialog.Description className="mt-3 text-sm leading-relaxed text-muted-foreground">
                This creates a finite, versioned edition from the latest saved revisions and updates the public reader. Your working drafts remain editable.
              </AlertDialog.Description>
              <div className="mt-6 flex justify-end gap-2">
                <AlertDialog.Cancel className="dot-pill min-h-9">
                  Cancel
                </AlertDialog.Cancel>
                <AlertDialog.Action
                  className="dot-reading-action min-h-9 px-4 text-xs"
                  onClick={() => void handlePublish()}
                >
                  Create edition
                </AlertDialog.Action>
              </div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog.Root>
        <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
          Only saved revisions enter the edition. Publishing never overwrites an earlier release.
        </p>
      </div>
    </aside>
  );
}
