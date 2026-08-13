# ADR-0022: The Front Door Is a Note, Not a Pitch

- **Status:** Accepted
- **Date:** 2026-08-12
- **Deciders:** Founder
- **Amends:** ADR-0020 (four secondary doors, "join the movement", "support the work")

## Context

ADR-0020 replaced a taxonomic homepage with four intent-shaped doors. That was
the right correction to make, but the surface it produced still read as a
launch page: a centred serif monument, a four-across grid of coloured tiles with
arrows, and eight competing actions above the fold. The copy matched the form —
the page called the work "a spiritual and intellectual movement", opened on an
aphorism ("Love is an epistemic necessity"), and put "Join the Movement" and
"Support the Work" beside "Read Book One" as peers.

Two problems follow from that, and only one of them is aesthetic.

The first is that the page claims more than the book does. Book One is careful:
it marks observation, model, hypothesis, and speculation as distinct, and says
plainly that it is a construction rather than a revelation. A front door that
announces a movement and asks for money before the reader has read a sentence
sets a register the book then has to climb down from. It also misrepresents the
author, who is working the material out rather than reporting from the far side
of it.

The second is that the material is about fear, conditioning, and how little of
ourselves we chose. Readers arrive at that subject from inside it. A surface
that pressures — join, fund, choose between five doors — asks something of a
person who may have come only to read, and the surrounding culture already
makes it hard to sit with this kind of difficulty without performing progress.

## Decision

The public entry is written as a note from the author, not as a pitch.

- **One primary action.** Reading Book One. Everything else is a plain text
  link below a rule — no tiles, no icons, no arrows, no colour coding.
- **The ask is not at the door.** Funding is reachable from the book's own
  access page, where a reader has already been given something. It is not a
  peer of "read".
- **No claim the book has not earned.** The page declines to describe what the
  work will do for the reader. "Movement" is not used as a status claim: the
  entry states the *aim* and says outright that becoming one would follow from
  being useful rather than from being announced.

  This was originally written as "'Movement' is retired", full stop, and that
  went too far. Refusing to say what kind of thing this is left a visitor to
  guess between philosophy, faith, and self-help — which is its own failure of
  clarity. The `What this is` section now names it: a model of reality, and an
  attempt to reunite serious inner life with serious thinking. The humility is
  carried by the tense (aims to revive, not is), not by silence.

  "Love is an epistemic necessity" is stated there with its meaning attached.
  Alone on a hero it reads as sentiment; with the preface's definition beside it
  — Love as the condition in which Fear no longer governs, and therefore as what
  makes inquiry *harder to corrupt* — it is the hinge the whole proposition
  turns on. The "no worldview gets an exemption" facet is what keeps this from
  reading as sectarian, and it is the book's own sentence, author included.
- **The author is a fellow struggler, not a guide.** The page says so directly.
- **A care note follows the invitation rather than preceding it**, so it reads
  as company rather than as a warning label, and gives explicit permission to
  read slowly or stop.
- **Centred and on one axis.** The entry is a threshold, not a page of prose:
  mark, name, thesis line, one door, byline, the argument, and the question the
  visitor arrived with — all on the same centre line so nothing competes. The
  extended prose is centred as a block but set left-aligned inside it, because
  centred body copy is hard to read at length.
- **A way to ask, not only a way to read.** Most people arriving at a theory
  want to find out whether it says anything to them before committing to a book.
  The entry therefore carries a plain question field and four sample questions —
  two about what the theory claims, two about what it is for — each handing the
  reader to a grounded answer with its sources. The suggestions are finite and
  never refresh; they are an opening, not a feed.

### The hero enacts the argument

Restraint in space became restraint in *time*. The entry opens on black, a
single dot appears, and structure develops outward from that dot until it is the
NucleusMark — the book's opening move performed rather than described. The
theory is named only after the organism exists, and the core distinctions then
arrive one line at a time.

The sequence is bound by three rules that keep it from becoming a title card:

- **It finishes.** The concepts advance once and settle on the reader's line
  ("You were shaped before you could choose"), then stop scheduling. A hero that
  loops is a small autoplay engine (L2, L3), and a book that claims to be finite
  should not open with something that never ends. `HeroConcepts.test.tsx` pins
  this by asserting no timer remains after the last beat.
- **It never gates the door.** "Read Book One" appears while the sequence is
  still running. No reader waits out an animation to act.
