import { Editable } from "../../../content/editable";

/**
 * How the theory was built, rather than what is wrong with everyone else.
 *
 * An earlier version of this section was headed "four places the usual
 * explanation stops short". Even with a disclaimer attached, that framing put
 * the work in opposition to science — which contradicts the book itself. The
 * preface calls scientific method "indispensable" and its achievements "among
 * humanity's greatest", and says plainly that the author reached for it because
 * subjective judgment is fallible.
 *
 * So this reads as method, not critique. Each item is a rule the author held
 * himself to while constructing DOT, and the two places where measurement and
 * interpretation come apart appear as examples of that discipline rather than
 * as charges against a field.
 */

const PRACTICES = [
  {
    id: "method.levels",
    number: "01",
    title: "Mark the level of every claim",
    text: "Observation, model, hypothesis, speculation. The distinction governs the whole book, and the later claims never inherit the confidence of the earlier ones. You should always be able to tell which ground we are standing on.",
  },
  {
    id: "method.observer",
    number: "02",
    title: "Keep the observer in the account",
    text: "Method reduces individual bias; no method removes the observer from existence. Someone still chooses the question, defines the variables, builds the instrument, and decides which possibilities are respectable enough to investigate. Treating that as data is more rigorous than pretending it is absent.",
  },
  {
    id: "method.interpretation",
    number: "03",
    title: "Separate a measurement from its interpretation",
    text: "Brain activity can precede the moment a person reports deciding to move. The measurement is solid; what it settles is not — it records physiology and a retrospective report, not the origin of authorship. Damage a musician's instrument and the music changes, which does not prove the instrument wrote it.",
  },
  {
    id: "method.falsify",
    number: "04",
    title: "Say what would make it wrong",
    text: "A framework that cannot be contradicted is not protected, it is unfalsifiable. So the strongest alternative stays in the text — everything described here may arise from ordinary biological cognition, learning and prediction — alongside the debts this theory has not yet paid.",
  },
] as const;

export function HomeMethod() {
  return (
    <section
      id="method"
      aria-labelledby="method-title"
      className="mx-auto w-full max-w-5xl scroll-mt-8 px-6 py-24 sm:px-10"
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className="dot-label text-[color:var(--organism-accent-strong)]">
          The method
        </p>
        <h2
          id="method-title"
          className="mt-5 text-balance font-serif text-3xl font-semibold leading-tight text-foreground sm:text-4xl"
        >
          I did not argue against science. I used it.
        </h2>
        <Editable
          id="method.intro"
          as="p"
          multiline
          text="The scientific method exists because subjective judgment is fallible. Instruments, measurement, replication, and collective scrutiny are how a mind corrects itself, and they are among the best things we have ever built. I was trained in systems, and this is the method I brought to a question that usually falls outside it: what is it like to be the thing doing the measuring?"
          className="mt-6 block text-balance text-base leading-relaxed text-foreground/75"
        />
      </div>

      <ol className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border/70 bg-border/70 sm:grid-cols-2">
        {PRACTICES.map((practice) => (
          <li key={practice.id} className="bg-background p-7">
            <span
              aria-hidden="true"
              className="font-mono text-[13px] font-semibold tracking-[0.08em] text-[color:var(--organism-accent-strong)]"
            >
              {practice.number}
            </span>
            <h3 className="mt-3 font-serif text-xl font-semibold leading-snug text-foreground">
              {practice.title}
            </h3>
            <Editable
              id={practice.id}
              as="p"
              multiline
              text={practice.text}
              className="mt-3 block text-[15px] leading-relaxed text-foreground/70"
            />
          </li>
        ))}
      </ol>

      <div className="mx-auto mt-12 max-w-2xl">
        <Editable
          id="method.selfapplied"
          as="p"
          multiline
          text="The same standard applies to this. Any theory — including this one — becomes pseudoscience at the point where its claims exceed what its methods can honestly examine. That is why the weakest parts are published beside the rest, and why serious resistance is the thing I am actually asking for."
          className="block border-l-2 border-[color:var(--organism-accent-strong)] pl-5 font-serif text-[15px] italic leading-relaxed text-foreground/70"
        />
      </div>
    </section>
  );
}

export default HomeMethod;
