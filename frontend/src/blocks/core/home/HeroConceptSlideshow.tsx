import { useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useInView, useReducedMotion } from "framer-motion";
import { HERO_CONCEPTS, type Concept } from "./heroData";
import { useArchitectureFocus } from "./architectureFocus";

const LEVEL_LABEL: Record<Concept["level"], string> = {
  observation: "Observation",
  model: "Model",
  hypothesis: "Hypothesis",
};

const TERM_TICK_MS = 35;
const PASSAGE_TICK_MS = 20;

const fullLength = (concept: Concept) => concept.term.length + concept.text.length;

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
  const total = fullLength(concept);
  const last = index === HERO_CONCEPTS.length - 1;
  const typing = !still && playing && !last;
  const advancing = typing && inView && tabVisible && !hovered;
  const counting = advancing && length >= total;
  const readingTime = Math.max(8_000, concept.text.split(/\s+/).length * 300);
  const termShown = typing ? Math.min(length, concept.term.length) : concept.term.length;
  const textShown = typing ? Math.max(0, length - concept.term.length) : concept.text.length;
  const typingText = typing && textShown < concept.text.length;

  useEffect(() => {
    const updateVisibility = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(() => {
    if (still) setPlaying(false);
  }, [still]);

  const { setFocus, requested } = useArchitectureFocus();
  useEffect(() => {
    setFocus(concept.part ?? null);
  }, [concept.part, setFocus]);
  useEffect(() => () => setFocus(null), [setFocus]);

  useEffect(() => {
    if (!requested) return;
    const target = HERO_CONCEPTS.findIndex(item => item.part === requested.part);
    const targetConcept = HERO_CONCEPTS[target];
    if (!targetConcept) return;
    setPlaying(false);
    setIndex(target);
    setTyped({ id: targetConcept.id, length: fullLength(targetConcept) });
  }, [requested]);

  useEffect(() => {
    if (!typing || !inView || !tabVisible || length >= total) return;
    const timer = window.setTimeout(() => {
      setTyped({ id: concept.id, length: length + 1 });
    }, length < concept.term.length ? TERM_TICK_MS : PASSAGE_TICK_MS);
    return () => window.clearTimeout(timer);
  }, [concept.id, concept.term.length, inView, length, tabVisible, total, typing]);

  useEffect(() => {
    if (!counting) return;
    const timer = window.setTimeout(() => {
      setIndex(current => Math.min(HERO_CONCEPTS.length - 1, current + 1));
    }, readingTime);
    return () => window.clearTimeout(timer);
  }, [counting, index, readingTime]);

  const pause = () => {
    setPlaying(false);
    setTyped({ id: concept.id, length: total });
  };

  const move = (direction: number) => {
    const nextIndex = Math.max(0, Math.min(HERO_CONCEPTS.length - 1, index + direction));
    const nextConcept = HERO_CONCEPTS[nextIndex];
    if (!nextConcept) throw new Error("The requested Book One concept is missing.");
    setPlaying(false);
    setIndex(nextIndex);
    setTyped({ id: nextConcept.id, length: fullLength(nextConcept) });
  };

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
      <p className="home-concept-slideshow-eyebrow" aria-hidden="true">
        <span>Key concept</span>
        <span data-level={concept.level}>{LEVEL_LABEL[concept.level]}</span>
      </p>
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
            <span aria-hidden="true" data-typing={typing && termShown < concept.term.length}>
              {concept.term.slice(0, termShown)}
            </span>
          </h2>
          <span className="sr-only">{LEVEL_LABEL[concept.level]}.</span>
          <p className="home-concept-slideshow-explanation">
            {typingText ? (
              <>
                <span data-typing={termShown === concept.term.length}>
                  {concept.text.slice(0, textShown)}
                </span>
                {/* Untyped words keep their place, so lines never reflow as they arrive. */}
                <span className="home-concept-slideshow-untyped">
                  {concept.text.slice(textShown)}
                </span>
              </>
            ) : concept.text}
          </p>
        </div>
      </div>
      <div className="home-concept-slideshow-footer">
        <ol className="home-concept-slideshow-rail" aria-hidden="true">
          {HERO_CONCEPTS.map((item, position) => (
            <li
              key={item.id}
              data-state={position < index ? "read" : position === index ? "current" : "ahead"}
            >
              {position === index && counting && (
                <span style={{ animationDuration: `${readingTime}ms` }} />
              )}
            </li>
          ))}
        </ol>
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
