import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  List,
  Moon,
  Pencil,
  RotateCcw,
  Sun,
  Type,
  X,
} from "lucide-react";
import {
  doctrineNodes,
  getDoctrineNode,
  type DoctrineNode,
} from "../../content/doctrine/doctrineData";
import { useTheme } from "../../shared/contexts/SimpleThemeContext";
import { useSignalAccent } from "../../shared/hooks/useSignalAccent";
import { useOwnerMode } from "../../dot/useOwnerMode";
import OrchestratorNodeTools from "./OrchestratorNodeTools";

// Coherence Surface — conforms to
// docs/blueprint/08-DOCTRINE-AND-COHERENCE-SURFACE.md
//
// Resting surface = graph + single focus panel + quiet question input.
// No ads, no feeds, no vanity metrics, no return-loop mechanics.
// Light and dark are both first-class, driven by surface tokens.

const surfaceConfig = {
  accent: "#00a896",
  center: { x: 50, y: 50 },
  radius: { foundation: 22, inner: 30, outer: 40 },
  motion: { settle: 0.5, appear: 0.4, focus: 0.46 },
};

// Token palette per theme. Every visible color resolves from here so the
// surface renders legibly in both light and dark without hardcoded values.
// The accent is the single user-selected signal color — never the shifting
// organism accent — so the whole reading surface stays in one theme color.
const buildPalette = (isDark: boolean, accent: string): CSSProperties =>
  ({
    "--surface-accent": accent,
    "--surface-accent-soft":
      "color-mix(in oklch, var(--surface-accent) 22%, transparent)",
    "--surface-bg": isDark ? "oklch(0.018 0 0)" : "oklch(0.982 0.006 205)",
    "--surface-fg": isDark ? "oklch(0.96 0 0)" : "oklch(0.23 0.018 215)",
    "--surface-body": isDark
      ? "oklch(0.96 0 0 / 0.74)"
      : "oklch(0.3 0.014 215 / 0.88)",
    "--surface-muted": isDark
      ? "oklch(0.96 0 0 / 0.45)"
      : "oklch(0.38 0.014 215 / 0.58)",
    "--surface-faint": isDark
      ? "oklch(0.96 0 0 / 0.2)"
      : "oklch(0.34 0.014 215 / 0.16)",
    "--surface-panel": isDark
      ? "oklch(0.09 0 0 / 0.82)"
      : "oklch(0.998 0.003 205 / 0.9)",
    "--surface-node": isDark
      ? "oklch(0.12 0 0 / 0.72)"
      : "oklch(0.996 0.004 205 / 0.86)",
    "--surface-border": isDark
      ? "color-mix(in oklch, var(--surface-accent) 30%, transparent)"
      : "color-mix(in oklch, var(--surface-accent) 44%, transparent)",
    "--surface-hairline": isDark
      ? "oklch(0.96 0 0 / 0.12)"
      : "oklch(0.32 0.014 205 / 0.12)",
    "--surface-graph-line": isDark
      ? "color-mix(in oklch, var(--surface-fg) 30%, transparent)"
      : "color-mix(in oklch, var(--surface-fg) 42%, transparent)",
    "--surface-node-border": isDark
      ? "color-mix(in oklch, var(--surface-fg) 26%, transparent)"
      : "color-mix(in oklch, var(--surface-fg) 34%, transparent)",
    "--surface-shadow": isDark
      ? "0 28px 100px rgba(0,0,0,0.7)"
      : "0 28px 84px rgba(24,42,46,0.16)",
    "--surface-organism-shadow": isDark
      ? "0 0 calc(6px + var(--organism-glow, 0px)) var(--surface-accent-soft)"
      : "0 0 calc(4px + var(--organism-glow, 0px)) var(--surface-accent-soft)",
    "--surface-card": isDark
      ? "oklch(0.12 0 0 / 0.58)"
      : "oklch(0.998 0.003 205 / 0.66)",
    "--surface-scrollbar": isDark
      ? "oklch(0.96 0 0 / 0.22)"
      : "oklch(0.42 0.018 205 / 0.2)",
    background: isDark
      ? "radial-gradient(circle at 50% 46%, color-mix(in oklch, var(--surface-accent) 10%, transparent), transparent 30%), linear-gradient(180deg, #010101 0%, #040404 60%, #060606 100%)"
      : "radial-gradient(circle at 50% 44%, color-mix(in oklch, var(--surface-accent) 7%, transparent), transparent 32%), radial-gradient(circle at 82% 18%, color-mix(in oklch, #2563eb 4%, transparent), transparent 30%), linear-gradient(180deg, #fbfdfc 0%, #f3f8f7 55%, #eaf2f1 100%)",
  }) as CSSProperties;

