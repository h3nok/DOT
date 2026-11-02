import { CONCEPT_MOTIFS } from "../films/conceptFilms";

/** The book and film share the same reviewed visual analogies, with reader-owned timing. */
export default function BookConceptArt({ concept, time }: { concept: string; time: number }) {
  const { Motif } = CONCEPT_MOTIFS[concept];
  return <svg className="book-concept-art" viewBox="0 0 600 600" aria-hidden="true"><Motif t={time} /></svg>;
}
