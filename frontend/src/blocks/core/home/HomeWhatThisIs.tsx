import { Editable } from "../../../content/editable";

/**
 * What this is, said before how it was built.
 *
 * ADR-0022 retired the word "movement" from the front door, because announcing
 * one before a reader has met the work claims what the work has not earned.
 * That reasoning still holds and this section keeps it: the aim is stated as an
 * aim, the status is left to be earned, and the closing line says outright that
 * a movement would be a consequence of usefulness rather than a launch.
 *
 * What changes is that the page now says what kind of thing it is at all. The
 * preface's actual project is a reunion — it refuses to treat first-person
 * experience as noise, *and* refuses to let feeling overrule rigour — and
 * "Love is an epistemic necessity" is the hinge between the two halves. A front
 * door that never names that leaves the reader to guess whether this is
 * philosophy, faith, or self-help.
 *
 * The "no exemptions" facet is what keeps this from reading as sectarian, and
 * it is the book's own sentence: the standard applies to religious believers,
 * materialists, mystics, ideologues, institutions, families, and to the author.
 */

const FACETS = [
  {
    id: "what.model",
    title: "A model of reality",
    text: "Consciousness treated as the phenomenon to be explained rather than the inconvenience to be explained away. A fundamental, self-preserving process; rule-bound environments where action meets consequence; and a Canvas that carries all of it forward. Offered as a construction, with every claim marked for what it is.",
  },
  {
    id: "what.practice",
    title: "A practice, not a belief",
    text: "Nothing asks you to accept the cosmology before inspecting your own experience. The framework is meant to be entered at whichever level you can actually use, and judged by whether it helps you see more clearly and widens what you are able to choose.",
  },
  {
    id: "what.exemptions",
    title: "No worldview gets an exemption",
    text: "The same standard applies to religious believers, materialists, mystics, political ideologues, institutions, families — and to me. A theory becomes pseudoscience wherever its claims outrun what its methods can honestly examine, and that includes this one.",
  },
] as const;

export function HomeWhatThisIs() {
  return (
    <section
      id="what-this-is"
      aria-labelledby="what-this-is-title"
      className="mx-auto w-full max-w-5xl scroll-mt-8 px-6 py-24 sm:px-10"
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className="dot-label text-[color:var(--organism-accent-strong)]">
          What this is
        </p>
        <h2
          id="what-this-is-title"
          className="mt-5 text-balance font-serif text-3xl font-semibold leading-tight text-foreground sm:text-4xl"
        >
          A model of reality — and an attempt to put two things back together.
        </h2>
        <Editable
          id="what.split"
          as="p"
          multiline
          text="Somewhere along the way, inner life and serious thinking were handed to different people. Spirituality kept the questions that matter most and gave up the discipline to test them. Rigour kept the discipline and ruled the questions unserious. Most of us were quietly asked to pick a side, and to leave half of ourselves with the other one."
          className="mt-7 block text-balance text-base leading-relaxed text-foreground/75"
        />
        <Editable
          id="what.refusal"
          as="p"
          multiline
          text="This refuses that trade. It is a framework built with the tools of one and about the subject matter of the other — spirituality that does not require you to stop thinking, and thinking that does not require you to abandon your inner life."
          className="mt-5 block text-balance text-base leading-relaxed text-foreground/75"
        />
      </div>

      <ol className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border/70 bg-border/70 sm:grid-cols-3">
        {FACETS.map((facet) => (
          <li key={facet.id} className="bg-background p-7">
            <h3 className="font-serif text-xl font-semibold leading-snug text-foreground">
              {facet.title}
            </h3>
            <Editable
              id={facet.id}
              as="p"
              multiline
              text={facet.text}
              className="mt-3 block text-[15px] leading-relaxed text-foreground/70"
            />
          </li>
        ))}
      </ol>

      {/* The hinge. Without this, "Love" on the front page reads as sentiment
          and the whole proposition collapses into self-help. */}
      <div className="mx-auto mt-16 max-w-2xl rounded-2xl border border-[color:var(--organism-accent-soft)]/50 bg-[color:var(--organism-accent-soft)]/10 p-8 text-center backdrop-blur-sm">
        <p className="font-serif text-2xl italic leading-snug text-foreground sm:text-3xl">
          Love is an epistemic necessity.
        </p>
        <Editable
          id="what.love"
          as="p"
          multiline
          text="Not sentiment, not agreement, and not the disappearance of fear — a person can love while frightened. Love is the condition in which Fear no longer governs you. Fear left governing narrows what you are able to consider: it makes certain questions feel dangerous and certain conclusions intolerable, and it will quietly shrink an inquiry before the first measurement is taken. Love does not make inquiry soft. It makes inquiry harder to corrupt. That is why a book about consciousness has to talk about love at all."
          className="mt-6 block text-balance text-base leading-relaxed text-foreground/80"
        />
      </div>

      <div className="mx-auto mt-12 max-w-2xl">
        <Editable
          id="what.movement"
          as="p"
          multiline
          text="If this ever becomes a movement, it will be because it turned out to be useful — not because it was announced as one. What it aims to revive is older than any of it, and belongs to no tradition in particular: the willingness to see what is actually there, rather than only what you need to be there."
          className="block border-l-2 border-[color:var(--organism-accent-strong)] pl-5 font-serif text-[15px] italic leading-relaxed text-foreground/75"
        />
      </div>
    </section>
  );
}

export default HomeWhatThisIs;
