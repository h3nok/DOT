/**
 * Ink — the marks a pen leaves.
 *
 * Shared, because the hero and Minty are the same act seen from two ends: the
 * reader writes the question in ink, and the answer is written back in it. If
 * these lived beside the hero, Minty would have had to grow a second, nearly
 * identical stroke, and the two would have drifted apart the first time either
 * was adjusted.
 *
 * An earlier version of this built a pen out of hardware: a machined cap, a
 * clip, a grip section, a plated nib. Four chrome props on a glass pill, and it
 * read as props, because that is what they were. Adding parts is not how an
 * object becomes premium; it is how it becomes a costume.
 *
 * So the pen is not depicted here. It is *evidenced* — by the mark it leaves.
 * That is also the truer reading of the phrase: a pen is mightier than a sword
 * because of what it writes, not because of what it is made of. The site's own
 * vocabulary agrees; Canvas, Painting and ink were already the language.
 *
 * What survives from the first pass is the one thing that earned its place: a
 * nib's ink channel and a blade's fuller are the same cut, so the slit stays,
 * now as negative space punched through a flat ink mark rather than a groove
 * milled into steel.
 */

/**
 * The stroke laid under the question.
 *
 * The single largest reason the first attempt looked cheap: the underline was a
 * 1px linear-gradient, which is a form field's rule, not ink. A real stroke has
 * width that varies along its length — a slightly blunt entry where the nib
 * lands, a belly where the hand is at speed, and a hairline exit as it lifts.
 * That means a *filled shape*, never a stroked line.
 *
 * `preserveAspectRatio="none"` lets the shape stretch to whatever length has
 * been written while keeping the vertical profile exact, so the belly stays
 * 3-odd pixels whether the question is two words or twenty.
 *
 * The width is given rather than inherited: an SVG is a replaced element, so
 * `left` and `right` together do not stretch it the way they stretch a div —
 * it falls back to its intrinsic size and silently draws a stub.
 */
export function InkStroke({ width, className = "" }: { width: number; className?: string }) {
  return (
    <svg
      className={className}
      style={{ width: `${width}px` }}
      viewBox="0 0 100 8"
      preserveAspectRatio="none"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M0 3.4C12 2.7 26 2.15 38 2.1C60 2.25 82 3.05 100 3.95C82 4.95 60 5.75 38 5.9C26 5.85 12 5.3 0 4.6Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * The send mark: a nib, drawn as ink rather than made of steel.
 *
 * Flat, one colour, no gradient and no plating — the confidence is in the
 * outline. The slit and breather hole are cut *through* it with a mask, so the
 * page shows between them and the mark reads as something stamped rather than
 * rendered.
 *
 * Dry, it is the outline alone. Charged, it floods. That single fill is the
 * whole state change, and it is the same event the stroke under the text is
 * reporting — one idea said twice, quietly.
 */
export function InkNib({ charged, className = "" }: { charged: boolean; className?: string }) {
  return (
    <svg
      className={className}
      data-charged={charged ? "true" : "false"}
      viewBox="0 0 28 22"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <mask id="home-ask-nib-cut">
        <rect width="28" height="22" fill="white" />
        {/* The channel, tapering exactly as the stroke does. */}
        <path
          d="M9.4 10.3C14 10.35 19.6 10.58 24.8 11C19.6 11.42 14 11.65 9.4 11.7Z"
          fill="black"
        />
        {/* The breather hole — the one round form among tapers, and what keeps
            the silhouette from collapsing into a plain arrow. */}
        <circle cx="7.5" cy="11" r="2.25" fill="black" />
      </mask>

      <path
        className="ink-nib-shape"
        d="M26.6 11C20.6 6.6 13.6 3.5 6.6 2.9C3.2 2.6 1.2 5.1 1.2 11C1.2 16.9 3.2 19.4 6.6 19.1C13.6 18.5 20.6 15.4 26.6 11Z"
        mask="url(#home-ask-nib-cut)"
      />
    </svg>
  );
}
