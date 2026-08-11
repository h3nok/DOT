import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { bloomFromOrigin, EASE_BREATHE, staggerContainer } from "../organism";

/**
 * BloomSurface — the one shell every focused surface uses.
 *
 * In DOT there are only two kinds of screen: the graph, and a content surface
 * that *blooms from the centre of the graph*. This is that bloom: a scrim,
 * membrane rings radiating from the nucleus like a cell dividing, and a card
 * that grows from the centre. Reading, authoring, sign-in, invitation — every
 * focused interaction wears this exact shell, so there is never a second UI
 * language. Compose content as children; optional footer for actions.
 */

interface BloomSurfaceProps {
  /** Mono kicker above the title (e.g. "sign in", "invite", the node kind). */
  kicker: string;
  title: string;
  description?: string;
  /** Screen-space nucleus centre, so the bloom originates there. */
  origin?: { x: number; y: number };
  reducedMotion?: boolean;
  zIndex?: number;
  /** Max width of the card. */
  size?: "sm" | "md" | "lg";
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const WIDTHS = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-xl" } as const;

export const BloomSurface: React.FC<BloomSurfaceProps> = ({
  kicker,
  title,
  description,
  origin,
  reducedMotion = false,
  zIndex = 40,
  size = "md",
  onClose,
  children,
  footer,
}) => {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [onClose]);

  const motionSafe = !reducedMotion;
  const viewportCenter = {
    x: typeof window !== "undefined" ? window.innerWidth / 2 : 0,
    y: typeof window !== "undefined" ? window.innerHeight / 2 : 0,
  };
  const from = origin ?? viewportCenter;
  const bloom = bloomFromOrigin(origin, reducedMotion);

  // Scroll shadows: a quiet affordance that the body continues above/below.
  const bodyRef = useRef<HTMLDivElement>(null);
  const [scrollEdge, setScrollEdge] = useState({ top: false, bottom: false });
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const update = () => {
      setScrollEdge({
        top: el.scrollTop > 4,
        bottom: el.scrollTop + el.clientHeight < el.scrollHeight - 4,
      });
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    // ResizeObserver may be absent (jsdom, older engines) or stubbed as a
    // non-constructable mock in tests; the scroll listener alone still keeps the
    // shadows honest. Treat it as a best-effort enhancement, never a hard dep.
    let observer: ResizeObserver | null = null;
    try {
      if (typeof ResizeObserver === "function") {
        observer = new ResizeObserver(update);
        observer.observe(el);
      }
    } catch {
      observer = null;
    }
    return () => {
      el.removeEventListener("scroll", update);
      observer?.disconnect();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center px-4"
      style={{ zIndex }}
    >
      {/* Scrim — closing collapses the bloom. */}
      <motion.button
        type="button"
        aria-label="Close"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-background/55 backdrop-blur-sm"
      />

      {/* Membrane rings radiating from the nucleus as the surface blooms. */}
      {motionSafe && (
        <div
          className="pointer-events-none absolute"
          style={{ left: from.x, top: from.y }}
          aria-hidden="true"
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="absolute rounded-full border"
              style={{
                borderColor: "var(--organism-accent-soft)",
                translateX: "-50%",
                translateY: "-50%",
              }}
              initial={{ width: 24, height: 24, opacity: 0.5 }}
              animate={{
                width: 520 + i * 120,
                height: 520 + i * 120,
                opacity: 0,
              }}
              transition={{
                duration: 1.1 + i * 0.25,
                ease: EASE_BREATHE,
                delay: i * 0.08,
              }}
            />
          ))}
        </div>
      )}

      {/* The card, blooming from the nucleus to the centre. */}
      <motion.section
        role="dialog"
        aria-label={title}
        initial={bloom.initial}
        animate={bloom.animate}
        exit={bloom.exit}
        transition={bloom.transition}
        className={`organism-alive relative z-10 flex max-h-[82vh] w-full ${WIDTHS[size]} flex-col overflow-hidden rounded-3xl border border-white/10 dark:border-white/5 bg-background/20 shadow-[var(--premium-shadow),0_0_80px_var(--organism-accent-soft)] backdrop-blur-3xl`}
        style={{ transformOrigin: "center center" }}
      >
        {/* Living top edge. */}
        <span
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(to right, transparent, var(--organism-accent), transparent)",
          }}
          aria-hidden="true"
        />

        <header className="flex items-start justify-between gap-4 px-7 pt-7 sm:px-8 sm:pt-8">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <span
                className="organism-pulse-dot inline-flex h-2.5 w-2.5 rounded-full"
                style={{ background: "var(--organism-accent-strong)" }}
              />
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                {kicker}
              </span>
            </div>
            <h2 className="font-serif text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
              {title}
            </h2>
            {description && (
              <p className="mt-2 text-sm italic leading-relaxed text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-full border border-border/50 p-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="relative mt-6 min-h-0 flex-1">
          {/* Top scroll shadow — appears once the body is scrolled. */}
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-6 bg-gradient-to-b from-background/70 to-transparent transition-opacity duration-300 ${
              scrollEdge.top ? "opacity-100" : "opacity-0"
            }`}
          />
          <motion.div
            ref={bodyRef}
            className="h-full min-h-0 overflow-y-auto px-7 pb-7 sm:px-8 sm:pb-8"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            custom={reducedMotion}
          >
            {children}
          </motion.div>
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 h-6 bg-gradient-to-t from-background/70 to-transparent transition-opacity duration-300 ${
              scrollEdge.bottom ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>

        {footer && (
          <footer className="border-t border-border/50 px-7 py-5 sm:px-8">
            {footer}
          </footer>
        )}
      </motion.section>
    </div>
  );
};

export default BloomSurface;