const relationLabel: Record<string, string> = {
  "depends-on": "rests on",
  "leads-to": "leads to",
  contrasts: "contrasts with",
  defines: "defines",
  applies: "applies to",
};

const doctrineEditsStorageKey = "dot-doctrine-reading-edits";
const readingPrefsStorageKey = "dot-doctrine-reading-prefs";

interface EditableCardState {
  thesis?: string;
  synthesis?: [string, string];
  reading?: string;
}

type DoctrineEditMap = Record<string, EditableCardState>;

interface ReadingPrefs {
  scale: number;
  measure: number;
  typewriter: boolean;
}

const READING_LIMITS = {
  scale: { min: 0.85, max: 1.55, step: 0.05 },
  measure: { min: 460, max: 920 },
};

const defaultPrefs: ReadingPrefs = { scale: 1, measure: 680, typewriter: true };

const clamp = (value: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, value));

const readStoredEdits = (): DoctrineEditMap => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(doctrineEditsStorageKey);
    return raw ? (JSON.parse(raw) as DoctrineEditMap) : {};
  } catch {
    return {};
  }
};

const readStoredPrefs = (): ReadingPrefs => {
  if (typeof window === "undefined") return defaultPrefs;
  try {
    const raw = window.localStorage.getItem(readingPrefsStorageKey);
    if (!raw) return defaultPrefs;
    const parsed = JSON.parse(raw) as Partial<ReadingPrefs>;
    return {
      scale: clamp(
        parsed.scale ?? defaultPrefs.scale,
        READING_LIMITS.scale.min,
        READING_LIMITS.scale.max,
      ),
      measure: clamp(
        parsed.measure ?? defaultPrefs.measure,
        READING_LIMITS.measure.min,
        READING_LIMITS.measure.max,
      ),
      typewriter: parsed.typewriter ?? defaultPrefs.typewriter,
    };
  } catch {
    return defaultPrefs;
  }
};

const getParagraphs = (body: string) =>
  body
    .split("\n\n")
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

const buildDefaultSynthesis = (node: DoctrineNode): [string, string] => {
  const paragraphs = getParagraphs(node.body);
  const first = paragraphs[0] ?? node.oneLine;
  const last = paragraphs.at(-1) ?? node.oneLine;
  return [node.oneLine.replace(/\.$/, "."), last === first ? first : last];
};

