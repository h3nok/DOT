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
import { crownSlots, orderedRadialSlots } from "../attention-os/focus/radialOrder";
import { ThreadLine } from "../attention-os/focus/ThreadLine";
import {
  appendStep,
  clearThread,
  walkBackTo,
  type ThreadStep,
} from "../attention-os/focus/threadPath";
import { useOrganismPulse } from "../organism";
import { AgentWorkspace } from "./AgentWorkspace";
import type { AgentWorkspaceRequest } from "./AgentWorkspace";
import { CircleSurface } from "./Circle";
import { GraphNode } from "./GraphNode";
import { Invite } from "./Invite";
import { InviteWelcome } from "./InviteWelcome";
import { NodeEditor } from "./NodeEditor";
import { NodeStage } from "./NodeStage";
import { SignIn } from "./SignIn";
import { SupportSurface } from "./SupportSurface";
import { SynapticEdge } from "./SynapticEdge";
import { TwinSurface } from "./TwinSurface";
import { VaultSurface } from "./VaultSurface";
import { resolveNode } from "./agent";
import { findNode, resolveChain, type NodeDraft } from "./graphStore";
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

type PlatformSurface =
  | "publications"
  | "circle"
  | "vault"
  | "support"
  | "twin"
  | null;

/** "Practice and The Movement are being built." — the whole promise, once. */
function plannedLine(nodes: DotNode[]): string {
  const labels = nodes.map((node) => node.label);
  if (labels.length === 0) return "";
  const list =
    labels.length === 1
      ? labels[0]
      : `${labels.slice(0, -1).join(", ")} and ${labels.at(-1)}`;
  return `${list} ${labels.length === 1 ? "is" : "are"} being built.`;
}

