interface GuidedArgumentProps {
  ariaLabel: string;
  known: string;
  scope: string;
  question: string;
  proposal: string;
  boundary: string;
  className?: string;
}

export function GuidedArgument({
  ariaLabel,
  known,
  scope,
  question,
  proposal,
  boundary,
  className = "",
}: GuidedArgumentProps) {
  return (
    <section
      aria-label={ariaLabel}
      className={`dot-guided-argument home-theory-layer-inquiry ${className}`}
    >
      <div className="dot-guided-argument__steps home-theory-layer-inquiry-steps">
        <section data-step="question" aria-label="Established ground and open question">
          <div className="dot-guided-argument__content home-theory-layer-step-content">
            <div className="dot-guided-argument__foundation home-theory-layer-foundation">
              <div className="dot-guided-argument__known home-theory-layer-conventional">
                <div className="home-theory-layer-comparison-heading">
                  <span className="home-theory-layer-comparison-label">What we know</span>
                  <span className="home-theory-layer-scope">Covers: {scope}</span>
                </div>
                <p>{known}</p>
              </div>
              <div className="dot-guided-argument__question home-theory-layer-unresolved">
                <span className="home-theory-layer-comparison-label">
                  The open question
                </span>
                <p>{question}</p>
              </div>
            </div>
          </div>
        </section>
        <section data-step="proposal" aria-label="DOT's proposition">
          <div className="dot-guided-argument__content home-theory-layer-step-content">
            <span className="home-theory-layer-step-label">DOT proposes</span>
            <p>{proposal}</p>
          </div>
        </section>
        <section data-step="boundary" aria-label="Test boundary">
          <div className="dot-guided-argument__content home-theory-layer-step-content">
            <span className="home-theory-layer-step-label">Test boundary</span>
            <p>{boundary}</p>
          </div>
        </section>
      </div>
    </section>
  );
}