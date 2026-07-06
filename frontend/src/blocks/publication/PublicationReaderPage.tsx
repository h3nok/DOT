import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import {
  fetchPublicDeliveryManifest,
  type PublicationReleaseManifest,
} from "../../services/OrchestratorPublicationService";
import { BloomSurface } from "../../dot/BloomSurface";

export default function PublicationReaderPage() {
  const { ownerId, slug } = useParams<{ ownerId: string; slug: string }>();
  const navigate = useNavigate();

  const [manifest, setManifest] = useState<PublicationReleaseManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ownerId || !slug) {
      navigate("/");
      return;
    }

    const abort = new AbortController();
    setLoading(true);

    async function loadManifest() {
      try {
        const data = await fetchPublicDeliveryManifest(ownerId!, slug!, { signal: abort.signal });
        if (data) {
          setManifest(data);
        } else {
          setError("Publication not found or not yet released.");
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setError(err.message || "Failed to load publication");
        }
      } finally {
        setLoading(false);
      }
    }

    loadManifest();

    return () => abort.abort();
  }, [ownerId, slug, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !manifest) {
    return (
      <BloomSurface
        kicker="publication error"
        title="Not Found"
        onClose={() => navigate("/")}
      >
        <div className="py-8 text-center text-muted-foreground">
          <p className="mb-4 text-destructive">{error || "This publication could not be found."}</p>
          <p className="text-sm">It may not exist or the author hasn't released a version yet.</p>
        </div>
      </BloomSurface>
    );
  }

  // Sort sections by order
  const sortedSections = [...manifest.sections].sort((a, b) => a.order - b.order);

  return (
    <BloomSurface
      kicker={`by ${manifest.project.owner_id}`}
      title={manifest.project.title}
      description={`Version ${manifest.release.version} • Published ${new Date(manifest.release.published_at || "").toLocaleDateString()}`}
      size="lg"
      onClose={() => navigate("/")}
    >
      <div className="py-6 space-y-12">
        {sortedSections.map((section) => (
          <section key={section.id} className="space-y-4">
            <h2 className="font-serif text-2xl font-medium text-foreground border-b border-border/50 pb-2">
              {section.title}
            </h2>
            <div className="prose prose-sm dark:prose-invert max-w-none font-mono text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {section.body_ref || <span className="italic opacity-50">Empty section</span>}
            </div>
          </section>
        ))}
      </div>
    </BloomSurface>
  );
}
