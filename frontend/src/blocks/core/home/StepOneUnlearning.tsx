import { useState, useEffect } from "react";
import { Eye, CheckCircle2, Pause, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const BODY_TEXT =
  "Our culture conditions us to react instantly—to skim, judge, and evaluate before we have truly observed. We do this to one another, reinforcing a shared loop of reactivity. Unlearning begins when you stop rushing. Notice the quiet impulse to move to the next thing, and allow yourself to stay still.";

const bodyTypewriterContainer = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.012,
      delayChildren: 0.15,
    },
  },
};

const bodyTypewriterChar = {
  hidden: { opacity: 0, y: 4 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] as const },
  },
};

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
      aria-label="Step 1: Unlearning Haste & Sustained Observation"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      className="relative mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-20 text-center sm:px-10 border-t border-border/40"
    >
      <div className="flex flex-col items-center justify-center gap-2">
        <div className="flex items-center justify-center gap-2">
          <span className="dot-label text-[color:var(--organism-accent-strong)]">
            Step 1 · Unlearning Haste
          </span>
        </div>
      </div>

      <h3 className="mt-4 text-balance font-serif text-3xl font-normal leading-tight text-foreground sm:text-4xl lg:text-5xl">
        Understanding takes time.
      </h3>

      <motion.p
        variants={bodyTypewriterContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="mt-6 max-w-3xl mx-auto text-balance text-base leading-relaxed text-foreground/85 sm:text-lg lg:text-xl font-normal tracking-normal"
      >
        {BODY_TEXT.split("").map((char, index) => (
          <motion.span key={`${char}-${index}`} variants={bodyTypewriterChar}>
            {char}
          </motion.span>
        ))}
      </motion.p>

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
            <span>Enter Sustained Stillness</span>
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
              className="w-full max-w-4xl rounded-2xl p-6 sm:p-8 border border-[color:var(--organism-accent-soft)] bg-foreground/[0.015] backdrop-blur-md"
            >
              <div className="flex flex-col items-center justify-center gap-4 text-center">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[color:var(--organism-accent-soft)] bg-[color:var(--organism-accent-soft)] text-[color:var(--organism-accent-strong)]">
                    <Pause className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="dot-label text-[color:var(--organism-accent-strong)]">
                      Resting in Stillness · {secondsElapsed}s elapsed
                    </p>
                    <p className="mt-1 text-sm text-foreground/90 font-medium">
                      Stay present. Notice how automatic reactions urge you to hurry.
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
                  <span>Conclude Observation</span>
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
              className="w-full max-w-4xl rounded-2xl p-6 sm:p-8 border border-[color:var(--organism-accent-soft)] bg-foreground/[0.015] backdrop-blur-md text-center"
            >
              <div className="flex items-center justify-center gap-2 text-foreground">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[color:var(--organism-accent-strong)]" />
                <span className="dot-label text-[color:var(--organism-accent-strong)]">
                  Stillness Held for {secondsElapsed} Seconds
                </span>
              </div>
              <p className="mt-3.5 text-balance text-base leading-relaxed text-foreground/90 sm:text-lg">
                <strong>The Realization:</strong> You just observed the gap between automatic impulse (the <em>Painting</em>) and deliberate action (the <em>Character</em>). <br />
                Truth cannot be rushed. You are not the habitual reaction; you are the quiet field of awareness holding it (the <em>Canvas</em>).
              </p>
              <button
                type="button"
                onClick={handleReset}
                className="mt-4 inline-flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Practice again</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}

export default StepOneUnlearning;
