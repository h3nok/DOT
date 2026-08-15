import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
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

function LinkedStatement() {
  return (
    <p className="home-preface-statement" aria-label={PLAIN_TEXT}>
      {SEGMENTS.map((seg, i) => {
        return seg.link ? (
          <Link key={i} to={seg.link} className={TERM_STYLE}>
            {seg.text}
          </Link>
        ) : (
          <span key={i}>{seg.text}</span>
        );
      })}
    </p>
  );
}

export function StepOneUnlearning() {
  const reducedMotion = useReducedMotion();
  const [titleEntered, setTitleEntered] = useState(false);
  const revealTitle = Boolean(reducedMotion) || titleEntered;

  return (
    <motion.section
      id="unlearning-experiment"
      aria-label="Love as an epistemic necessity"
      initial={reducedMotion ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: reducedMotion ? 0 : 0.5 }}
      onViewportEnter={() => setTitleEntered(true)}
      className="home-environment home-reflection-environment scroll-mt-24"
    >
      <div className="home-reflection-layout dot-page-container dot-page-wide">
        <div className="home-reflection-heading">
          <span className="dot-label">Begin with lived experience</span>
          <h2 className="home-love-heading dot-page-heading mt-4">
            <span className="sr-only">Love is an epistemic necessity.</span>
            <span
              className="home-love-typewriter"
              data-active={revealTitle ? "true" : "false"}
              aria-hidden="true"
            >
              <span className="home-love-typewriter-line home-love-typewriter-line--one">
                Love is an
              </span>
              <span className="home-love-typewriter-line home-love-typewriter-line--two">
                epistemic necessity.
              </span>
              <span className="home-love-typewriter-cursor" />
            </span>
          </h2>
          <p className="dot-caption mt-5 max-w-sm">
            Clear inquiry begins when Fear no longer governs what perception is
            permitted to see.
          </p>
          <Link
            to="/book/digital-organism-theory/preface"
            className="home-preface-link group mt-7 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-foreground"
          >
            Read the Preface
            <ArrowRight
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>

        <motion.blockquote
          className="home-preface-copy"
          initial={reducedMotion ? false : { opacity: 0, x: 18, scale: 0.99 }}
          whileInView={{ opacity: 1, x: 0, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: reducedMotion ? 0 : 0.55, delay: reducedMotion ? 0 : 0.18 }}
        >
          <LinkedStatement />
        </motion.blockquote>
      </div>
    </motion.section>
  );
}

export default StepOneUnlearning;
