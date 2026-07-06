import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { DotNodeKind } from "./types";
import type { NodeDraft } from "./graphStore";
import { BloomSurface } from "./BloomSurface";

/**
 * NodeEditor — authoring, blooming from the centre of the graph.
 *
 * Adding a node to any node, or editing one, happens on the same
 * {@link BloomSurface} shell as reading and sign-in. It keeps the graph's
 * language: a node has a name, an essence, a kind (an attribute you drill into,
 * a page it routes to, or an external link), and an optional destination.
 */

const FORM_ID = "node-editor-form";

const KINDS: { value: DotNodeKind; label: string; hint: string }[] = [
  {
    value: "attribute",
    label: "Attribute",
    hint: "A facet you can drill into.",
  },
  { value: "page", label: "Page", hint: "Routes to a surface in the app." },
  { value: "external", label: "Link", hint: "Opens an external URL." },
];

export interface NodeEditorProps {
  mode: "add" | "edit";
  /** Name of the parent (add) or the node being edited, for the header. */
  contextLabel: string;
  initial?: NodeDraft;
  origin?: { x: number; y: number };
  reducedMotion?: boolean;
  onSubmit: (draft: NodeDraft) => void;
  onClose: () => void;
  onDelete?: () => void;
}

export const NodeEditor: React.FC<NodeEditorProps> = ({
  mode,
  contextLabel,
  initial,
  origin,
  reducedMotion = false,
  onSubmit,
  onClose,
  onDelete,
}) => {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [kind, setKind] = useState<DotNodeKind>(initial?.kind ?? "attribute");
  const [href, setHref] = useState(initial?.href ?? "");
  const [image, setImage] = useState(initial?.image ?? "");

  const needsHref = kind === "page" || kind === "external";
  const valid =
    label.trim().length > 0 && (!needsHref || href.trim().length > 0);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!valid) return;
    onSubmit({
      label,
      description,
      body,
      kind,
      href: needsHref ? href : undefined,
      image: image.trim() || undefined,
    });
  };

  const footer = (
    <div className="flex items-center justify-between gap-2">
      {mode === "edit" && onDelete ? (
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border/50 px-3 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Remove
        </button>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl px-3 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Cancel
        </button>
        <button
          type="submit"
          form={FORM_ID}
          disabled={!valid}
          className="rounded-xl border border-[color:var(--organism-accent-soft)] bg-foreground/[0.06] px-4 py-2.5 text-xs font-semibold text-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          {mode === "add" ? "Add" : "Save"}
        </button>
      </div>
    </div>
  );

  return (
    <BloomSurface
      kicker={mode === "add" ? "add a node" : "edit node"}
      title={mode === "add" ? "Grow the graph" : contextLabel}
      description={
        mode === "add" ? `Inside ${contextLabel}` : "Reshape this node."
      }
      origin={origin}
      reducedMotion={reducedMotion}
      zIndex={40}
      size="sm"
      onClose={onClose}
      footer={footer}
    >
      <form id={FORM_ID} onSubmit={submit}>
        <label className="mb-3 block">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Name
          </span>
          <input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            autoFocus
            placeholder="e.g. The Book"
            className="w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2.5 text-sm outline-none transition-colors focus:border-[color:var(--organism-accent-soft)]"
          />
        </label>

        <label className="mb-3 block">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Essence
          </span>
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="One line, revealed when focused."
            className="w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2.5 text-sm outline-none transition-colors focus:border-[color:var(--organism-accent-soft)]"
          />
        </label>

        <label className="mb-3 block">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Content
          </span>
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="The substance of this node. Blank lines separate paragraphs."
            rows={5}
            className="w-full resize-y rounded-xl border border-border/60 bg-background/60 px-3 py-2.5 text-sm leading-6 outline-none transition-colors focus:border-[color:var(--organism-accent-soft)]"
          />
        </label>

        <label className="mb-3 block">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Portrait{" "}
            <span className="normal-case opacity-60">(optional image URL)</span>
          </span>
          <input
            value={image}
            onChange={(event) => setImage(event.target.value)}
            placeholder="https://…  — sits at the centre, framed by the fingerprint"
            className="w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2.5 text-sm outline-none transition-colors focus:border-[color:var(--organism-accent-soft)]"
          />
        </label>

        <div className="mb-3">
          <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Kind
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            {KINDS.map((option) => {
              const selected = kind === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setKind(option.value)}
                  aria-pressed={selected}
                  title={option.hint}
                  className={`rounded-xl border px-2 py-2 text-xs font-medium transition-colors ${
                    selected
                      ? "border-[color:var(--organism-accent-soft)] bg-foreground/[0.06] text-foreground"
                      : "border-border/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {needsHref && (
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {kind === "page" ? "Route" : "URL"}
            </span>
            <input
              value={href}
              onChange={(event) => setHref(event.target.value)}
              placeholder={
                kind === "page" ? "/doctrine" : "https://…  or  mailto:…"
              }
              className="w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2.5 text-sm outline-none transition-colors focus:border-[color:var(--organism-accent-soft)]"
            />
          </label>
        )}
      </form>
    </BloomSurface>
  );
};

export default NodeEditor;
