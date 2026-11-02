import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

/** One nine-second explanation, then a held frame. Only visible artwork gets a clock. */
export function useIllustrationPlayback() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.35 });
  const reduced = useReducedMotion();
  const [siteStill, setSiteStill] = useState(() => typeof document !== "undefined" && document.documentElement.dataset.motion === "still");
  const [hidden, setHidden] = useState(() => typeof document !== "undefined" && document.hidden);
  const [paused, setPaused] = useState(false);
  const [time, setTime] = useState(0);
  const clock = useRef(0);
  const complete = time >= 14;
  const still = Boolean(reduced || siteStill);

  useEffect(() => {
    const observer = new MutationObserver(() => setSiteStill(document.documentElement.dataset.motion === "still"));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] });
    const visibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", visibility);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", visibility); };
  }, []);

  useEffect(() => {
    if (!inView || still || hidden || paused || complete) return;
    let frame = 0;
    let previous: number | undefined;
    let painted = 0;
    const tick = (now: number) => {
      if (previous !== undefined) clock.current = Math.min(14, clock.current + (now - previous) * 14 / 9000);
      previous = now;
      if (now - painted >= 1000 / 24 || clock.current >= 14) {
        setTime(clock.current);
        painted = now;
      }
      if (clock.current < 14) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, still, hidden, paused, complete]);

  const toggle = () => {
    if (complete) { clock.current = 0; setTime(0); setPaused(false); }
    else setPaused(value => !value);
  };

  return {
    ref, time: still ? 14 : time, still, toggle,
    state: still ? "still" : complete ? "complete" : paused ? "paused" : inView && !hidden ? "playing" : "waiting",
    action: complete ? "Replay illustration" : paused ? "Resume illustration" : "Pause illustration",
  };
}
