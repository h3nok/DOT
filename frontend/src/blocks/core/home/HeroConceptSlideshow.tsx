import { useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useInView, useReducedMotion } from "framer-motion";
import { HERO_CONCEPTS, type Concept } from "./heroData";

const LEVEL_LABEL: Record<Concept["level"], string> = {
  observation: "Observation",
  model: "Model",
  hypothesis: "Hypothesis",
};

export function HeroConceptSlideshow({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const pointerPlayback = useRef(false);
  const inView = useInView(ref, { amount: 0.6 });
  const prefersReducedMotion = useReducedMotion();
  const still = reducedMotion || prefersReducedMotion;
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(!still);
  const [hovered, setHovered] = useState(false);
  const [tabVisible, setTabVisible] = useState(!document.hidden);
  const [typed, setTyped] = useState({ id: "", length: 0 });
  const concept = HERO_CONCEPTS[index];
  if (!concept) throw new Error("The selected Book One concept is missing.");
  const length = typed.id === concept.id ? typed.length : 0;
  const last = index === HERO_CONCEPTS.length - 1;
  const typing = !still && playing && !last;
  const advancing = typing && inView && tabVisible && !hovered;

  useEffect(() => {
    const updateVisibility = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(() => {
    if (still) setPlaying(false);
  }, [still]);

  useEffect(() => {
    if (!typing || !inView || !tabVisible || length >= concept.term.length) return;
    const timer = window.setTimeout(() => {
      setTyped({ id: concept.id, length: length + 1 });
    }, 35);
    return () => window.clearTimeout(timer);
  }, [concept.id, concept.term, inView, length, tabVisible, typing]);

  useEffect(() => {
    if (!advancing || length < concept.term.length) return;
    const readingTime = Math.max(8_000, concept.text.split(/\s+/).length * 300);
    const timer = window.setTimeout(() => {
      setIndex(current => Math.min(HERO_CONCEPTS.length - 1, current + 1));
    }, readingTime);
    return () => window.clearTimeout(timer);
  }, [advancing, concept.text, index, length, concept.term.length]);

  const pause = () => {
    setPlaying(false);
    setTyped({ id: concept.id, length: concept.term.length });
  };

  const move = (direction: number) => {
    const nextIndex = Math.max(0, Math.min(HERO_CONCEPTS.length - 1, index + direction));
    const nextConcept = HERO_CONCEPTS[nextIndex];
    if (!nextConcept) throw new Error("The requested Book One concept is missing.");
    setPlaying(false);
    setIndex(nextIndex);
    setTyped({ id: nextConcept.id, length: nextConcept.term.length });
  };

  const playbackLabel = last ? "Done" : still ? "Still" : playing ? "Pause" : "Play";
  const PlaybackIcon = last ? Check : playing && !still ? Pause : Play;

  return (
    <section
      ref={ref}
      className="home-concept-slideshow"
      aria-label="Key concepts from Book One"
      aria-roledescription="carousel"
      data-playback={last ? "complete" : still ? "still" : advancing ? "playing" : "paused"}
      onFocusCapture={pause}
      onPointerEnter={event => {
        if (event.pointerType === "mouse") setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
    >
      <div className="home-concept-slideshow-body">
        {/* Reserve the longest slide at the current font and width, without clipping text. */}
        {HERO_CONCEPTS.map(item => (
          <div key={item.id} className="home-concept-slideshow-size" aria-hidden="true">
            <span className="home-concept-slideshow-term">{item.term}</span>
            <p className="home-concept-slideshow-explanation">{item.text}</p>
          </div>
        ))}
        <div
          className="home-concept-slideshow-content"
          role="group"
          aria-roledescription="slide"
          aria-label={`${index + 1} of ${HERO_CONCEPTS.length}`}
          aria-live={playing && !still ? "off" : "polite"}
          aria-atomic="true"
          data-epistemic-status={concept.level}
        >
          <h2 className="home-concept-slideshow-term" aria-label={concept.term}>
            <span aria-hidden="true" data-typing={typing && length < concept.term.length}>
              {typing ? concept.term.slice(0, length) : concept.term}
            </span>
          </h2>
          <span className="sr-only">{LEVEL_LABEL[concept.level]}.</span>
          <p className="home-concept-slideshow-explanation">{concept.text}</p>
        </div>
      </div>
      <div className="home-concept-slideshow-footer">
        <p className="home-concept-slideshow-meta" aria-hidden="true">
          <span>{last ? "Complete" : "Key concepts"}</span>
          <span>{LEVEL_LABEL[concept.level]} · {index + 1} / {HERO_CONCEPTS.length}</span>
        </p>
        <div className="home-concept-slideshow-controls">
          <button
            type="button"
            className="home-concept-slideshow-playback"
            aria-label={last ? "Concept introduction complete" : still
              ? "Autoplay unavailable in stillness mode"
              : `${playing ? "Pause" : "Play"} concept introduction`}
            disabled={still || last}
            title={still ? "Use Previous and Next to read every concept."
              : "Plays once. Pauses on hover or keyboard interaction."}
            onPointerDown={() => { pointerPlayback.current = !playing; }}
            onClick={event => {
              // Focus pauses first; preserve the mouse/touch action chosen before focus.
              const shouldPlay = event.detail > 0 ? pointerPlayback.current : !playing;
              if (shouldPlay) setPlaying(true);
              else pause();
            }}
          >
            <PlaybackIcon aria-hidden="true" />
            <span>{playbackLabel}</span>
          </button>
          <button
            type="button"
            aria-label="Previous concept"
            disabled={index === 0}
            onClick={() => move(-1)}
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next concept"
            disabled={last}
            onClick={() => move(1)}
          >
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
