import { useEffect, useState } from "react";

import { InkStroke } from "../shared/Ink";

/**
 * What Minty shows while it is working.
 *
 * Grounding is the whole claim this companion makes, and it used to be the one
 * part of it the reader could not see. The wait showed a mark turning, which is
 * a promise that something is happening rather than evidence of it.
 *
 * The stream now sends a `retrieval` event before generation carrying the
 * sections actually opened, so the wait can name them. They are the same labels
 * the finished answer cites — nothing is disclosed early, it simply arrives
 * while the reader is still waiting to learn it. On an orchestrator that does
 * not send the event, the list is empty and the plain state stands.
 *
 * What is still refused: a percentage, a step count, "passage 3 of 7". The
 * stream reports what was opened, never how far along the writing is, so
 * anything shaped like progress would be invented.
 *
 * The stroke is the hero's ink — the reader wrote the question with it, and the
 * answer comes back in the same hand. It sits exactly where the prose will, so
 * the first token moves nothing.
 */

/** After this long, a silent wait stops reading as "fast" and starts reading as
 *  "stuck", so the copy acknowledges it rather than repeating itself. */
const PATIENCE_MS = 7000;

/** Where the drawing stroke turns around, in pixels. Kept short of a full line
 *  so it reads as a hand at work rather than as a progress bar filling. */
const STROKE_MIN = 26;
const STROKE_MAX = 168;

interface MintyWritingProps {
  reducedMotion: boolean;
  /** Sections Minty opened, if the orchestrator reported them. */
  sources?: readonly string[];
}

export function MintyWriting({ reducedMotion, sources = [] }: MintyWritingProps) {
  const [width, setWidth] = useState(STROKE_MIN);
  const [waited, setWaited] = useState(false);

  useEffect(() => {
    const patience = window.setTimeout(() => setWaited(true), PATIENCE_MS);
    return () => window.clearTimeout(patience);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      // Stillness was asked for. The stroke stays, drawn once, and the line of
      // text carries the fact that something is happening.
      setWidth(STROKE_MAX * 0.6);
      return;
    }
    // A hand writes in strokes, not at a constant rate: each pass runs out to a
    // different length before lifting, so the movement never sets into a loop
    // the eye can predict and start ignoring.
    let alive = true;
    const draw = () => {
      if (!alive) return;
      setWidth(STROKE_MIN + Math.random() * (STROKE_MAX - STROKE_MIN));
    };
    draw();
    const timer = window.setInterval(draw, 1100);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [reducedMotion]);

  return (
    <div className="minty-writing">
      <InkStroke width={width} className="minty-writing__stroke" />
      {sources.length > 0 ? (
        <p className="minty-writing__note">
          <span className="minty-writing__opened">Reading</span>{" "}
          {sources.join(" · ")}
        </p>
      ) : (
        <p className="minty-writing__note">
          {waited ? "Still reading Book One…" : "Reading Book One…"}
        </p>
      )}
    </div>
  );
}
