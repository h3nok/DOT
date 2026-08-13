import { useEffect, useMemo, useRef, useState } from "react";
import { crownSlots, orderedRadialSlots } from "../attention-os/focus/radialOrder";

export interface GraphLayout {
  stageRef: React.RefObject<HTMLDivElement | null>;
  size: { w: number; h: number };
  cx: number;
  cy: number;
  compact: boolean;
  positions: { x: number; y: number }[];
}

export function useGraphLayout(
  slotCount: number,
  crowned: boolean,
  editing: boolean,
): GraphLayout {
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

  const slots = useMemo(
    () => (crowned ? crownSlots(slotCount) : orderedRadialSlots(slotCount)),
    [crowned, slotCount],
  );

  const cx = size.w / 2;
  const topReserve = 72;
  const chatReserve = editing ? 24 : 168;
  const usableH = Math.max(0, size.h - topReserve - chatReserve);
  const cy = topReserve + usableH / 2;
  const compact = size.w < 640;

  const cardHalfWidth = Math.min(size.w * 0.21, 104);
  const edgeMargin = compact ? 8 : 16;
  const widestSlotReach = Math.max(...slots.map((s) => Math.abs(s.ux)), 0.001);
  const horizontalLimit = Math.max(
    72,
    (size.w / 2 - cardHalfWidth - edgeMargin) / widestSlotReach,
  );
  const proportionalRadius = Math.min(size.w, usableH) * 0.4;
  const horizontalRadius = Math.min(330, horizontalLimit, proportionalRadius);
  const verticalRadius = compact
    ? Math.min(248, usableH * 0.42)
    : horizontalRadius;

  const positions = slots.map((s) => ({
    x: cx + s.ux * horizontalRadius,
    y: cy + s.uy * verticalRadius,
  }));

  return { stageRef, size, cx, cy, compact, positions };
}