function initialPlatformSurface(): PlatformSurface {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).has("support") ? "support" : null;
}

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
  const [platformSurface, setPlatformSurface] =
    useState<PlatformSurface>(initialPlatformSurface);
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
  const [companionRequest, setCompanionRequest] = useState<
    (AgentWorkspaceRequest & { id: number }) | null
  >(null);
  // The Thread: this session's path of attention. Never persisted (doc 12 §3).
  const [thread, setThread] = useState<ThreadStep[]>([]);

  // Orchestrated entrance — the graph assembles itself.
  const [arrived, setArrived] = useState(false);
  const [drilling, setDrilling] = useState(false);
  const closeSupport = useCallback(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("support");
      url.searchParams.delete("session_id");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }
    setPlatformSurface(null);
  }, []);
  useEffect(() => {
    if (reducedMotion) {
      setArrived(true);
      return;
    }
    const t = setTimeout(() => setArrived(true), 100);
    return () => clearTimeout(t);
  }, [reducedMotion]);

  // First-run welcome whisper (visitors only, once).
  const chain = useMemo(() => resolveChain(root, path), [root, path]);
  const center = chain[chain.length - 1];
  const allChildren = useMemo(() => center.children ?? [], [center.children]);

  // The field shows only doors that open, and shows each of them once.
  //
  // The canon is promoted out of the ring into the nucleus's single action
  // (ADR-0017: "The Canon is the primary entry"); offering it as a ring dot as
  // well put the same destination on the page twice at two different weights,
  // which is why nothing on this screen read as primary. Declared-but-unbuilt
  // limbs leave the ring entirely — ADR-0016 rejects "a ring of equal dots" and
  // says a quiet text line is the remedy, never a ring node.
  //
  // Editing restores the whole anatomy, so every limb stays reachable to its
  // author even while it is hidden from visitors.
  const primaryChild = useMemo(
    () => (editing ? null : (allChildren.find((child) => child.primary) ?? null)),
    [allChildren, editing],
  );
  const plannedChildren = useMemo(
    () => (editing ? [] : allChildren.filter((child) => child.planned)),
    [allChildren, editing],
  );
  const children = useMemo(
    () =>
      editing
        ? allChildren
        : allChildren.filter((child) => !child.primary && !child.planned),
    [allChildren, editing],
  );

  // An extra ghost slot in edit mode lets you add a child to the centre.
  const slotCount = children.length + (editing ? 1 : 0);
  // The root nucleus carries the masthead — mark, title, thesis, one action —
  // so its limbs form a crown above it. Deeper centres are a mark and a short
  // label, so they keep the ring: clockwise from 12, bottom arc reserved for
  // the label (doc 12 §6.1).
  const crowned = chain.length === 1 && !editing;
  const slots = useMemo(
    () => (crowned ? crownSlots(slotCount) : orderedRadialSlots(slotCount)),
    [crowned, slotCount],
  );

  // Responsive geometry.
  const stageRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(() => ({
    w: typeof window === "undefined" ? 0 : window.innerWidth,
    h: typeof window === "undefined" ? 0 : window.innerHeight,
  }));
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
  const compact = size.w < 640;
  const labelGutter = compact ? 116 : 180;
  const horizontalLimit = Math.max(72, (size.w - labelGutter) / 2);
  const proportionalRadius = Math.min(size.w, usableH) * 0.4;
  const horizontalRadius = Math.min(330, horizontalLimit, proportionalRadius);
  const verticalRadius = compact
    ? Math.min(220, usableH * 0.38)
    : horizontalRadius;

  const positions = slots.map((s) => ({
    x: cx + s.ux * horizontalRadius,
    y: cy + s.uy * verticalRadius,
  }));

  const drill = useCallback(
    (node: DotNode) => {
      setSelectedId(null);
      setDetailId(null);
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
    // Every deliberate move is recorded on the thread, including ones that
    // navigate away, so a member can always see the shape of this session.
    if (!editing && node.id !== root.id) {
      setThread((current) =>
        appendStep(current, { id: node.id, label: node.label }),
      );
    }
    // The centre opens Lumen, the shared conversational surface. Editing still
    // opens the graph node itself.
    if (node.kind === "self" && node.id === root.id && !editing) {
      setCompanionRequest(null);
      setPlatformSurface("twin");
      return;
    }
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
  };

  const ask = ({ query, lens }: AgentWorkspaceRequest) => {
    if (/\b(consult|lumen|companion)\b/i.test(query) && query.split(/\s+/).length < 5) {
      setCompanionRequest(null);
      setPlatformSurface("twin");
      return;
    }

    const navigationIntent =
      /^(?:open|show|find|view|go to|take me to)\b/i.test(query.trim());
    const navigation =
      lens === "orient" && navigationIntent ? resolveNode(root, query) : null;
    if (navigation?.kind === "open") {
      setSelectedId(navigation.node.id);
      setDetailId(navigation.node.id);
      return;
    }

    setDetailId(null);
    setSelectedId(null);
    setCompanionRequest({ query, lens, id: Date.now() });
    setPlatformSurface("twin");
  };

  // Only a node the visitor is actually pointing at earns the caption. Falling
  // back to `center` printed the nucleus description a second time, directly
  // beneath the copy GraphNode already renders under the mark.
  const caption =
    (hoveredId && findNode(root, hoveredId)) ||
    (selectedId && findNode(root, selectedId)) ||
    null;
  const detailNode = detailId ? findNode(root, detailId) : null;
  const stageNode = detailNode;
  const motionSafe = !reducedMotion;

  return (
    <div
      ref={stageRef}
      className="relative h-[calc(100vh-1px)] w-screen max-w-full overflow-hidden"
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
        className="absolute z-10"
        style={{ left: cx, top: cy }}
        initial={
          motionSafe ? { scale: 0, opacity: 0, y: -40 } : false
        }
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.44, ease: "easeOut", delay: 0.2 }}
      >
        <div className="-translate-x-1/2 -translate-y-[88px]">
          <GraphNode
            node={center}
            variant="center"
            reducedMotion={reducedMotion}
            thesis={chain.length === 1}
            onActivate={activate}
          />
          {/* The canon itself, as the one action rather than as a second dot. */}
          {!editing && chain.length === 1 && primaryChild && (
            <motion.div
              className="mt-7 flex flex-col items-center"
              initial={motionSafe ? { opacity: 0, y: 6 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.42, duration: 0.34, ease: "easeOut" }}
            >
              <button
                type="button"
                onClick={() => activate(primaryChild)}
                className="group inline-flex items-center gap-2.5 whitespace-nowrap rounded-full bg-foreground px-7 py-3.5 text-sm font-semibold text-background shadow-[0_10px_30px_-12px_rgb(0_0_0/0.5)] transition-transform duration-300 hover:-translate-y-0.5"
              >
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                Begin — Chapter One
                <ArrowRight
                  className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </button>
              {plannedChildren.length > 0 && (
                <p className="mt-6 max-w-xs text-center text-xs leading-relaxed text-muted-foreground/70">
                  {plannedLine(plannedChildren)}
                </p>
              )}
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
        </div>
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
                  duration: 0.42,
                  ease: "easeOut",
                  delay: entranceDelay,
                }}
                onMouseEnter={() => setHoveredId(child.id)}
                onMouseLeave={() =>
                  setHoveredId((h) => (h === child.id ? null : h))
                }
              >
                <div className="-translate-x-1/2 -translate-y-1/2">
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
                </div>
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

      {/* Essence caption — quiet, ambient, never demanding. Sits above the
          command bar's band (bottom-5 plus a ~52px pill); at bottom-10 it was
          painted over by it, so the caption was invisible on desktop. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-20 flex justify-center px-6">
        <AnimatePresence mode="wait">
          {caption?.description && (
            <motion.p
              key={caption.id + caption.description}
              initial={motionSafe ? { opacity: 0, y: 6 } : false}
              animate={{ opacity: 1, y: 0 }}
              exit={motionSafe ? { opacity: 0, y: -6 } : undefined}
              transition={{ duration: 0.3, delay: arrived ? 0 : 0.9 }}
              className="max-w-md text-center text-sm text-muted-foreground"
            >
              {caption.description}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Node content page — blooms from the centre of the graph. */}
      <AnimatePresence>
        {stageNode && (
          <NodeStage
            node={stageNode}
            editing={editing}
            ephemeral={false}
            reducedMotion={reducedMotion}
            origin={{ x: cx, y: cy }}
            onClose={closeStage}
            onOpenChildren={(node) => drill(node)}
            onFollow={(node) => follow(node)}
            onFollowRelation={(id) => {
              const next = findNode(root, id);
              if (next) activate(next);
            }}
            onEdit={(node) => openEdit(node)}
            onAddChild={(node) => openAdd(node)}
          />
        )}
      </AnimatePresence>

      {/* The chat — talk to the organism; it navigates or answers. */}
      {!editing && !stageNode && !platformSurface && (
        <AgentWorkspace
          onSubmit={ask}
          onOpenCompanion={() => {
            setCompanionRequest(null);
            setPlatformSurface("twin");
          }}
        />
      )}

      {/* The Thread — where this session has been, and how to walk back. */}
      {!editing && thread.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[124px] z-20 flex justify-center px-6">
          <ThreadLine
            thread={thread}
            reducedMotion={reducedMotion}
            onWalkBack={(id) => {
              setThread((current) => walkBackTo(current, id));
              const node = findNode(root, id);
              if (node) {
                setSelectedId(node.id);
                setDetailId(node.id);
              }
            }}
            onClear={() => setThread(clearThread())}
          />
        </div>
      )}

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
            onClose={closeSupport}
          />
        )}
      </AnimatePresence>

      {/* Lumen is the conversational centre of DOT. */}
      <AnimatePresence>
        {platformSurface === "twin" && (
          <TwinSurface
            origin={{ x: cx, y: cy }}
            reducedMotion={reducedMotion}
            initialRequest={companionRequest}
            onClose={() => {
              setCompanionRequest(null);
              setPlatformSurface(null);
            }}
            onOpenNode={(nodeId) => {
              if (!findNode(root, nodeId)) return;
              setPlatformSurface(null);
              setSelectedId(nodeId);
              setDetailId(nodeId);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
