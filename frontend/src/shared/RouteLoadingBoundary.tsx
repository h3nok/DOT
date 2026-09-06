import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useOrganism, useOrganismFieldAnchor } from "../organism/OrganismContext";
import { FIELD_HANDOFF } from "../organism/fieldComposition";
import "./splash-emergence.css";

function LoadingSignal({ onLoading }: { onLoading: (loading: boolean) => void }) {
  useLayoutEffect(() => {
    onLoading(true);
    return () => onLoading(false);
  }, [onLoading]);
  return <div className="splash-emergence__placeholder" />;
}

/** The page is usable immediately; only the decorative dot finishes its handoff. */
function LoadingDot({ loading }: { loading: boolean }) {
  const { fieldAnchor, config, reducedMotion } = useOrganism();
  const registerAnchor = useOrganismFieldAnchor({ kind: "loading", coreRatio: 1 });
  const stage = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(loading);
  const setStage = useCallback((node: HTMLDivElement | null) => {
    stage.current = node;
    registerAnchor(loading ? node : null);
  }, [loading, registerAnchor]);

  useEffect(() => {
    if (loading) {
      setVisible(true);
      return;
    }
    const node = stage.current;
    if (!node || fieldAnchor?.element === node) return;
    if (reducedMotion || config.stillness || !config.enabled) {
      setVisible(false);
      return;
    }

    const bounds = fieldAnchor?.element.getBoundingClientRect();
    const dot = node.querySelector(".splash-emergence__dot")?.getBoundingClientRect();
    const origin = node.getBoundingClientRect();
    const dx = bounds ? bounds.left + bounds.width / 2 - origin.left - origin.width / 2 : 0;
    const dy = bounds ? bounds.top + bounds.height / 2 - origin.top - origin.height / 2 : 0;
    const scale = bounds && dot?.width
      ? Math.min(1, bounds.width * (fieldAnchor?.coreRatio ?? 1) / dot.width)
      : 1;
    const animation = node.animate(
      [
        { transform: "translate(0, 0) scale(1)", opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: 0 },
      ],
      {
        duration: bounds ? FIELD_HANDOFF.duration : 180,
        easing: FIELD_HANDOFF.easing,
        fill: "forwards",
      },
    );
    let cancelled = false;
    void animation.finished.then(
      () => { if (!cancelled) setVisible(false); },
      () => { /* Effect cleanup cancels an interrupted handoff. */ },
    );
    return () => {
      cancelled = true;
      animation.cancel();
    };
  }, [loading, fieldAnchor, reducedMotion, config.stillness, config.enabled]);

  if (!loading && !visible) return null;
  return (
    <div
      className="splash-emergence"
      role={loading ? "status" : undefined}
      aria-label={loading ? "Loading" : undefined}
      aria-hidden={!loading || undefined}
    >
      <div ref={setStage} className="splash-emergence__stage">
        <span className="splash-emergence__halo" />
        <span className="splash-emergence__ring" />
        <span className="splash-emergence__dot" />
      </div>
    </div>
  );
}

export function RouteLoadingBoundary({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(false);
  return (
    <>
      <Suspense fallback={<LoadingSignal onLoading={setLoading} />}>
        {children}
      </Suspense>
      <LoadingDot loading={loading} />
    </>
  );
}
