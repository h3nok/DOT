import { ArrowRight, ShieldAlert } from "lucide-react";

import { Editable } from "../../../content/editable";
import type { AgentLens } from "../../../dot/agent";

/**
 * What the practice actually is, rather than five tidy steps.
 *
 * An earlier version of this section read as a productivity method: a clean
 * loop, three exercises, done. That misrepresents the work. In DOT the practice
 * is entropy reduction — lowering the internal cost of fragmentation — and in a
 * person that means meeting fear, unlearning inherited pattern, and giving up a
 * self-image being defended. Ego and arrogance are what that defence looks like
 * from outside.
 *
 * Two things are therefore stated plainly here and must survive any edit:
 *
 * - **It is hard, and it may not arrive.** Lowering entropy far enough to widen
 *   a capacity for Love can be the work of a life. A page that implies otherwise
 *   is selling something.
 * - **The author's standing is his own struggle, not expertise.** He reached
 *   this by intuition and built the framework afterwards. Any sensitivity here
 *   comes from how it felt to build it, not from having finished.
 *
 * `entropy` is used exactly as Book One uses it — "the internal cost of
 * fragmentation" — and the book is explicit that it is not thermodynamic and
 * "should not borrow the authority of physics". Neither should this page.
 */

/** One pass of the loop, as the book states it. */
const LOOP = [
  { step: "Notice", body: "A pattern becomes visible while it is still running." },
  { step: "Predict", body: "Name what the pattern expects to happen." },
  { step: "Test", body: "Carefully, and at a size you can afford." },
  { step: "Receive", body: "Let the consequence be information, not verdict." },
  { step: "Update", body: "Let the Canvas carry forward what actually changed." },
] as const;

/** Openings small enough to actually begin, not the whole of the work. */
const EXERCISES: ReadonlyArray<{
  id: string;
  title: string;
  text: string;
  prompt: string;
  lens: AgentLens;
}> = [
  {
    id: "practice.pause",
    title: "The pause before the answer",
    text: "Pause before answering a difficult question, and another sentence may become available. The interval is the whole exercise — awareness noticing a proposed response without becoming identical to it.",
    prompt:
      "I want to practise pausing before I answer difficult questions. Walk me through what DOT says is happening in that interval, and how to try it today.",
    lens: "ground",
  },
  {
    id: "practice.pull",
    title: "The pull you do not obey",
    text: "Notice the pull to check the phone, and allow it to pass without obeying it. Not as discipline or self-denial — as evidence that a proposed action can be observed rather than executed.",
    prompt:
      "Help me practise noticing an urge without acting on it, the way Book One describes. What am I actually looking for, and what counts as a result?",
    lens: "ground",
  },
  {
    id: "practice.stroke",
    title: "One stroke, made visible",
    text: "Choose one inherited reaction you can already half-see. Name what it predicts. Test that prediction once, carefully. Responsibility begins with visibility, not with resolve.",
    prompt:
      "I want to examine one inherited pattern using DOT's repainting loop: notice, predict, test, receive, update. Help me pick something small enough to test safely.",
    lens: "ground",
  },
];

interface HomePracticeProps {
  onStart: (request: { query: string; lens: AgentLens }) => void;
}

