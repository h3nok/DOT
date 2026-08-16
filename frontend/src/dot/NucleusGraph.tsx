import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    Plus,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { GraphNode } from "./GraphNode";
import { GraphToolbar } from "./GraphToolbar";
import { NodeEditor } from "./NodeEditor";
import { NodeStage } from "./NodeStage";
import {
  ModalOverlays,
  PlatformOverlays,
} from "./PlatformOverlays";
import { SynapticEdge } from "./SynapticEdge";
import { resolveNode } from "./agent";
import { findNode, resolveChain, type NodeDraft } from "./graphStore";
import { SUPPORT_PAYMENT_LINK } from "./supportLink";
import {
  hasChildren,
  initialPlatformSurface,
  type DotNode,
  type PlatformSurface,
} from "./types";
import { useAuth } from "./useAuth";
import { acceptInvite } from "./useCircle";
import { useEditableGraph } from "./useEditableGraph";
import { useGraphLayout } from "./useGraphLayout";
import { DOT_STEWARD_NAME } from "./dotGraph";
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
  const { user, isOwner, logout } = useAuth();
  const pulse = useOrganismPulse();
  // Authoring unlocks for an authenticated owner; `?owner=1` stays a local dev
  // escape hatch (it cannot publish to the server without a real session).
  const owner = isOwner || devOwner;
  const [signInOpen, setSignInOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [presenceOpen, setPresenceOpen] = useState(false);
  const [platformSurface, setPlatformSurface] =
    useState<PlatformSurface>(initialPlatformSurface);
  const invited = useInviteArrival();
  const { root, create, edit, remove, reset, status } = useEditableGraph(
    seed,
    isOwner,
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
  const children = useMemo(
    () =>
      editing
        ? allChildren
        : allChildren.filter((child) => !child.primary && !child.planned),
    [allChildren, editing],
  );

  // An extra ghost slot in edit mode lets you add a child to the centre.
  const slotCount = children.length + (editing ? 1 : 0);
  const crowned = chain.length === 1 && !editing;

  const { stageRef, size, cx, cy, positions } = useGraphLayout(
    slotCount,
    crowned,
    editing,
  );

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
    // The centre opens Minty, the shared conversational surface. Editing still
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
    if (/\b(consult|minty|companion)\b/i.test(query) && query.split(/\s+/).length < 5) {
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
            className="dot-pill absolute left-5 top-5 z-20 text-foreground/80"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {chain[chain.length - 2].label}
          </motion.button>
        )}
      </AnimatePresence>

      <GraphToolbar
        owner={owner}
        isOwner={isOwner}
        editing={editing}
        status={status}
        onToggleEdit={() => {
          setEditing((e) => !e);
          setSelectedId(null);
        }}
        onReset={reset}
        onInvite={() => setInviteOpen(true)}
        onSignOut={() => void logout()}
        onSignIn={() => setSignInOpen(true)}
      />

      {!editing && chain.length === 1 && center.introduction && (
        <motion.p
          initial={motionSafe ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.3 }}
          className="pointer-events-none absolute inset-x-0 top-5 z-10 mx-auto hidden max-w-2xl px-16 text-center font-serif text-sm leading-snug text-muted-foreground/80 sm:block"
        >
          {center.introduction}
        </motion.p>
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
            editing={editing}
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
                className="dot-reading-action group inline-flex min-h-12 items-center gap-2.5 whitespace-nowrap rounded-md px-7 py-3.5 text-sm font-semibold outline-none"
              >
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                {primaryChild.actionLabel ?? `Open ${primaryChild.label}`}
                <ArrowRight
                  className="h-3.5 w-3.5"
                  aria-hidden="true"
                />
              </button>
              {/* Who made this, and the single quiet ask. ADR-0017 keeps DOT at
                  the centre and the author a steward, but it also names the cost
                  — "anyone looking for the person has further to travel" — and
                  promises a byline as the remedy. ADR-0016 says that remedy is a
                  quiet text line, never another ring node, and ADR-0017 says
                  support is "stated plainly and asked once". This is that once. */}
              <p className="mt-5 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
                <span>by {DOT_STEWARD_NAME}</span>
                {SUPPORT_PAYMENT_LINK && (
                  <>
                    {/* The separator only earns its place while both halves
                        share a line; on a phone they stack and it would dangle. */}
                    <span aria-hidden="true" className="hidden sm:inline">
                      ·
                    </span>
                    <button
                      type="button"
                      onClick={() => setPlatformSurface("support")}
                      className="rounded-sm underline decoration-border underline-offset-4 outline-none transition-colors hover:text-foreground focus-visible:text-foreground"
                    >
                      Support this work
                    </button>
                  </>
                )}
              </p>
            </motion.div>
          )}
          {editing && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => openAdd(center)}
                className="dot-pill text-muted-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
                Add to {center.label}
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Presence — a signed-in member is a node on the field, not a corner
          avatar. It sits just off the nucleus, distinct from the content ring,
          and opens the member's own surface. Absent when the field is anonymous. */}
      {user && !editing && (
        <motion.button
          type="button"
          onClick={() => setPresenceOpen(true)}
          className="group absolute z-10 flex flex-col items-center gap-1.5 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--organism-accent-strong)]"
          style={{ left: cx, top: cy }}
          initial={motionSafe ? { opacity: 0, scale: 0.8 } : false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.4, ease: "easeOut" }}
          aria-label={`You are present as ${user.display_name?.trim() || "a member"}. Open your presence.`}
        >
          <span className="flex translate-x-[92px] translate-y-[84px] flex-col items-center gap-1.5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full border font-serif text-sm text-foreground transition-transform duration-300 group-hover:scale-105"
              style={{
                borderColor: "var(--organism-accent-soft)",
                background:
                  "color-mix(in oklch, var(--organism-accent) 10%, transparent)",
              }}
              aria-hidden="true"
            >
              {(user.display_name?.trim()[0] ?? "Y").toUpperCase()}
            </span>
            <span className="dot-label whitespace-nowrap">
              {user.display_name?.trim() || "You"}
            </span>
          </span>
        </motion.button>
      )}

      {/* Attribute nodes — staggered entrance, orbital breathing, depth-aware exit. */}
      <AnimatePresence mode="popLayout">
        {size.w > 0 &&
          children.map((child, i) => {
            // Staggered entrance delay: nodes arrive one after another.
            const entranceDelay = 0.5 + i * 0.065;

            return (
              <motion.div
                key={`${center.id}:${child.id}`}
                className="absolute z-10"
                style={{ left: positions[i].x, top: positions[i].y }}
                initial={
                  motionSafe
                    ? { opacity: 0, scale: 0.92 }
                    : false
                }
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                exit={
                  motionSafe
                    ? {
                        opacity: 0,
                        scale: drilling ? 0.96 : 0.92,
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
            showIntroduction={
              editor.mode === "edit" && editor.node.id === root.id
            }
            showActionLabel={
              editor.mode === "edit" && editor.node.primary === true
            }
            initial={
              editor.mode === "edit"
                ? {
                    label: editor.node.label,
                    description: editor.node.description,
                    introduction: editor.node.introduction,
                    actionLabel: editor.node.actionLabel,
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
              editor.mode === "edit" && editor.node.id !== root.id
                ? () => {
                    remove(editor.node.id);
                    setEditor(null);
                  }
                : undefined
            }
          />
        )}
      </AnimatePresence>

      <PlatformOverlays
        surface={platformSurface}
        origin={{ x: cx, y: cy }}
        reducedMotion={reducedMotion}
        root={root}
        isOwner={isOwner}
        companionRequest={companionRequest}
        onSetSurface={setPlatformSurface}
        onCloseSupport={closeSupport}
        onInvite={() => setInviteOpen(true)}
        onOpenNode={(nodeId) => {
          if (!findNode(root, nodeId)) return;
          setPlatformSurface(null);
          setSelectedId(nodeId);
          setDetailId(nodeId);
        }}
        onClearCompanion={() => setCompanionRequest(null)}
      />

      <ModalOverlays
        signInOpen={signInOpen}
        inviteOpen={inviteOpen}
        presenceOpen={presenceOpen}
        origin={{ x: cx, y: cy }}
        reducedMotion={reducedMotion}
        user={user}
        invited={invited}
        rootLabel={root.label}
        isOwner={isOwner}
        onCloseSignIn={() => setSignInOpen(false)}
        onCloseInvite={() => setInviteOpen(false)}
        onClosePresence={() => setPresenceOpen(false)}
        onOpenConversations={() => {
          setPresenceOpen(false);
          setCompanionRequest(null);
          setPlatformSurface("twin");
        }}
        onPresenceInvite={() => {
          setPresenceOpen(false);
          setInviteOpen(true);
        }}
        onSignOut={() => {
          setPresenceOpen(false);
          void logout();
        }}
        onEnterInvite={() => {
          if (isOwner && invited.token) {
            void acceptInvite(invited.token);
            pulse(0.8);
          }
          invited.dismiss();
        }}
      />
    </div>
  );
};
