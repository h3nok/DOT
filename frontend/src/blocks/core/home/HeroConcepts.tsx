import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

import { Editable, useSiteContent } from "../../../content/editable";

/**
 * The core vocabulary, arriving one term at a time and then stopping.
 *
 * Every line is the book's own wording, and every card carries the claim level
 * Book One assigns it — observation, model, or hypothesis. That is not
 * decoration: the preface says the distinction "governs the entire book", so a
 * surface that recited the vocabulary without it would misrepresent the work on
 * its own front page.
 *
 * The sequence **settles** on the last card and does not loop. A hero that
 * cycles forever is a small autoplay engine; this one finishes, which is the
 * same promise the book makes about itself. It also pauses on hover and focus,
 * because a line that moves while you are reading it is hostile.
 *
 * Screen readers get the whole list at once — a card rotating under a reader who
 * cannot see it rotate is noise — so the visual rotator is hidden from them.
 */

type ClaimLevel = "observation" | "model" | "hypothesis";

interface Concept {
  id: string;
  term: string;
  text: string;
  level: ClaimLevel;
}

export const HERO_CONCEPTS: ReadonlyArray<Concept> = [
  {
    id: "home.concept.organism",
    term: "The Digital Organism",
    text: "A state-bearing, information-sensitive process that works to preserve or develop its coherence across change.",
    level: "model",
  },
  {
    id: "home.concept.feeling",
    term: "The Subjective Data Principle",
    text: "Feeling must be treated as data, but feeling is not automatically truth.",
    level: "observation",
  },
  {
    id: "home.concept.layers",
    term: "Canvas · Painting · Character",
    text: "The Canvas carries. The Painting interprets. Character acts.",
    level: "model",
  },
  {
    id: "home.concept.rest",
    term: "The First Painting",
    text: "You were shaped by your environment, yet you must choose within your available decision space.",
    level: "observation",
  },
  {
    id: "home.concept.fear",
    term: "Fear",
    text: "The governing contraction that organizes perception around defense, control, and the preservation of identity at the expense of truth.",
    level: "model",
  },
  {
    id: "home.concept.love",
    term: "Love",
    text: "The condition in which Fear no longer governs you. Not a mood added to the loop — the operating condition that makes inquiry harder to corrupt.",
    level: "model",
  },
  {
    id: "home.concept.intent",
    term: "Intent",
    text: "The directional organization of Little c before action. Clarity matters without requiring magic.",
    level: "model",
  },
  {
    id: "home.concept.frame",
    term: "Reality Frame",
    text: "A rule-bound environment in which action meets consequence. Consequence is what gives experience weight.",
    level: "model",
  },
  {
    id: "home.concept.bigc",
    term: "Big C and Little c",
    text: "Life as a fundamental, self-preserving process, differentiated into local centres of experience. Held as hypothesis, not finding.",
    level: "hypothesis",
  },
  {
    id: "home.concept.lok",
    term: "The Limit of Knowledge",
    text: "A restraint on certainty — not permission to fill the unknown with whatever story we prefer.",
    level: "model",
  },
];

const LEVEL_LABEL: Record<ClaimLevel, string> = {
  observation: "Observation",
  model: "Model",
  hypothesis: "Hypothesis",
};

export const DWELL_MS = 6000;

function LevelBadge({ level, index, total }: { level: ClaimLevel; index?: number; total?: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {typeof index === "number" && typeof total === "number" && (
        <span className="dot-label text-muted-foreground/70">
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
      )}
      <span
        className="dot-chip"
        title="Book One marks every claim as observation, model, hypothesis, or speculation."
      >
        {LEVEL_LABEL[level]}
      </span>
    </div>
  );
}

/**
 * @param autoAdvance Whether the sequence may move on its own. This is a motion
 * decision only. It must never be tied to "the emergence already played in this
 * tab" — that flag once reached this component and froze the slideshow on its
 * final card for every reload, so a returning reader met the most abstract idea
 * in the book ("a restraint on certainty…") and nothing else.
 */
export function HeroConcepts({ autoAdvance = true }: { autoAdvance?: boolean }) {
  const { resolve, editMode } = useSiteContent();
  const last = HERO_CONCEPTS.length - 1;
  // Always opens on the first card. A reader who cannot see it move should get
  // the start of the argument, not wherever the sequence would have ended.
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!autoAdvance || paused || index >= last) return; // Still, reading, or arrived.

    const timer = window.setTimeout(() => setIndex((i) => i + 1), DWELL_MS);
    return () => window.clearTimeout(timer);
  }, [index, last, autoAdvance, paused]);

  // While the steward is writing, every line is visible and addressable at once.
  if (editMode) {
    return (
      <ul className="space-y-6 text-center">
        {HERO_CONCEPTS.map((concept) => (
          <li key={concept.id}>
            <LevelBadge level={concept.level} />
            <span className="mt-2 block font-serif text-2xl font-semibold leading-tight text-foreground">
              {concept.term}
            </span>
            <Editable
              id={concept.id}
              as="span"
              multiline
              text={concept.text}
              className="mt-1 block text-balance text-base leading-relaxed text-foreground/75"
            />
          </li>
        ))}
      </ul>
    );
  }

  const current = HERO_CONCEPTS[index];

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="rounded-2xl border border-border/40 bg-foreground/[0.015] p-6 text-center backdrop-blur-sm"
    >
      <ul className="sr-only">
        {HERO_CONCEPTS.map((concept) => (
          <li key={concept.id}>
            {concept.term} ({LEVEL_LABEL[concept.level]}):{" "}
            {resolve(concept.id, concept.text)}
          </li>
        ))}
      </ul>

      <div aria-hidden="true" className="relative min-h-[14rem] sm:min-h-[12rem]">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={autoAdvance ? { opacity: 0, y: 8 } : false}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute inset-x-0 top-0 flex flex-col items-center justify-center text-center gap-2.5"
          >
            <LevelBadge level={current.level} index={index} total={HERO_CONCEPTS.length} />
            <span className="block font-serif text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
              {current.term}
            </span>
            <span className="block max-w-xl text-balance text-base leading-relaxed text-foreground/75 sm:text-lg mx-auto">
              {resolve(current.id, current.text)}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Position, and a way to step through it. Finite by design: the last dot
          is the end, not a wrap point. */}
      <ol className="mt-4 flex items-center justify-center gap-1.5">
        {HERO_CONCEPTS.map((concept, i) => (
          <li key={concept.id}>
            <button
              type="button"
              onClick={() => setIndex(i)}
              aria-label={concept.term}
              aria-current={i === index}
              className={`block h-1.5 rounded-full transition-all ${
                i === index
                  ? "w-5 bg-[color:var(--organism-accent-strong)]"
                  : "w-1.5 bg-border hover:bg-muted-foreground"
              }`}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}

export default HeroConcepts;
