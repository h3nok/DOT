import { useState, useEffect } from "react";
import { Eye, CheckCircle2, Pause, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const BODY_TEXT =
  "Before you could examine the world, other people and environments taught you what to notice, fear, trust, and protect. DOT calls this inherited interpretation the Painting. The first practice is not to erase it. It is to slow down long enough to see it operating.";

export function StepOneUnlearning() {
  const [isObserving, setIsObserving] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [observed, setObserved] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isObserving) {
      timer = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isObserving]);

  const handleStartObservation = () => {
    setSecondsElapsed(0);
    setIsObserving(true);
    setObserved(false);
  };

  const handleCompleteObservation = () => {
    setIsObserving(false);
    setObserved(true);
  };

  const handleReset = () => {
    setIsObserving(false);
    setObserved(false);
    setSecondsElapsed(0);
  };

  return (
    <motion.section
      id="unlearning-experiment"
      aria-label="A first experiment in noticing conditioning"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      className="relative mx-auto w-full scroll-mt-24 py-16 text-center dot-page-container border-t border-border/40"
    >
      <span className="dot-label">A first experiment</span>

      <h2 className="dot-page-heading mt-4 text-balance">
        Notice what arrives before choice.
      </h2>

      <p className="dot-lede mx-auto mt-6 max-w-2xl text-balance">{BODY_TEXT}</p>

      <div className="mt-10 flex flex-col items-center justify-center gap-4 w-full">
        {!isObserving && !observed && (
          <motion.button
            type="button"
            onClick={handleStartObservation}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2.5 rounded-xl border border-[color:var(--organism-accent-soft)] bg-foreground/[0.025] px-6 py-3.5 text-sm font-semibold text-foreground backdrop-blur-md transition-all hover:border-[color:var(--organism-accent-strong)]/40 hover:bg-foreground/[0.05]"
          >
            <Eye className="h-4 w-4 text-[color:var(--organism-accent-strong)]" />
            <span>Observe for one minute</span>
          </motion.button>
        )}

        <AnimatePresence mode="wait">
          {isObserving && (
            <motion.div
              key="observing-box"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-3xl rounded-lg border border-[color:var(--organism-accent-soft)] bg-foreground/[0.015] p-6 sm:p-8"
            >
              <div className="flex flex-col items-center justify-center gap-4 text-center">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[color:var(--organism-accent-soft)] bg-[color:var(--organism-accent-soft)] text-[color:var(--organism-accent-strong)]">
                    <Pause className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="dot-label text-[color:var(--organism-accent-strong)]">
                      Still · {secondsElapsed}s
                    </p>
                    <p className="mt-1 text-sm text-foreground/90 font-medium">
                      Notice the pull toward the next thing. Let it pass without following it.
                    </p>
                  </div>
                </div>

                <motion.button
                  type="button"
                  onClick={handleCompleteObservation}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--organism-accent-strong)] px-5 py-2.5 text-xs font-semibold text-background transition-transform"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Stop here</span>
                </motion.button>
              </div>
            </motion.div>
          )}

          {observed && (
            <motion.div
              key="observed-box"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-3xl rounded-lg border border-[color:var(--organism-accent-soft)] bg-foreground/[0.015] p-6 text-center sm:p-8"
            >
              <div className="flex items-center justify-center gap-2 text-foreground">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[color:var(--organism-accent-strong)]" />
                <span className="dot-label text-[color:var(--organism-accent-strong)]">
                  You stayed with it · {secondsElapsed}s
                </span>
              </div>
              {/* States what the terms are — a model, not a finding — because
                  the rest of the site marks every claim that way and a moment
                  of felt insight is the easiest place to quietly stop doing it. */}
              <p className="dot-lede mx-auto mt-4 max-w-xl text-balance">
                What showed up before you chose it? A judgment, urge, memory,
                tension, or story is enough. DOT calls that inherited
                interpretation the <em>Painting</em>; the response you take
                becomes <em>Character</em>.
              </p>
              <p className="dot-caption mx-auto mt-3 max-w-xl text-balance">
                Those are names in a model, not findings. The exercise only asks
                whether you can notice the gap in your own experience.
              </p>
              <button
                type="button"
                onClick={handleReset}
                className="mt-4 inline-flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Again</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}

export default StepOneUnlearning;
