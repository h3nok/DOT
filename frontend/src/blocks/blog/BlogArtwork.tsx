import { useId } from "react";

/** Abstract editorial illustrations, not diagrams or claims about a system. */
export function BlogCoverArtwork() {
  const id = useId();
  return (
    <svg className="blog-cover-art" viewBox="0 0 520 440" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <pattern id={`${id}-grid`} width="28" height="28" patternUnits="userSpaceOnUse">
          <path d="M28 0H0V28" stroke="currentColor" strokeOpacity=".12" />
        </pattern>
        <radialGradient id={`${id}-sun`} cx="35%" cy="25%" r="80%">
          <stop stopColor="var(--blog-sun-light)" />
          <stop offset="1" stopColor="var(--blog-copper)" />
        </radialGradient>
      </defs>
      <rect x="30" y="20" width="460" height="390" rx="200" fill={`url(#${id}-grid)`} />
      <ellipse cx="276" cy="346" rx="198" ry="48" className="blog-art-wire" />
      <ellipse cx="276" cy="346" rx="143" ry="29" className="blog-art-wire" />
      <path d="M76 346H475M276 298V394M128 317L424 375M128 375L424 317" className="blog-art-wire" />
      <g className="blog-art-orbit">
        <circle cx="328" cy="151" r="103" fill={`url(#${id}-sun)`} />
        <circle cx="328" cy="151" r="85" stroke="var(--blog-cream)" strokeOpacity=".5" />
        <circle cx="328" cy="151" r="67" stroke="var(--blog-cream)" strokeOpacity=".6" />
        <circle cx="328" cy="151" r="49" stroke="var(--blog-cream)" strokeOpacity=".7" />
        <circle cx="328" cy="151" r="31" stroke="var(--blog-cream)" strokeOpacity=".8" />
        <path d="M225 151H431M328 48V254" stroke="var(--blog-cream)" strokeOpacity=".45" />
        <ellipse cx="328" cy="151" rx="126" ry="34" transform="rotate(-34 328 151)" stroke="var(--blog-ink)" />
        <circle cx="430" cy="80" r="7" fill="var(--blog-ink)" />
      </g>
      <g className="blog-art-system" stroke="var(--blog-ink)" strokeWidth="1.2" strokeLinejoin="round">
        <path d="M86 188L183 132L280 188L183 244Z" fill="var(--blog-cream)" />
        <path d="M86 188V297L183 353V244Z" fill="var(--blog-sage)" />
        <path d="M183 244L280 188V297L183 353Z" fill="var(--blog-ink)" />
        <path d="M118 206V279L159 303V230ZM130 226L147 236M130 239L147 249M130 252L147 262" />
        <path d="M183 156L237 187L183 219L129 187Z" />
        <path d="M183 174L206 187L183 201L160 187Z" fill="var(--blog-copper)" />
        <path d="M202 255L261 221M202 275L261 241M202 295L261 261" stroke="var(--blog-sage)" />
        <circle cx="206" cy="317" r="3" fill="var(--blog-sage)" stroke="none" />
        <circle cx="218" cy="310" r="3" fill="var(--blog-sage)" stroke="none" />
        <circle cx="230" cy="303" r="3" fill="var(--blog-copper)" stroke="none" />
      </g>
      <path className="blog-art-thread" d="M69 107C69 69 155 54 177 86C205 127 109 136 127 94C151 36 267 39 289 95M365 242C452 260 473 312 434 345C387 385 310 337 342 307" stroke="var(--blog-ink)" strokeWidth="1.4" strokeLinecap="round" />
      <g fill="var(--blog-ink)">
        <path d="M68 86V105M59 95H77M443 271V290M434 280H452" stroke="currentColor" />
        <circle cx="69" cy="107" r="4" />
        <circle cx="342" cy="307" r="4" />
      </g>
      <path d="M44 400H94M69 375V425M454 36H478M466 24V48" className="blog-art-wire" />
    </svg>
  );
}