// Immersive typewriter reveal. Honors reduced motion (renders instantly),
// gently accelerates so long passages stay readable, and completes on click.
const Typewriter = ({
  text,
  active,
  className,
}: {
  text: string;
  active: boolean;
  className?: string;
}) => {
  const reduced = useReducedMotion();
  const run = active && !reduced;
  const [count, setCount] = useState(run ? 0 : text.length);
  const [done, setDone] = useState(!run);

  useEffect(() => {
    if (!run) {
      setCount(text.length);
      setDone(true);
      return;
    }
    setCount(0);
    setDone(false);
    let raf = 0;
    let shown = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const speed = 34 + (shown / Math.max(text.length, 1)) * 150;
      shown = Math.min(text.length, shown + dt * speed);
      const next = Math.floor(shown);
      setCount(next);
      if (next < text.length) {
        raf = requestAnimationFrame(tick);
      } else {
        setDone(true);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, run]);

  const complete = () => {
    setCount(text.length);
    setDone(true);
  };

  return (
    <div
      className={`${className ?? ""} ${done ? "" : "cursor-pointer"}`}
      onClick={done ? undefined : complete}
      role={done ? undefined : "button"}
      aria-label={done ? undefined : "Reveal the full passage"}
    >
      <span className="whitespace-pre-line">{text.slice(0, count)}</span>
      {!done ? (
        <span
          className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[0.12em] animate-pulse rounded-full"
          style={{ background: "var(--surface-accent)" }}
          aria-hidden="true"
        />
      ) : null}
    </div>
  );
};

const DoctrinePage = () => {
  const navigate = useNavigate();
  const params = useParams<{ nodeId?: string }>();
  const { theme, setTheme } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const isDark = theme === "dark";
  const accent = useSignalAccent();
  const owner = useOwnerMode();

  const initialId =
    params.nodeId && getDoctrineNode(params.nodeId)
      ? params.nodeId
      : doctrineNodes[0].id;

  const [focusId, setFocusId] = useState<string>(initialId);
  const [edits, setEdits] = useState<DoctrineEditMap>(() =>
    owner ? readStoredEdits() : {},
  );
  const [editing, setEditing] = useState(false);
  const [prefs, setPrefs] = useState<ReadingPrefs>(() => readStoredPrefs());
  const [progress, setProgress] = useState(0);
  const [showIndex, setShowIndex] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const focusNode = getDoctrineNode(focusId) ?? doctrineNodes[0];
  const focusIndex = doctrineNodes.findIndex(
    (node) => node.id === focusNode.id,
  );
  const prevNode = focusIndex > 0 ? doctrineNodes[focusIndex - 1] : null;
  const nextNode =
    focusIndex < doctrineNodes.length - 1
      ? doctrineNodes[focusIndex + 1]
      : null;

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `DOT — Doctrine — ${focusNode.title}`;
    return () => {
      document.title = previousTitle;
    };
  }, [focusNode.title]);

  useEffect(() => {
    if (
      params.nodeId &&
      params.nodeId !== focusId &&
      getDoctrineNode(params.nodeId)
    ) {
      setFocusId(params.nodeId);
      setEditing(false);
    }
  }, [focusId, params.nodeId]);

  useEffect(() => {
    if (owner) {
      window.localStorage.setItem(
        doctrineEditsStorageKey,
        JSON.stringify(edits),
      );
    }
  }, [edits, owner]);

  useEffect(() => {
    if (owner) {
      setEdits(readStoredEdits());
    } else {
      setEditing(false);
      setEdits({});
    }
  }, [owner]);

  useEffect(() => {
    window.localStorage.setItem(readingPrefsStorageKey, JSON.stringify(prefs));
  }, [prefs]);

  // Reset to the top of the reading column when the idea changes.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
    setProgress(0);
  }, [focusId]);

  const selectNode = (id: string) => {
    setFocusId(id);
    setEditing(false);
    setShowIndex(false);
    navigate(`/doctrine/${id}`);
  };

  const nodeEdits = owner ? (edits[focusNode.id] ?? {}) : {};
  const defaultSynthesis = useMemo(
    () => buildDefaultSynthesis(focusNode),
    [focusNode],
  );

  const thesis = nodeEdits.thesis ?? focusNode.oneLine;
  const synthesis = nodeEdits.synthesis ?? defaultSynthesis;
  const argument =
    nodeEdits.reading ?? getParagraphs(focusNode.body).join("\n\n");

  const updateEdit = (
    key: keyof EditableCardState,
    value: string | [string, string],
  ) => {
    setEdits((current) => ({
      ...current,
      [focusNode.id]: { ...(current[focusNode.id] ?? {}), [key]: value },
    }));
  };

  const resetNode = () => {
    setEdits((current) => {
      const next = { ...current };
      delete next[focusNode.id];
      return next;
    });
  };

  const surfaceStyle = useMemo(
    () => buildPalette(isDark, accent),
    [isDark, accent],
  );

  const adjustScale = (delta: number) =>
    setPrefs((current) => ({
      ...current,
      scale: clamp(
        Number((current.scale + delta).toFixed(2)),
        READING_LIMITS.scale.min,
        READING_LIMITS.scale.max,
      ),
    }));

  const handleScroll = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;
    const max = element.scrollHeight - element.clientHeight;
    setProgress(max > 0 ? clamp(element.scrollTop / max, 0, 1) : 0);
  }, []);

  const startResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const startX = event.clientX;
    const startMeasure = prefs.measure;
    const onMove = (moveEvent: PointerEvent) => {
      const delta = (moveEvent.clientX - startX) * 2;
      setPrefs((current) => ({
        ...current,
        measure: clamp(
          startMeasure + delta,
          READING_LIMITS.measure.min,
          READING_LIMITS.measure.max,
        ),
      }));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const controlButton =
    "inline-flex h-9 w-9 items-center justify-center rounded-full border text-[color:var(--surface-muted)] transition-colors hover:text-[color:var(--surface-fg)] [&_svg]:pointer-events-none";

  return (
    <div
      className="fixed inset-0 z-30 w-full overflow-hidden text-[color:var(--surface-fg)]"
      style={surfaceStyle}
    >
      <h1 className="sr-only">DOT Doctrine — {focusNode.title}</h1>

      {/* Reading progress */}
      <div
        className="fixed inset-x-0 top-0 z-50 h-[3px] origin-left"
        style={{
          transform: `scaleX(${progress})`,
          background: "var(--surface-accent)",
          opacity: progress > 0.001 ? 1 : 0,
          transition: "opacity 240ms ease",
        }}
        aria-hidden="true"
      />

      {/* Back to the movement graph */}
      <Link
        to="/"
        className="organism-alive fixed left-4 top-4 z-40 inline-flex h-9 items-center gap-2 rounded-full border pl-2.5 pr-3.5 text-[13px] font-semibold text-[color:var(--surface-muted)] backdrop-blur-2xl transition-colors hover:text-[color:var(--surface-fg)]"
        style={{
          borderColor: "var(--surface-hairline)",
          background: "var(--surface-panel)",
          boxShadow: "var(--surface-shadow)",
        }}
        aria-label="Back to the movement graph"
        title="Back to the movement graph"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" />
        <span>Back</span>
      </Link>

      {/* Reading controls — quiet until hovered or focused */}
      <div
        className="fixed right-4 top-4 z-40 flex items-center gap-1 rounded-full border p-1 opacity-55 backdrop-blur-2xl transition-opacity duration-300 hover:opacity-100 focus-within:opacity-100"
        style={{
          borderColor: "var(--surface-hairline)",
          background: "var(--surface-panel)",
          boxShadow: "var(--surface-shadow)",
        }}
      >
        <button
          type="button"
          onClick={() => adjustScale(-READING_LIMITS.scale.step)}
          className={controlButton}
          style={{ borderColor: "transparent" }}
          aria-label="Smaller text"
          title="Smaller text"
        >
          <span className="text-xs font-black">A−</span>
        </button>
        <button
          type="button"
          onClick={() => adjustScale(READING_LIMITS.scale.step)}
          className={controlButton}
          style={{ borderColor: "transparent" }}
          aria-label="Larger text"
          title="Larger text"
        >
          <span className="text-sm font-black">A+</span>
        </button>
        <span
          className="mx-0.5 h-5 w-px"
          style={{ background: "var(--surface-hairline)" }}
          aria-hidden="true"
        />
        <button
          type="button"
          onClick={() =>
            setPrefs((current) => ({
              ...current,
              typewriter: !current.typewriter,
            }))
          }
          className={controlButton}
          style={{
            borderColor: "transparent",
            color: prefs.typewriter ? "var(--surface-accent)" : undefined,
          }}
          aria-pressed={prefs.typewriter}
          aria-label="Toggle typewriter reveal"
          title="Typewriter reveal"
        >
          <Type className="h-4 w-4" />
        </button>
        {owner ? (
          <button
            type="button"
            onClick={() => setEditing((value) => !value)}
            className={controlButton}
            style={{
              borderColor: "transparent",
              color: editing ? "var(--surface-accent)" : undefined,
            }}
            aria-pressed={editing}
            aria-label={editing ? "Finish editing" : "Edit this idea"}
            title={editing ? "Finish editing" : "Edit this idea"}
          >
            {editing ? (
              <Check className="h-4 w-4" />
            ) : (
              <Pencil className="h-4 w-4" />
            )}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setShowIndex(true)}
          className={controlButton}
          style={{ borderColor: "transparent" }}
          aria-label="Open the idea index"
          title="All ideas"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className={controlButton}
          style={{ borderColor: "transparent" }}
          aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
          title={`Switch to ${isDark ? "light" : "dark"} theme`}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      {/* Single, focused reading surface */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full w-full overflow-y-auto"
        style={{
          scrollbarColor: "var(--surface-scrollbar) transparent",
          scrollbarWidth: "thin",
        }}
      >
        <AnimatePresence mode="wait">
          <motion.article
            key={focusNode.id}
            initial={
              prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 22 }
            }
            animate={{ opacity: 1, y: 0 }}
            exit={
              prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -18 }
            }
            transition={{
              duration: prefersReducedMotion
                ? 0.18
                : surfaceConfig.motion.focus,
            }}
            className="relative mx-auto px-6 pb-40 pt-24 sm:px-10"
            style={
              {
                width: "min(var(--reading-measure), 92vw)",
                fontSize: `${prefs.scale}rem`,
                "--reading-measure": `${prefs.measure}px`,
              } as CSSProperties
            }
          >
            {/* Resize handle */}
            <div
              className="absolute right-0 top-28 hidden h-40 w-3 cursor-ew-resize touch-none items-center justify-center sm:flex"
              onPointerDown={startResize}
              role="separator"
              aria-orientation="vertical"
              aria-label="Drag to resize the reading width"
              title="Drag to resize"
            >
              <span
                className="h-16 w-[3px] rounded-full"
                style={{ background: "var(--surface-hairline)" }}
              />
            </div>

            <p className="font-mono text-[0.7em] font-bold uppercase tracking-[0.32em] text-[color:var(--surface-accent)]">
              {focusNode.kind}
            </p>
            <h2 className="mt-3 font-serif text-[2.6em] font-black leading-[1.05] text-[color:var(--surface-fg)]">
              {focusNode.title}
            </h2>

            {/* Lead / thesis */}
            {editing ? (
              <textarea
                value={thesis}
                onChange={(event) => updateEdit("thesis", event.target.value)}
                className="mt-6 w-full resize-none rounded-lg border bg-transparent p-3 font-serif text-[1.32em] italic leading-[1.6] outline-none"
                style={{ borderColor: "var(--surface-hairline)" }}
                rows={3}
                aria-label="Edit the thesis"
              />
            ) : (
              <p
                className="mt-6 border-l-2 pl-5 font-serif text-[1.32em] italic leading-[1.6] text-[color:var(--surface-fg)]"
                style={{ borderColor: "var(--surface-accent)" }}
              >
                {thesis}
              </p>
            )}

            {/* Two-bullet synthesis */}
            <div
              className="mt-8 rounded-xl border p-5"
              style={{
                borderColor:
                  "color-mix(in oklch, var(--surface-accent) 22%, var(--surface-hairline))",
                background: "var(--surface-card)",
              }}
            >
              <p className="font-mono text-[0.66em] font-bold uppercase tracking-[0.24em] text-[color:var(--surface-muted)]">
                Two-bullet synthesis
              </p>
              <div className="mt-3 space-y-3">
                {synthesis.map((bullet, bulletIndex) => (
                  <div key={bulletIndex} className="flex gap-3">
                    <span
                      className="mt-[0.6em] h-[0.45em] w-[0.45em] shrink-0 rounded-full"
                      style={{ background: "var(--surface-accent)" }}
                    />
                    {editing ? (
                      <textarea
                        value={bullet}
                        onChange={(event) => {
                          const next = [...synthesis] as [string, string];
                          next[bulletIndex] = event.target.value;
                          updateEdit("synthesis", next);
                        }}
                        className="min-h-[3em] flex-1 resize-none rounded-md border bg-transparent px-2 py-1 text-[1em] leading-[1.6] outline-none"
                        style={{ borderColor: "var(--surface-hairline)" }}
                        aria-label={`Edit synthesis bullet ${bulletIndex + 1}`}
                      />
                    ) : (
                      <p className="flex-1 text-[1.02em] leading-[1.7] text-[color:var(--surface-body)]">
                        {bullet}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Argument */}
            <div className="mt-10">
              {editing ? (
                <textarea
                  value={argument}
                  onChange={(event) =>
                    updateEdit("reading", event.target.value)
                  }
                  className="min-h-[40vh] w-full resize-y rounded-lg border bg-transparent p-4 text-[1.08em] leading-[1.95] outline-none"
                  style={{ borderColor: "var(--surface-hairline)" }}
                  aria-label="Edit the argument"
                />
              ) : (
                <Typewriter
                  key={`${focusNode.id}-${prefs.typewriter}`}
                  text={argument}
                  active={prefs.typewriter}
                  className="font-serif text-[1.12em] leading-[1.95] tracking-[0.003em] text-[color:var(--surface-body)]"
                />
              )}
            </div>

            {editing ? (
              <button
                type="button"
                onClick={resetNode}
                className="mt-8 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[0.82em] font-semibold text-[color:var(--surface-muted)] transition-colors hover:text-[color:var(--surface-fg)]"
                style={{ borderColor: "var(--surface-hairline)" }}
              >
                <RotateCcw className="h-4 w-4" />
                Reset this idea to the original
              </button>
            ) : null}

            {/* Continue reading */}
            {focusNode.related.length > 0 ? (
              <div className="mt-12">
                <p className="font-mono text-[0.66em] font-bold uppercase tracking-[0.24em] text-[color:var(--surface-muted)]">
                  Continue
                </p>
                <div className="mt-3 grid gap-2">
                  {focusNode.related.map((relation) => {
                    const target = getDoctrineNode(relation.to);
                    if (!target) return null;
                    return (
                      <button
                        key={`${relation.to}-${relation.type}`}
                        type="button"
                        onClick={() => selectNode(relation.to)}
                        className="group flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition-colors hover:border-[color:var(--surface-accent)]"
                        style={{
                          borderColor: "var(--surface-hairline)",
                          background:
                            "color-mix(in oklch, var(--surface-fg) 3%, transparent)",
                        }}
                      >
                        <span className="text-[0.95em]">
                          <span className="text-[color:var(--surface-muted)]">
                            {relationLabel[relation.type] ?? relation.type}
                          </span>{" "}
                          <span className="font-semibold text-[color:var(--surface-fg)]">
                            {target.title}
                          </span>
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-[color:var(--surface-muted)] transition-colors group-hover:text-[color:var(--surface-accent)]" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Sequential reading flow */}
            <div
              className="mt-12 flex items-center justify-between gap-4 border-t pt-6 text-[0.8em]"
              style={{ borderColor: "var(--surface-hairline)" }}
            >
              {prevNode ? (
                <button
                  type="button"
                  onClick={() => selectNode(prevNode.id)}
                  className="group flex max-w-[45%] items-center gap-2 text-left text-[color:var(--surface-muted)] transition-colors hover:text-[color:var(--surface-fg)]"
                >
                  <ChevronLeft className="h-4 w-4 shrink-0" />
                  <span className="truncate">{prevNode.title}</span>
                </button>
              ) : (
                <span />
              )}
              <span className="shrink-0 font-mono text-[0.85em] uppercase tracking-[0.18em] text-[color:var(--surface-muted)]">
                v{focusNode.version} · {focusNode.status}
              </span>
              {nextNode ? (
                <button
                  type="button"
                  onClick={() => selectNode(nextNode.id)}
                  className="group flex max-w-[45%] items-center justify-end gap-2 text-right text-[color:var(--surface-muted)] transition-colors hover:text-[color:var(--surface-fg)]"
                >
                  <span className="truncate">{nextNode.title}</span>
                  <ChevronRight className="h-4 w-4 shrink-0" />
                </button>
              ) : (
                <span />
              )}
            </div>
          </motion.article>
        </AnimatePresence>
      </div>

      {/* Idea index overlay — discovery on demand, reading stays primary */}
      <AnimatePresence>
        {showIndex ? (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowIndex(false)}
              className="fixed inset-0 z-50 cursor-default"
              style={{
                background:
                  "color-mix(in oklch, var(--surface-bg) 60%, transparent)",
              }}
              aria-label="Close the idea index"
            />
            <motion.aside
              initial={
                prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 40 }
              }
              animate={{ opacity: 1, x: 0 }}
              exit={
                prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 40 }
              }
              transition={{ duration: 0.28 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-sm overflow-y-auto border-l p-6 backdrop-blur-2xl"
              style={{
                borderColor: "var(--surface-border)",
                background: "var(--surface-panel)",
                boxShadow: "var(--surface-shadow)",
              }}
            >
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[color:var(--surface-accent)]">
                  All ideas
                </p>
                <button
                  type="button"
                  onClick={() => setShowIndex(false)}
                  className={controlButton}
                  style={{ borderColor: "var(--surface-hairline)" }}
                  aria-label="Close the idea index"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 grid gap-1.5">
                {doctrineNodes.map((node) => {
                  const isCurrent = node.id === focusNode.id;
                  return (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => selectNode(node.id)}
                      className="rounded-lg border px-3 py-2.5 text-left transition-colors hover:border-[color:var(--surface-accent)]"
                      style={{
                        borderColor: isCurrent
                          ? "var(--surface-accent)"
                          : "var(--surface-hairline)",
                        background: isCurrent
                          ? "color-mix(in oklch, var(--surface-accent) 10%, transparent)"
                          : "transparent",
                      }}
                    >
                      <span className="block text-sm font-semibold text-[color:var(--surface-fg)]">
                        {node.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-[color:var(--surface-muted)]">
                        {node.kind}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      {/* Orchestrator presence + node-scoped tools (organism & activity aware) */}
      <OrchestratorNodeTools node={focusNode} scrollProgress={progress} />
    </div>
  );
};

export default DoctrinePage;
