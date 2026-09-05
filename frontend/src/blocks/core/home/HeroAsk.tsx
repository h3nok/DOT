import { X } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";

import { InkNib, InkStroke } from "../../../shared/Ink";
import type { HeroAskRequest } from "./heroData";
import type { AgentLens } from "../../../dot/agent";

const MAX_QUESTION_LENGTH = 500;

interface HeroAskProps {
  onAsk: (request: HeroAskRequest) => void;
  className?: string;
}

export function HeroAsk({ onAsk, className = "" }: HeroAskProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [selectedLens, setSelectedLens] = useState<AgentLens>("ground");
  const inputRef = useRef<HTMLInputElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [strokeWidth, setStrokeWidth] = useState(0);

  /**
   * The stroke is exactly as long as what has been written.
   *
   * A rule spanning the whole field underlines mostly empty paper, which is a
   * form control's habit, not a pen's — ink only exists where the nib has been.
   * Width is measured from a mirror of the text in the same face and size,
   * because the input itself will not report the width of its own value.
   */
  useLayoutEffect(() => {
    const mirror = measureRef.current;
    const input = inputRef.current;
    if (!mirror || !input) return;
    // A touched-down nib leaves a mark before any letter does; an empty focused
    // field gets that and nothing more.
    const written = mirror.offsetWidth;
    const room = input.clientWidth;
    setStrokeWidth(query ? Math.min(written, room) : 0);
  }, [query, isFocused]);

  const handleClear = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      if (query) {
        setQuery("");
      } else {
        inputRef.current?.blur();
      }
    }
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    onAsk({ query: trimmed, lens: selectedLens });
    setQuery("");
  };

  const sendable = Boolean(query.trim());

  /**
   * Where the writing has got to, in the mark's terms rather than the form's.
    * The CSS reads only this attribute, so appearance never has to re-derive the
    * form's booleans.
   */
  const penState = sendable ? "writing" : isFocused ? "poised" : "resting";

  return (
    <div className={`home-inquiry ${className}`}>
      <form onSubmit={submit} className="relative w-full" aria-describedby="hero-ask-description">
        <div className="appearance-ui-control home-ask" data-pen={penState}>
          <span className="home-ask__mark" aria-hidden="true">
            <span />
          </span>

          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ask Book One…"
            aria-label="Ask a question about Digital Organism Theory"
            name="book-one-question"
            autoComplete="off"
            enterKeyHint="send"
            maxLength={MAX_QUESTION_LENGTH}
            spellCheck="true"
            className="home-ask__input placeholder:text-muted-foreground/55"
          />

          {/* Mirrors the value in the same face so the stroke can be measured
              against real text rather than an estimate. */}
          <span ref={measureRef} className="home-ask__measure" aria-hidden="true">
            {query}
          </span>

          {/* The mark the pen leaves. It is the whole of the pen we show. */}
          <InkStroke width={strokeWidth} className="home-ask__stroke" />

          <fieldset className="home-ask__lenses" aria-label="Inquiry lens">
            <button
              type="button"
              aria-pressed={selectedLens === "ground"}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setSelectedLens("ground")}
              title="Ground the answer in source passages"
            >
              Ground
            </button>
            <button
              type="button"
              aria-pressed={selectedLens === "test"}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setSelectedLens("test")}
              title="Test the claim and expose weak points"
            >
              Test
            </button>
          </fieldset>

          {query.trim() && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear question"
              className="home-ask__clear"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}

          <button
            type="submit"
            disabled={!sendable}
            aria-label="Ask Book One"
            className="home-ask__nib"
          >
            <InkNib charged={sendable} className="home-ask__nib-mark" />
          </button>
        </div>

        <p id="hero-ask-description" className="home-inquiry__note">
          Try “Do we ever really choose?” — answers cite the released text.
          Ground anchors them in passages; Test challenges the claim.
        </p>
      </form>
    </div>
  );
}