export function BlogPathArtwork({ kind }: { kind: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 600 210" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <pattern id={`${id}-dots`} width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="currentColor" opacity=".22" />
        </pattern>
      </defs>
      <rect width="600" height="210" fill={`url(#${id}-dots)`} />
      {kind === "building" ? (
        <g className="blog-path-drawing" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round">
          <path d="M65 165H536M114 187L348 50M238 194L472 57" opacity=".25" />
          <path d="M222 86L286 49L350 86L286 123Z" fill="var(--blog-sage)" />
          <path d="M222 86V148L286 185V123Z" fill="var(--blog-green)" />
          <path d="M286 123L350 86V148L286 185Z" fill="var(--blog-ink)" />
          <path d="M330 66L388 33L446 66L388 100Z" fill="var(--blog-cream)" />
          <path d="M330 66V124L388 158V100Z" fill="var(--blog-sage)" />
          <path d="M388 100L446 66V124L388 158Z" fill="var(--blog-green)" />
          <path d="M152 133L197 107L242 133L197 159Z" fill="var(--blog-sun-light)" />
          <path d="M152 133V166L197 192V159Z" fill="var(--blog-copper)" />
          <path d="M197 159L242 133V166L197 192Z" fill="var(--blog-ink)" />
          <path d="M93 103H145L179 82H208M465 140H496V79H523M293 33V16H246" />
          <circle cx="93" cy="103" r="5" fill="var(--blog-sage)" />
          <circle cx="523" cy="79" r="5" fill="var(--blog-sun-light)" />
          <circle cx="246" cy="16" r="4" fill="var(--blog-sage)" />
          <path d="M253 90L286 71L318 90L286 108Z" opacity=".7" />
          <path d="M401 111L431 94M401 125L431 108" opacity=".7" />
        </g>
      ) : (
        <g className="blog-path-drawing">
          <circle cx="359" cy="105" r="78" fill="var(--blog-copper)" />
          {[24, 40, 56, 72].map((radius) => <circle key={radius} cx="359" cy="105" r={radius} stroke="var(--blog-cream)" strokeOpacity=".65" />)}
          <ellipse cx="359" cy="105" rx="114" ry="29" transform="rotate(-25 359 105)" stroke="var(--blog-ink)" />
          <g transform="rotate(-9 204 105)" stroke="var(--blog-ink)" strokeLinejoin="round">
            <path d="M153 35H241L253 46V175H165L153 165Z" fill="var(--blog-cream)" />
            <path d="M153 35L165 46H253M165 46V175" />
            <path d="M182 67H236M182 73H224M182 149H236M182 154H210" opacity=".5" />
            <circle cx="209" cy="111" r="23" />
            <ellipse cx="209" cy="111" rx="32" ry="10" transform="rotate(-35 209 111)" />
            <circle cx="209" cy="111" r="6" fill="var(--blog-copper)" stroke="none" />
          </g>
          <path d="M78 142C83 76 137 78 135 112M450 73C502 19 535 98 503 124" stroke="var(--blog-ink)" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M478 163H494M486 155V171M111 49H123M117 43V55" stroke="var(--blog-ink)" />
        </g>
      )}
    </svg>
  );
}

export function BlogSeriesArtwork() {
  return (
    <svg viewBox="0 0 240 210" fill="none" aria-hidden="true" focusable="false">
      <g className="blog-torch-rays" stroke="currentColor" strokeWidth=".8" opacity=".5">
        {Array.from({ length: 23 }, (_, index) => (
          <path key={index} d="M120 45V4" transform={`rotate(${index * 15.65} 120 102)`} />
        ))}
        <circle cx="120" cy="102" r="85" />
        <circle cx="120" cy="102" r="68" />
      </g>
      <g className="blog-torch" fill="currentColor">
        <path d="M107 154H133L138 174H102ZM110 92H130L127 155H113ZM99 83H141L135 93H105Z" />
        <path d="M120 30C139 49 112 53 132 66C153 42 148 77 132 82H111C90 66 101 51 111 42C108 55 111 58 116 61C122 48 115 47 120 30Z" />
        <path d="M91 177H149V182H91ZM82 186H158V190H82Z" />
      </g>
    </svg>
  );
}

export function BlogPostArtwork({ variant }: { variant: number }) {
  return (
    <svg viewBox="0 0 140 140" fill="none" aria-hidden="true" focusable="false">
      <circle cx="70" cy="70" r="48" stroke="currentColor" strokeOpacity=".25" />
      {variant === 0 ? (
        <g stroke="currentColor" strokeLinejoin="round">
          <path d="M37 50L70 31L103 50L70 69Z" fill="var(--blog-sage)" />
          <path d="M37 50V89L70 108V69Z" fill="var(--blog-green)" />
          <path d="M70 69L103 50V89L70 108Z" fill="var(--blog-ink)" />
        </g>
      ) : variant === 1 ? (
        <>
          <circle cx="70" cy="70" r="33" fill="var(--blog-copper)" />
          <circle cx="70" cy="70" r="21" stroke="var(--blog-cream)" />
          <ellipse cx="70" cy="70" rx="48" ry="15" transform="rotate(-30 70 70)" stroke="currentColor" />
        </>
      ) : (
        <g stroke="currentColor">
          <path d="M30 93C33 33 65 31 61 64C56 103 92 109 96 47M30 108H111" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="61" cy="64" r="6" fill="var(--blog-copper)" stroke="none" />
          <circle cx="96" cy="47" r="6" fill="var(--blog-sage)" />
        </g>
      )}
    </svg>
  );
}
