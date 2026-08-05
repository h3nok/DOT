import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    Check,
    LogIn,
    Pencil,
    Plus,
    RotateCcw,
    UserPlus,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOrganismPulse } from "../organism";
import { CircleSurface } from "./Circle";
import { GraphChat } from "./GraphChat";
import { GraphNode } from "./GraphNode";
import { Invite } from "./Invite";
import { InviteWelcome } from "./InviteWelcome";
import { NodeEditor } from "./NodeEditor";
import { NodeStage } from "./NodeStage";
import { SignIn } from "./SignIn";
import { SupportSurface } from "./SupportSurface";
import { SynapticEdge } from "./SynapticEdge";
import { VaultSurface } from "./VaultSurface";
import { runAgent } from "./agent";
import { findNode, resolveChain, type NodeDraft } from "./graphStore";
import { radialSlots } from "./layout";
import { hasChildren, type DotNode } from "./types";
import { useAuth } from "./useAuth";
import { acceptInvite } from "./useCircle";
import { useEditableGraph } from "./useEditableGraph";
import { useInviteArrival } from "./useInviteArrival";
import { useOwnerMode } from "./useOwnerMode";

interface NucleusGraphProps {
  /** Seed root of the graph; user edits are layered on top and persisted. */
  root: DotNode;
}

type EditorState =
  | { mode: "add"; parentId: string; parentLabel: string }
  | { mode: "edit"; node: DotNode };

/**
 * The living, editable graph surface.
 *
 * Renders a central Dot with its attributes radiating around it, connected by
 * synaptic edges. Activating a node drills the graph into it, follows a link,
 * or reveals its essence. In edit mode every node — the nucleus included — can
 * grow a new node, be renamed, or be removed; the whole tree persists. It is the
 * navigation, the content, the authoring surface, and the organism's body all
 * at once.
 */
