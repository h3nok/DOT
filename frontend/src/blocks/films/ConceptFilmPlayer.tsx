import { ConceptFrame } from "./ConceptFrame";
import { CONCEPT_FILM_BEATS, CONCEPT_FILM_SECONDS, type ConceptFilm } from "./conceptFilms";
import { formatDuration } from "./filmTime";
import { SilentFilmPlayer } from "./SilentFilmPlayer";

/**
 * A silent film for one concept. Before it plays, the stage holds the film's finished
 * frame, so the concept can be read without watching. The film ends on that same
 * frame and never moves on by itself (L3).
 */
export function ConceptFilmPlayer({ film }: { film: ConceptFilm }) {
  return (
    <SilentFilmPlayer
      duration={CONCEPT_FILM_SECONDS}
      posterTime={CONCEPT_FILM_SECONDS}
      playLabel={`Play the ${film.node.title} film (${formatDuration(CONCEPT_FILM_SECONDS)}, silent)`}
      resetKey={film.id}
      dataAttributes={{ "data-concept": film.id }}
    >
      {(frame) => (
        <ConceptFrame film={film} motifTime={frame} copyTime={frame} beats={CONCEPT_FILM_BEATS} />
      )}
    </SilentFilmPlayer>
  );
}