export function HomePractice({ onStart }: HomePracticeProps) {
  return (
    <section
      id="practice"
      aria-labelledby="practice-title"
      className="scroll-mt-8 border-y border-border/50 bg-[color:var(--organism-accent-soft)]/[0.06] py-24"
    >
      <div className="mx-auto w-full max-w-3xl px-6 sm:px-10">
        <p className="dot-label text-center text-[color:var(--organism-accent-strong)]">
          The practice
        </p>
        <h2
          id="practice-title"
          className="mt-5 text-balance text-center font-serif text-3xl font-semibold leading-tight sm:text-4xl"
        >
          The work is lowering your own entropy. In a person, that means fear.
        </h2>

        <Editable
          id="practice.entropy"
          as="p"
          multiline
          text="Entropy here is the internal cost of fragmentation — not the physicist's entropy, and it must not borrow the authority of physics. It means contradictory policies competing for control, unresolved fear capturing attention, habitual responses that no longer fit the present, divided Intent. From the inside it is felt as tension, overthinking, hesitation, urgency, exhaustion, mental noise. As that fragmentation falls, Intent becomes steadier and more of the moment becomes available. That is the whole of it."
          className="mt-7 block text-balance text-center text-base leading-relaxed text-foreground/75"
        />

        <Editable
          id="practice.cost"
          as="p"
          multiline
          text="Which is why this is not technique. It is unlearning — setting down an inherited pattern you have been defending as yourself. The trap was never that inheritance is false; it is the inability to tell what was inherited from what is true. Ego and arrogance are what that defence looks like from the outside, and both are, at bottom, an unwillingness to keep learning."
          className="mt-6 block text-balance text-center text-base leading-relaxed text-foreground/75"
        />

        {/* Said plainly. A page that implies this is quick is selling something. */}
        <Editable
          id="practice.difficulty"
          as="p"
          multiline
          text="It is genuinely difficult, and it is slow. Lowering entropy far enough to widen your capacity for Love may be the work of a life, and there is no version of it that runs on willpower or arrives on a schedule. Nothing here promises you will get there. What can be said is that the direction is inspectable from where you already are, and that you do not have to accept any of the cosmology to begin."
          className="mt-6 block text-balance text-center font-serif text-lg italic leading-relaxed text-foreground/80"
        />

        <h3 className="dot-label mt-16 text-center text-foreground/60">
          The shape of one pass
        </h3>
        <ol className="mt-6 grid gap-px overflow-hidden rounded-xl border border-border/60 bg-border/60 sm:grid-cols-5">
          {LOOP.map((item, index) => (
            <li key={item.step} className="bg-background p-4">
              <span
                aria-hidden="true"
                className="font-mono text-[12px] font-semibold text-[color:var(--organism-accent-strong)]"
              >
                0{index + 1}
              </span>
              <h4 className="mt-1.5 font-serif text-base font-semibold text-foreground">
                {item.step}
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-foreground/70">{item.body}</p>
            </li>
          ))}
        </ol>

        <h3 className="dot-label mt-14 text-center text-foreground/60">
          Small enough to actually begin
        </h3>

        <ul className="mt-6 space-y-4">
          {EXERCISES.map((exercise) => (
            <li
              key={exercise.id}
              className="rounded-xl border border-border/60 bg-background/70 p-5 backdrop-blur-sm"
            >
              <h4 className="font-serif text-lg font-semibold text-foreground">
                {exercise.title}
              </h4>
              <Editable
                id={exercise.id}
                as="p"
                multiline
                text={exercise.text}
                className="mt-2 block text-sm leading-relaxed text-foreground/75"
              />
              <button
                type="button"
                onClick={() => onStart({ query: exercise.prompt, lens: exercise.lens })}
                className="group mt-4 inline-flex items-center gap-2 rounded-lg border border-border/70 px-3.5 py-2 text-xs font-medium text-foreground transition-colors hover:border-[color:var(--organism-accent-soft)] hover:bg-[color:var(--organism-accent-soft)]/20"
              >
                Walk me through this
                <ArrowRight
                  className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </button>
            </li>
          ))}
        </ul>

        {/* Where the author is standing, so nobody mistakes this for instruction
            from someone on the far side of it. */}
        <Editable
          id="practice.standing"
          as="p"
          multiline
          text="I did not arrive here by method. An intuitive drive brought me, and the framework came afterwards as an attempt to say what I had been doing. Whatever care is in this page comes from how it felt to build it — the fear I had to face to keep going, and how often I got it wrong — not from having finished."
          className="mt-12 block border-l-2 border-[color:var(--organism-accent-strong)] pl-5 font-serif text-[15px] italic leading-relaxed text-foreground/75"
        />

        {/* Not optional. The chapter that gives the practice gives this too. */}
        <div className="mt-8 flex gap-3.5 rounded-xl border border-border/60 p-5">
          <ShieldAlert
            className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <Editable
            id="practice.safety"
            as="p"
            multiline
            text="Some patterns can be tested through ordinary practice. Others formed through trauma, violence, deprivation, or prolonged instability, and should not be confronted recklessly. Safety and gradual exposure may be part of the work, and that work may need therapy, honest relationship, material repair, a different environment, or professional care. None of it works by magic, and no single method fits every life. Courage is not the performance of danger. It is the recovery of choice."
            className="block text-sm leading-relaxed text-foreground/70"
          />
        </div>
      </div>
    </section>
  );
}

export default HomePractice;