export const NucleusGraph: React.FC<NucleusGraphProps> = ({ root: seed }) => {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion() ?? false;
  const devOwner = useOwnerMode();
  const { isOwner, logout, refresh: refreshAuth } = useAuth();
  const pulse = useOrganismPulse();
  // Authoring unlocks for an authenticated owner; `?owner=1` stays a local dev
  // escape hatch (it cannot publish to the server without a real session).
  const owner = isOwner || devOwner;
  const [signInOpen, setSignInOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [platformSurface, setPlatformSurface] = useState<
    "publications" | "circle" | "vault" | "support" | null
  >(null);
  const invited = useInviteArrival();
  const { root, create, edit, remove, reset, status } = useEditableGraph(
    seed,
    owner,
  );

  // Focus is a path of ids (root-first), resolved fresh against the live tree
  // so it survives edits. Drilling pushes an id; back pops.
  const [path, setPath] = useState<string[]>([root.id]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [answer, setAnswer] = useState<DotNode | null>(null);
  const [busy, setBusy] = useState(false);

  // Orchestrated entrance — the graph assembles itself.
  const [arrived, setArrived] = useState(false);
  const [drilling, setDrilling] = useState(false);
  useEffect(() => {
    if (reducedMotion) {
      setArrived(true);
      return;
    }
    const t = setTimeout(() => setArrived(true), 100);
    return () => clearTimeout(t);
  }, [reducedMotion]);

  // First-run welcome whisper (visitors only, once).
  const [welcomed, setWelcomed] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem("dot-welcomed") === "1";
  });
  const dismissWelcome = () => {
    setWelcomed(true);
    if (typeof window !== "undefined")
      window.localStorage.setItem("dot-welcomed", "1");
  };

  const chain = useMemo(() => resolveChain(root, path), [root, path]);
  const center = chain[chain.length - 1];
  const children = center.children ?? [];

  // An extra ghost slot in edit mode lets you add a child to the centre.
  const slotCount = children.length + (editing ? 1 : 0);
  // The ring is centred on the nucleus core, so the only wedge it must avoid is
  // the one directly below it, where the name and essence line hang.
  const slots = useMemo(() => {
    if (slotCount <= 0) return [];
    if (slotCount === 1) return radialSlots(1, -90);
    const gapDeg = 88;
    const span = 360 - gapDeg;
    const start = 90 + gapDeg / 2;
    return Array.from({ length: slotCount }, (_, i) => {
      const angleDeg = start + (span / slotCount) * (i + 0.5);
      const a = (angleDeg * Math.PI) / 180;
      return { ux: Math.cos(a), uy: Math.sin(a), angleDeg };
    });
  }, [slotCount]);

  // Responsive geometry.
  const stageRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const cx = size.w / 2;
  // Reserve the top band for the toolbar and the bottom band for the chat bar
  // and its chips, so no node or label can ever collide with them.
  const topReserve = 72;
  const chatReserve = editing ? 24 : 168;
  const usableH = Math.max(0, size.h - topReserve - chatReserve);
  const cy = topReserve + usableH / 2;
  const radius = Math.max(150, Math.min(330, Math.min(size.w, usableH) * 0.4));

  // The avatar *is* the hub: measure where its centre falls inside the nucleus
  // block so the block can be offset to put that centre exactly on (cx, cy).
  const nucleusRef = useRef<HTMLDivElement>(null);
  const [coreOffset, setCoreOffset] = useState(72);
  useEffect(() => {
    const host = nucleusRef.current;
    const core = host?.querySelector("[data-nucleus-core]");
    if (!host || !core) return;
    const hostTop = host.getBoundingClientRect().top;
    const box = core.getBoundingClientRect();
    setCoreOffset(box.top + box.height / 2 - hostTop);
  }, [center.id, size.w, size.h]);

  const positions = slots.map((s) => ({
    x: cx + s.ux * radius,
    y: cy + s.uy * radius,
  }));

  const drill = useCallback(
    (node: DotNode) => {
      setSelectedId(null);
      setDetailId(null);
      setAnswer(null);
      setHoveredId(null);
      setDrilling(true);
      // Let the exit animation play before switching the graph level.
      const delay = reducedMotion ? 0 : 80;
      setTimeout(() => {
        setPath((p) => [...p, node.id]);
        setDrilling(false);
      }, delay);
    },
    [reducedMotion],
  );

  const follow = (node: DotNode) => {
    if (!node.href) return;
    if (/^(https?:|mailto:|tel:)/.test(node.href)) {
      window.open(node.href, "_blank", "noopener,noreferrer");
    } else {
      navigate(node.href);
    }
  };

  const activate = (node: DotNode) => {
    // Publications live in the Studio (authoring) and the Reader (released
    // work), not in a bloom, so that node navigates rather than opening one.
    if (node.surface === "publications" && !editing) {
      navigate(node.href ?? "/studio");
      return;
    }
    // A node that fronts a live platform surface (the circle, the vault)
    // opens it instead of static reading content.
    if (node.surface && !editing) {
      setPlatformSurface(node.surface);
      return;
    }
    // In edit mode, a tap always opens the node's detail so its content can be
    // read or edited; drilling/following happen from explicit actions there.
    if (editing) {
      setSelectedId(node.id);
      setDetailId(node.id);
      return;
    }
    // A node with substance (body or metadata) opens its reading panel; a pure
    // navigator drills or follows directly.
    const hasContent = Boolean(node.body) || Boolean(node.meta?.length);
    if (hasContent) {
      setSelectedId(node.id);
      setDetailId(node.id);
      return;
    }
    if (hasChildren(node)) {
      drill(node);
      return;
    }
    if (node.href) {
      follow(node);
      return;
    }
    setSelectedId((cur) => (cur === node.id ? null : node.id));
    setDetailId(node.id);
  };

  const back = () => {
    setSelectedId(null);
    setDetailId(null);
    setHoveredId(null);
    setPath((p) => (p.length > 1 ? p.slice(0, -1) : p));
  };

  const openAdd = (parent: DotNode) =>
    setEditor({ mode: "add", parentId: parent.id, parentLabel: parent.label });
  const openEdit = (node: DotNode) => setEditor({ mode: "edit", node });

  const submitEditor = (draft: NodeDraft) => {
    if (!editor) return;
    if (editor.mode === "add") create(editor.parentId, draft);
    else edit(editor.node.id, draft);
    setEditor(null);
  };

  const closeStage = () => {
    setDetailId(null);
    setSelectedId(null);
    setAnswer(null);
  };

  const ask = async (query: string) => {
    setBusy(true);
    try {
      const result = await runAgent(root, query);
      if (result.kind === "open") {
        setAnswer(null);
        setSelectedId(result.node.id);
        setDetailId(result.node.id);
      } else {
        setDetailId(null);
        setSelectedId(null);
        setAnswer({
          id: `answer-${Date.now()}`,
          label: result.title,
          body: result.text,
          kind: "attribute",
        });
      }
    } finally {
      setBusy(false);
    }
  };

  const caption =
    (hoveredId && findNode(root, hoveredId)) ||
    (selectedId && findNode(root, selectedId)) ||
    center;
  const detailNode = detailId ? findNode(root, detailId) : null;
  const stageNode = answer ?? detailNode;
  const motionSafe = !reducedMotion;

  // First-move suggestions: name the worlds around the centre, plus one
  // question, so a visitor always has somewhere to begin.
  const suggestions = useMemo(() => {
    const worlds = children
      .filter((c) => c.id !== "connect")
      .slice(0, 3)
      .map((c) => `Show me ${c.label}`);
    const tail =
      center.id === "self"
        ? [`Who is ${center.label}?`]
        : ["How do I reach you?"];
    return [...worlds, ...tail].slice(0, 4);
  }, [children, center]);

  return (
    <div
      ref={stageRef}
      className="relative h-[calc(100vh-1px)] w-full overflow-hidden"
    >
      {/* Back affordance when drilled below the root. */}
      <AnimatePresence>
        {chain.length > 1 && (
          <motion.button
            type="button"
            onClick={back}
            initial={motionSafe ? { opacity: 0, x: -8 } : false}
            animate={{ opacity: 1, x: 0 }}
            exit={motionSafe ? { opacity: 0, x: -8 } : undefined}
            className="absolute left-5 top-5 z-20 inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/60 px-3 py-1.5 text-xs font-medium text-foreground/80 backdrop-blur-md transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {chain[chain.length - 2].label}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Edit affordances. */}
      {owner && (
        <div className="absolute right-5 top-5 z-20 flex items-center gap-2">
          {editing && status !== "idle" && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/60 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-md"
              aria-live="polite"
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background:
                    status === "error"
                      ? "#ef4444"
                      : status === "saved"
                        ? "var(--organism-accent-strong)"
                        : "var(--organism-accent-soft)",
                }}
              />
              {status === "saving"
                ? "Publishing…"
                : status === "saved"
                  ? "Published"
                  : status === "loading"
                    ? "Syncing…"
                    : "Offline"}
            </span>
          )}
          {editing && (
            <button
              type="button"
              onClick={reset}
              title="Reset the graph to its seed"
              className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/60 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-md transition-colors hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setEditing((e) => !e);
              setSelectedId(null);
            }}
            aria-pressed={editing}
            title={editing ? "Done editing" : "Edit the graph"}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/60 px-3 py-1.5 text-xs font-medium text-foreground/80 backdrop-blur-md transition-colors hover:text-foreground"
          >
            {editing ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Done
              </>
            ) : (
              <>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </>
            )}
          </button>
          {!editing && isOwner && (
            <button
              type="button"
              onClick={() => setInviteOpen(true)}
              title="Invite someone"
              className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--organism-accent-soft)] bg-background/60 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur-md transition-colors hover:bg-foreground/[0.06]"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Invite
            </button>
          )}
          {!editing && isOwner && (
            <button
              type="button"
              onClick={() => void logout()}
              title="Sign out"
              className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/60 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-md transition-colors hover:text-foreground"
            >
              Sign out
            </button>
          )}
        </div>
      )}

      {/* Quiet owner door for visitors — only the owner's code unlocks it. */}
      {!owner && (
        <button
          type="button"
          onClick={() => setSignInOpen(true)}
          title="Sign in"
          className="absolute right-5 top-5 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/40 bg-background/40 text-muted-foreground/60 backdrop-blur-md transition-colors hover:text-foreground"
          aria-label="Sign in"
        >
          <LogIn className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Gravity well — radial field behind the nucleus. */}
      {size.w > 0 && (
        <div
          className="pointer-events-none absolute"
          style={{ left: cx, top: cy, zIndex: 1 }}
          aria-hidden="true"
        >
          {/* Inner orb — bright, floating. Fades in on entrance, then drifts. */}
          <motion.div
            animate={{
              x: ["-50%", "-40%", "-60%", "-50%"],
              y: ["-50%", "-60%", "-40%", "-50%"],
              scale: [1, 1.1, 0.9, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              position: "absolute",
              width: 380,
              height: 380,
              left: 0,
              top: 0,
              borderRadius: "50%",
              background: "var(--primary)",
              opacity: arrived ? 0.16 : 0,
              filter: "blur(120px)",
              transition: "opacity 1200ms ease",
            }}
          />
          {/* Outer orb — faint, wide, counter-floating. */}
          <motion.div
            animate={{
              x: ["-50%", "-60%", "-40%", "-50%"],
              y: ["-50%", "-40%", "-60%", "-50%"],
              scale: [1, 0.9, 1.1, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              position: "absolute",
              width: 600,
              height: 600,
              left: 0,
              top: 0,
              borderRadius: "50%",
              background: "var(--organism-accent-soft)",
              opacity: arrived ? 0.14 : 0,
              filter: "blur(160px)",
              transition: "opacity 1600ms ease 300ms",
            }}
          />
        </div>
      )}

      {/* Synaptic edges from the nucleus to each attribute. */}
      {size.w > 0 && (
        <svg
          className="pointer-events-none absolute inset-0"
          width={size.w}
          height={size.h}
          aria-hidden="true"
        >
          {children.map((child, i) => (
            <SynapticEdge
              key={child.id}
              id={child.id}
              cx={cx}
              cy={cy}
              px={positions[i].x}
              py={positions[i].y}
              index={i}
              hovered={hoveredId === child.id}
              active={selectedId === child.id}
              reducedMotion={reducedMotion}
            />
          ))}
        </svg>
      )}

      {/* Nucleus. */}
      <motion.div
        ref={nucleusRef}
        className="absolute z-10 -translate-x-1/2"
        style={{ left: cx, top: cy }}
        initial={
          motionSafe ? { scale: 0, opacity: 0, y: -coreOffset - 40 } : false
        }
        animate={{ scale: 1, opacity: 1, y: -coreOffset }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
      >
        <GraphNode
          node={center}
          variant="center"
          reducedMotion={reducedMotion}
          onActivate={activate}
        />
        {/* The flagship, one tap from the front door rather than two drills in. */}
        {!editing && chain.length === 1 && (
          <motion.div
            className="mt-5 flex justify-center"
            initial={motionSafe ? { opacity: 0, y: 6 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.5 }}
          >
            <button
              type="button"
              onClick={() => navigate("/book/digital-organism-theory")}
              className="group inline-flex items-center gap-2 rounded-full border border-[color:var(--organism-accent-soft)] bg-background/60 px-4 py-2 text-xs font-medium text-foreground/90 backdrop-blur-md transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Read Book One
              <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
            </button>
          </motion.div>
        )}
        {editing && (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => openAdd(center)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/60 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-md transition-colors hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
              Add to {center.label}
            </button>
          </div>
        )}
      </motion.div>

      {/* Attribute nodes — staggered entrance, orbital breathing, depth-aware exit. */}
      <AnimatePresence mode="popLayout">
        {size.w > 0 &&
          children.map((child, i) => {
            const slot = slots[i];
            // Staggered entrance delay: nodes arrive one after another.
            const entranceDelay = 0.5 + i * 0.065;

            return (
              <motion.div
                key={`${center.id}:${child.id}`}
                className="absolute z-10"
                initial={
                  motionSafe
                    ? { opacity: 0, scale: 0.5, left: cx, top: cy }
                    : false
                }
                animate={{
                  opacity: 1,
                  scale: 1,
                  left: positions[i].x,
                  top: positions[i].y,
                }}
                exit={
                  motionSafe
                    ? {
                        // Depth-aware exit: siblings radiate outward and fade
                        // when drilling, or collapse to centre when backing.
                        opacity: 0,
                        scale: drilling ? 0.7 : 0.5,
                        left: drilling
                          ? positions[i].x + (slot?.ux ?? 0) * 80
                          : cx,
                        top: drilling
                          ? positions[i].y + (slot?.uy ?? 0) * 80
                          : cy,
                      }
                    : undefined
                }
                transition={{
                  type: "spring",
                  stiffness: 160,
                  damping: 24,
                  delay: entranceDelay,
                }}
                style={{
                  translateX: "-50%",
                  translateY: "-50%",
                }}
                onMouseEnter={() => setHoveredId(child.id)}
                onMouseLeave={() =>
                  setHoveredId((h) => (h === child.id ? null : h))
                }
              >
                <GraphNode
                  node={child}
                  variant="leaf"
                  active={selectedId === child.id}
                  reducedMotion={reducedMotion}
                  editing={editing}
                  onActivate={activate}
                  onAddChild={openAdd}
                  onEdit={openEdit}
                  onRemove={(node) => remove(node.id)}
                />
              </motion.div>
            );
          })}
      </AnimatePresence>

      {/* Add-a-node ghost slot (edit mode). */}
      {editing && size.w > 0 && (
        <motion.button
          type="button"
          onClick={() => openAdd(center)}
          className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          style={{
            left: positions[children.length]?.x ?? cx,
            top: positions[children.length]?.y ?? cy,
          }}
          initial={motionSafe ? { opacity: 0, scale: 0.8 } : false}
          animate={{ opacity: 1, scale: 1 }}
          aria-label={`Add a node to ${center.label}`}
        >
          <span className="flex h-[29px] w-[29px] items-center justify-center rounded-full border border-dashed border-border/70">
            <Plus className="h-4 w-4" />
          </span>
          <span className="text-sm font-medium">Add</span>
        </motion.button>
      )}

      {/* Essence caption — quiet, ambient, never demanding. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-10 flex justify-center px-6">
        <AnimatePresence mode="wait">
          <motion.p
            key={caption.id + (caption.description ?? "")}
            initial={motionSafe ? { opacity: 0, y: 6 } : false}
            animate={{ opacity: 1, y: 0 }}
            exit={motionSafe ? { opacity: 0, y: -6 } : undefined}
            transition={{ duration: 0.3, delay: arrived ? 0 : 0.9 }}
            className="max-w-md text-center text-sm text-muted-foreground"
          >
            {caption.description}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Node content page — blooms from the centre of the graph. */}
      <AnimatePresence>
        {stageNode && (
          <NodeStage
            node={stageNode}
            editing={editing}
            ephemeral={Boolean(answer)}
            reducedMotion={reducedMotion}
            origin={{ x: cx, y: cy }}
            onClose={closeStage}
            onOpenChildren={(node) => drill(node)}
            onFollow={(node) => follow(node)}
            onEdit={(node) => openEdit(node)}
            onAddChild={(node) => openAdd(node)}
          />
        )}
      </AnimatePresence>

      {/* The chat — talk to the organism; it navigates or answers. */}
      {!editing && (
        <GraphChat
          onSubmit={async (q) => {
            dismissWelcome();
            await ask(q);
          }}
          busy={busy}
          suggestions={chain.length === 1 ? suggestions : []}
        />
      )}

      {/* First-run welcome whisper — tells a visitor where to begin. */}
      <AnimatePresence>
        {!welcomed && !editing && chain.length === 1 && !stageNode && (
          <motion.button
            type="button"
            onClick={dismissWelcome}
            initial={motionSafe ? { opacity: 0, y: -8 } : false}
            animate={{ opacity: 1, y: 0 }}
            exit={motionSafe ? { opacity: 0, y: -8 } : undefined}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="pointer-events-auto absolute inset-x-0 top-8 z-20 mx-auto flex max-w-md flex-col items-center gap-1 px-6 text-center"
            aria-label="Dismiss welcome"
          >
            <span className="text-sm font-medium text-foreground/90">
              {center.label}, as a living graph.
            </span>
            <span className="text-xs text-muted-foreground">
              Tap a dot to open it, or just ask below.
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Authoring panel. */}
      <AnimatePresence>
        {editor && (
          <NodeEditor
            mode={editor.mode}
            origin={{ x: cx, y: cy }}
            reducedMotion={reducedMotion}
            contextLabel={
              editor.mode === "add" ? editor.parentLabel : editor.node.label
            }
            initial={
              editor.mode === "edit"
                ? {
                    label: editor.node.label,
                    description: editor.node.description,
                    body: editor.node.body,
                    kind: editor.node.kind,
                    href: editor.node.href,
                    image: editor.node.image,
                  }
                : undefined
            }
            onSubmit={submitEditor}
            onClose={() => setEditor(null)}
            onDelete={
              editor.mode === "edit"
                ? () => {
                    remove(editor.node.id);
                    setEditor(null);
                  }
                : undefined
            }
          />
        )}
      </AnimatePresence>

      {/* Owner sign-in. */}
      <AnimatePresence>
        {signInOpen && (
          <SignIn
            origin={{ x: cx, y: cy }}
            reducedMotion={reducedMotion}
            onClose={() => setSignInOpen(false)}
            onSignedIn={() => {
              setSignInOpen(false);
              void refreshAuth();
            }}
          />
        )}
      </AnimatePresence>

      {/* Owner invitation — invite-only by design. */}
      <AnimatePresence>
        {inviteOpen && (
          <Invite
            origin={{ x: cx, y: cy }}
            reducedMotion={reducedMotion}
            onClose={() => setInviteOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Guest arrival — someone opened a door for them. */}
      <AnimatePresence>
        {invited.open && (
          <InviteWelcome
            ownerName={root.label}
            arrival={invited.arrival}
            origin={{ x: cx, y: cy }}
            reducedMotion={reducedMotion}
            onEnter={() => {
              // If they're already signed in, joining the circle is immediate;
              // otherwise the token is simply dismissed and they explore freely.
              if (isOwner && invited.token) {
                void acceptInvite(invited.token);
                pulse(0.8); // a new connection — the organism feels it
              }
              invited.dismiss();
              dismissWelcome();
            }}
            onClose={() => invited.dismiss()}
          />
        )}
      </AnimatePresence>

      {/* Circle — the networking surface, personal-first. */}
      <AnimatePresence>
        {platformSurface === "circle" && (
          <CircleSurface
            ownerName={root.label}
            isOwner={isOwner}
            origin={{ x: cx, y: cy }}
            reducedMotion={reducedMotion}
            onInvite={() => {
              setPlatformSurface(null);
              setInviteOpen(true);
            }}
            onClose={() => setPlatformSurface(null)}
          />
        )}
      </AnimatePresence>

      {/* Vault — the knowledge ingestion surface. */}
      <AnimatePresence>
        {platformSurface === "vault" && (
          <VaultSurface
            origin={{ x: cx, y: cy }}
            reducedMotion={reducedMotion}
            onClose={() => setPlatformSurface(null)}
          />
        )}
      </AnimatePresence>

      {/* Support — how the movement is funded, since it takes no advertising. */}
      <AnimatePresence>
        {platformSurface === "support" && (
          <SupportSurface
            origin={{ x: cx, y: cy }}
            reducedMotion={reducedMotion}
            onClose={() => setPlatformSurface(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
