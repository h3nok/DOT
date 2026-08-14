import { motion } from "framer-motion";
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
  return (
    <motion.section
      id="unlearning-experiment"
      aria-label="Love as an epistemic necessity"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      className="home-environment home-reflection-environment scroll-mt-24"
    >
      <div className="home-reflection-layout dot-page-container dot-page-wide">
        <div className="home-reflection-heading">
          <span className="dot-label">Begin with lived experience</span>
          <h2 className="dot-page-heading mt-4 text-balance">
            Love is an epistemic necessity.
          </h2>
          <p className="dot-caption mt-5 max-w-sm">
            The framework begins close to home: with the conditions under which
            a person can see clearly enough to revise a protected belief.
          </p>
          <Link
            to="/book/digital-organism-theory/preface"
            className="mt-7 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-[color:var(--organism-accent-strong)]"
          >
            Read the Preface
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <blockquote className="home-preface-copy">
          <LinkedStatement />
        </blockquote>
      </div>
    </motion.section>
  );
}

export default StepOneUnlearning;