- **It yields to the reader.** `prefers-reduced-motion` paints the settled final
  frame with no motion at all, and the sequence plays once per tab. Assistive
  technology receives every concept at once in an `sr-only` list, because a line
  rotating under someone who cannot see it rotate is noise.

### The hero owns no colour, and no required motion

A first attempt painted the sequence on an opaque black stage so the dot would
have a dark to emerge from. That was wrong twice over. It overrode the reader's
light/dark choice and their accent tint, and — because the stage was opaque — it
sealed the surface off from the living membrane behind it, which `.book-surface`
is careful never to do. The Appearance panel silently stopped governing the front
door.

So the hero declares no colour at all. Every value resolves from the theme and
the `--organism-accent*` variables, which means the emergence is the member's own
accent arriving, in their own theme. "Nothing" is rendered as a veil of the
page's *own* background lifting away to reveal the field, rather than a black
rectangle painted over it. `themeTokens.test.ts` fails the build on any literal
colour in these files.

Two things are also deliberately excluded from the sequence:

- **The door and the site nav have no entrance animation.** They are in the first
  painted frame. An earlier version faded the CTA in at 3.2s and the nav at 3.5s
  while the doc comment claimed the door was never gated — it plainly was.
- **The copy reveal is CSS, not JS.** These are the page's own words; a stalled
  animation layer must never be the reason a reader sees a blank hero.

Stillness is honoured from three sources, not one: `prefers-reduced-motion`, the
Appearance panel's "hold the field still", and disabling the organism outright.
Any of them paints the settled final frame.

### The entry is sourced from the manuscript, and shows its claim levels

An earlier pass wrote the entry's thesis from the README and section summaries.
That was a real fidelity risk: a paraphrase of a paraphrase, published as the
theory's own statement of itself. The entry copy is now taken from the
manuscript in `frontend/public/publications/.../v2/sections/` — the preface for
Love, the Subjective Data Principle, and the invitation; chapter 1 for the
architecture and the claim hierarchy; chapter 2 for the timing puzzle; chapter 5
for the practice and its safety caveat.

Two consequences follow, and both are load-bearing:

- **The concept sequence carries claim levels.** Each card is labelled
  observation, model, or hypothesis, because the preface says that distinction
  "governs the entire book". Big C and Little c are marked hypothesis on the
  front page, not stated as findings. `HeroConcepts.test.tsx` pins this.
- **The critique is applied to DOT too.** The open-problems section grants every
  measurement in full and questions only what the measurement is taken to have
  settled — then closes by turning the same standard back on DOT, because the
  preface does exactly that: "Any theory—including DOT—becomes pseudoscientific
  at the point where its claims exceed the domain its methods can honestly
  examine."

### The entry enables the practice, it does not only describe it

Book One's practical claim is that the loop can be tested from inside an
ordinary life without accepting the cosmology first. The entry therefore carries
the repainting loop (notice → predict → test → receive → update), the three
low-cost exercises the book gives, and a handoff into Minty for each one, so a
reader is not left holding an instruction with no companion. That handoff is the
difference between publishing a practice and enabling one.

The safety caveat ships with it and is not optional. The same chapter that gives
the practice says plainly that some patterns "should not be confronted
recklessly", and names therapy, honest relationship, material repair, a
different environment, and professional care as legitimate parts of the work.
Any future edit that keeps the exercises must keep that paragraph.

## Consequences

**Positive.** The entry now matches the book's own register, which is the thing
that makes the book trustworthy. There is one obvious thing to do, which serves
L2 and L3 more honestly than four tiles did. A reader in difficulty is not
recruited on arrival.

**Negative.** Join and support are less visible, and will convert less. That is
the intended trade, not a side effect: an ask that a reader has not been given
reason to accept is worth less than the trust spent making it. If funding
becomes load-bearing, the answer is to earn the ask further in — not to move it
back to the door.

**Revisit if** the book stops being the primary reason people arrive, or if
reader research shows the quiet links are genuinely undiscoverable rather than
merely secondary.

## Alternatives considered

| Option | Pros | Cons | Verdict |
| ------ | ---- | ---- | ------- |
| Keep the four tiles, soften the words | Small change | Form still says "landing page"; copy and layout fight | Rejected |
| Keep "support" at the door, drop "join" | Preserves funding path | Still asks before giving | Rejected |
| Note-style page, one action, quiet links | Matches the book's register; no pressure | Lower reach for join/support | **Chosen** |
