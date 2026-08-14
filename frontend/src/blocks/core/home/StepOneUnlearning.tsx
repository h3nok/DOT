import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";

const PLAIN_TEXT =
  "Love is the absence of Fear. In DOT, Fear names the governing contraction that organizes perception around defense, control, and the preservation of identity at the expense of truth. Inquiry conducted under that governance is structurally corrupted — you see what you need to be there, not what is there. Love is the condition in which that governance lifts. It does not make inquiry soft. It makes inquiry harder to corrupt. In this sense, Love is not only a moral aspiration. It is an epistemic necessity.";

const TERM_STYLE =
  "underline decoration-[color:var(--organism-accent-soft)] decoration-1 underline-offset-[3px] transition-colors hover:text-[color:var(--organism-accent-strong)] hover:decoration-[color:var(--organism-accent-strong)]";

type Segment = { text: string; link?: string };

const SEGMENTS: Segment[] = [
  { text: "Love", link: "/doctrine/love" },
  { text: " is the absence of " },
  { text: "Fear", link: "/doctrine/fear-gating" },
  { text: ". In DOT, " },
  { text: "Fear", link: "/doctrine/fear-gating" },
  { text: " names the governing contraction that organizes perception around defense, control, and the preservation of identity at the expense of truth. Inquiry conducted under that governance is structurally corrupted — you see what you need to be there, not what is there. " },
  { text: "Love", link: "/doctrine/love" },
  { text: " is the condition in which that governance lifts. It does not make inquiry soft. It makes inquiry harder to corrupt. In this sense, " },
  { text: "Love", link: "/doctrine/love" },
  { text: " is not only a moral aspiration. It is an epistemic necessity." },
];

function TypewriterBody() {
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [charCount, setCharCount] = useState(0);

  const totalChars = SEGMENTS.reduce((sum, s) => sum + s.text.length, 0);

  useEffect(() => {
    if (!inView || charCount >= totalChars) return;
    const id = window.setTimeout(() => setCharCount((c) => c + 1), 6);
    return () => window.clearTimeout(id);
  }, [inView, charCount, totalChars]);

  let rendered = 0;
  return (
    <p ref={ref} className="dot-lede mx-auto mt-6 max-w-3xl text-balance" aria-label={PLAIN_TEXT}>
      {SEGMENTS.map((seg, i) => {
        const start = rendered;
        rendered += seg.text.length;
        const visible = Math.max(0, Math.min(seg.text.length, charCount - start));
        const content = (
          <>
            <span>{seg.text.slice(0, visible)}</span>
            {visible < seg.text.length && (
              <span className="invisible">{seg.text.slice(visible)}</span>
            )}
          </>
        );
        return seg.link ? (
          <Link key={i} to={seg.link} className={TERM_STYLE}>{content}</Link>
        ) : (
          <span key={i}>{content}</span>
        );
      })}
    </p>
  );
}

export function StepOneUnlearning() {
  return (
    <motion.section
      id="unlearning-experiment"
      aria-label="Love as an epistemic necessity"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      className="relative scroll-mt-24 border-t border-border/40 py-20 dot-page-container"
    >
      <div className="dot-surface mx-auto max-w-3xl rounded-2xl border border-border/30 bg-foreground/[0.02] p-8 text-center backdrop-blur-sm sm:p-10">
        <span className="dot-label">From the preface</span>

        <h2 className="dot-page-heading mt-4 text-balance">
          Love is an epistemic necessity.
        </h2>

        <TypewriterBody />
      </div>
    </motion.section>
  );
}

export default StepOneUnlearning;
