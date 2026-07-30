import { useState } from "react";
import { ArrowLeft, BookOpen, Loader2, Plus, Send, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BloomSurface } from "./BloomSurface";
import { useOrganismPulse, staggerChild } from "../organism";
import {
  usePublications,
  type Publication,
  type PublicationDraft,
} from "./usePublications";

/**
 * Publications — the publication platform surface, blooming from the graph.
 *
 * Durable work lives here: the owner drafts a piece, then *releases* it, which
 * stamps a version and a date and turns it into a stable, shareable object.
 * Visitors read released work; the owner also sees drafts and can publish. It
 * wears the same {@link BloomSurface} shell as everything else — the library,
 * a reading view, and composing are three states of one calm surface, never a
 * separate page.
 */

interface PublicationsProps {
  owner?: string;
  isOwner: boolean;
  origin?: { x: number; y: number };
  reducedMotion?: boolean;
  onClose: () => void;
}

type View =
  | { mode: "list" }
  | { mode: "read"; pub: Publication }
  | { mode: "compose"; pub?: Publication };

function formatDate(iso?: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export const Publications: React.FC<PublicationsProps> = ({
  owner = "self",
  isOwner,
  origin,
  reducedMotion = false,
  onClose,
}) => {
  const navigate = useNavigate();
  const { items, loading, create, update, release, remove } =
    usePublications(owner);
  const pulse = useOrganismPulse();
  const [view, setView] = useState<View>({ mode: "list" });

  // Compose form state.
  const [title, setTitle] = useState("");
  const [essence, setEssence] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openCompose = (pub?: Publication) => {
    setTitle(pub?.title ?? "");
    setEssence(pub?.essence ?? "");
    setBody(pub?.body ?? "");
    setError(null);
    setView({ mode: "compose", pub });
  };

  const saveDraft = async (thenRelease: boolean) => {
    setError(null);
    if (!title.trim()) {
      setError("A title is required.");
      return;
    }
    setBusy(true);
    const draft: PublicationDraft = {
      title: title.trim(),
      essence: essence.trim() || undefined,
      body: body.trim() || undefined,
    };
    const editing = view.mode === "compose" ? view.pub : undefined;
    const result = editing
      ? await update(editing.id, draft)
      : await create(draft);
    if (!result.ok || !result.publication) {
      setBusy(false);
      setError(result.error ?? "Could not save.");
      return;
    }
    if (thenRelease) {
      const released = await release(result.publication.id);
      if (!released.ok) {
        setBusy(false);
        setError(released.error ?? "Could not release.");
        return;
      }
      pulse(1); // a release is a real event — let the organism feel it
    } else {
      pulse(0.4); // a saved draft is a quieter stir
    }
    setBusy(false);
    setView({ mode: "list" });
  };

  const releaseExisting = async (pub: Publication) => {
    setBusy(true);
    await release(pub.id);
    pulse(1);
    setBusy(false);
  };

  const deleteDraft = async (pub: Publication) => {
    setBusy(true);
    await remove(pub.id);
    setBusy(false);
    setView({ mode: "list" });
  };

  // ---- Reading view ----------------------------------------------------------
  if (view.mode === "read") {
    const pub = view.pub;
    const paragraphs = (pub.body ?? "")
      .split("\n\n")
      .map((p) => p.trim())
      .filter(Boolean);
    return (
      <BloomSurface
        kicker={
          pub.status === "released" ? `published · v${pub.version}` : "draft"
        }
        title={pub.title}
        description={pub.essence ?? undefined}
        origin={origin}
        reducedMotion={reducedMotion}
        zIndex={55}
        size="lg"
        onClose={onClose}
        footer={
          <button
            type="button"
            onClick={() => setView({ mode: "list" })}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/50 px-4 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to the library
          </button>
        }
      >
        {pub.released_at && (
          <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Released {formatDate(pub.released_at)}
          </p>
        )}
        {paragraphs.length > 0 ? (
          <div className="space-y-4">
            {paragraphs.map((p, i) => (
              <p
                key={i}
                className="text-[15px] leading-7 text-foreground/85 first:text-[17px] first:leading-8 first:text-foreground"
              >
                {p}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-sm italic text-muted-foreground">
            This work has no body yet.
          </p>
        )}
        {isOwner && (
          <div className="mt-6 flex flex-wrap gap-2 border-t border-border/50 pt-5">
            <button
              type="button"
              onClick={() => openCompose(pub)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/50 px-4 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Revise
            </button>
            {pub.status === "draft" && (
              <button
                type="button"
                onClick={() => releaseExisting(pub)}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[color:var(--organism-accent-soft)] bg-foreground/[0.06] px-4 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-foreground/[0.1] disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" />
                Release
              </button>
            )}
          </div>
        )}
      </BloomSurface>
    );
  }

  // ---- Compose / revise view -------------------------------------------------
  if (view.mode === "compose") {
    const editing = view.pub;
    return (
      <BloomSurface
        kicker={editing ? "revise" : "new publication"}
        title={editing ? "Revise the work" : "Begin a publication"}
        description="Drafts stay private to you until you release them."
        origin={origin}
        reducedMotion={reducedMotion}
        zIndex={55}
        size="lg"
        onClose={onClose}
        footer={
          <div className="flex items-center justify-between gap-2">
            <div>
              {editing && (
                <button
                  type="button"
                  onClick={() => deleteDraft(editing)}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border/50 px-3 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => saveDraft(false)}
                disabled={busy}
                className="rounded-xl border border-border/50 px-4 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save draft"
                )}
              </button>
              <button
                type="button"
                onClick={() => saveDraft(true)}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[color:var(--organism-accent-soft)] bg-foreground/[0.06] px-4 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-foreground/[0.1] disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" />
                Release
              </button>
            </div>
          </div>
        }
      >
        <label className="mb-3 block">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Title
          </span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            placeholder="The title of the work"
            className="w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2.5 text-sm outline-none transition-colors focus:border-[color:var(--organism-accent-soft)]"
          />
        </label>
        <label className="mb-3 block">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Essence
          </span>
          <input
            value={essence}
            onChange={(e) => setEssence(e.target.value)}
            placeholder="One line that frames it."
            className="w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2.5 text-sm outline-none transition-colors focus:border-[color:var(--organism-accent-soft)]"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            The work
          </span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            placeholder="Write it here. Blank lines separate paragraphs."
            className="w-full resize-y rounded-xl border border-border/60 bg-background/60 px-3 py-2.5 text-sm leading-7 outline-none transition-colors focus:border-[color:var(--organism-accent-soft)]"
          />
        </label>
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      </BloomSurface>
    );
  }

  // ---- Library list ----------------------------------------------------------
  return (
    <BloomSurface
      kicker="publications"
      title="The library"
      description="Durable work, released to last — not a feed."
      origin={origin}
      reducedMotion={reducedMotion}
      zIndex={55}
      size="lg"
      onClose={onClose}
      footer={
        isOwner ? (
          <button
            type="button"
            onClick={() => openCompose()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[color:var(--organism-accent-soft)] bg-foreground/[0.06] px-4 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-foreground/[0.1]"
          >
            <Plus className="h-3.5 w-3.5" />
            New publication
          </button>
        ) : undefined
      }
    >
      <ul className="space-y-2.5">
        <motion.li variants={staggerChild} custom={reducedMotion}>
          <button
            type="button"
            onClick={() => navigate("/book/digital-organism-theory")}
            className="group flex w-full items-start gap-4 rounded-2xl border border-[var(--organism-accent-soft)] bg-foreground/[0.04] px-4 py-4 text-left transition-colors hover:bg-foreground/[0.08]"
          >
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--organism-accent-soft)]">
              <BookOpen className="h-4 w-4 text-foreground" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-start justify-between gap-3">
                <span className="font-serif text-lg font-semibold leading-tight text-foreground">
                  Consciousness: A Digital Organism
                </span>
                <span className="shrink-0 font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">
                  Book One
                </span>
              </span>
              <span className="mt-1 block text-sm italic leading-relaxed text-muted-foreground">
                Foundational edition · six chapters, equations, and sources.
              </span>
            </span>
          </button>
        </motion.li>

        {loading && (
          <li className="flex items-center justify-center py-5 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="sr-only">Loading other publications</span>
          </li>
        )}

        {!loading &&
          items.map((pub) => (
            <motion.li
              key={pub.id}
              variants={staggerChild}
              custom={reducedMotion}
            >
              <button
                type="button"
                onClick={() => setView({ mode: "read", pub })}
                className="group flex w-full flex-col items-start rounded-2xl border border-border/50 bg-foreground/[0.02] px-4 py-3.5 text-left transition-colors hover:border-[color:var(--organism-accent-soft)] hover:bg-foreground/[0.05]"
              >
                <div className="flex w-full items-center justify-between gap-3">
                  <span className="font-serif text-lg font-semibold text-foreground">
                    {pub.title}
                  </span>
                  <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                    {pub.status === "released"
                      ? `v${pub.version} · ${formatDate(pub.released_at)}`
                      : "draft"}
                  </span>
                </div>
                {pub.essence && (
                  <span className="mt-1 text-sm italic leading-relaxed text-muted-foreground">
                    {pub.essence}
                  </span>
                )}
              </button>
            </motion.li>
          ))}
      </ul>
    </BloomSurface>
  );
};

export default Publications;
