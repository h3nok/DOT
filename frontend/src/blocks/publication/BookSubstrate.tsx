/**
 * A quiet computational layer etched into the opening volume.
 *
 * This is deliberately geometry rather than imagery: it stays sharp at every
 * viewport, inherits the book palette, and can become completely still without
 * losing its meaning. The traces describe state moving through a bounded field;
 * they are atmosphere, not controls or data visualization.
 */
export default function BookSubstrate() {
  return (
    <div className="book-substrate" aria-hidden="true">
      <svg
        viewBox="0 0 1600 1000"
        preserveAspectRatio="none"
        className="book-substrate-map"
      >
        <g className="book-substrate-traces">
          <path d="M26 112H176V150H390V112H620" />
          <path d="M26 178H112V214H250" />
          <path d="M28 796H176V748H360V792H582V742H742" />
          <path d="M28 854H108V894H310" />

          <path d="M974 92H1110V126H1318V90H1572" />
          <path d="M850 188H960V154H1070" />
          <path d="M872 782H1012V826H1232V776H1410V820H1574" />
          <path d="M1268 888H1450V850H1574" />

          <path className="book-substrate-bus" d="M800 24V976" />
          <path className="book-substrate-flow" d="M28 680H320V638H616V682H776" />
          <path className="book-substrate-flow book-substrate-flow--return" d="M824 706H1010V674H1316V716H1572" />
        </g>

        <g className="book-substrate-vias">
          <circle cx="176" cy="112" r="4" />
          <circle cx="390" cy="112" r="4" />
          <circle cx="112" cy="214" r="4" />
          <circle cx="176" cy="748" r="4" />
          <circle cx="360" cy="792" r="4" />
          <circle cx="582" cy="742" r="4" />
          <circle cx="108" cy="894" r="4" />
          <circle cx="1110" cy="126" r="4" />
          <circle cx="1318" cy="90" r="4" />
          <circle cx="960" cy="154" r="4" />
          <circle cx="1012" cy="826" r="4" />
          <circle cx="1232" cy="776" r="4" />
          <circle cx="1410" cy="820" r="4" />
          <circle cx="1450" cy="850" r="4" />
        </g>

        <g className="book-substrate-state-nodes">
          <circle cx="620" cy="112" r="5" />
          <circle cx="742" cy="742" r="5" />
          <circle cx="850" cy="188" r="5" />
          <circle cx="1070" cy="154" r="5" />
          <circle cx="872" cy="782" r="5" />
          <circle cx="1268" cy="888" r="5" />
        </g>
      </svg>

      <span className="book-substrate-register book-substrate-register--input">
        00 / INPUT
      </span>
      <span className="book-substrate-register book-substrate-register--state">
        01 / STATE
      </span>
      <span className="book-substrate-register book-substrate-register--return">
        10 / RETURN
      </span>
      <span className="book-substrate-register book-substrate-register--edition">
        DOT · E2
      </span>
    </div>
  );
}
