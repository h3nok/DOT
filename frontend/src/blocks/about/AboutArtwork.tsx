/** Editorial illustrations of the recorded products, rather than simulated screenshots. */
export function BuilderArtwork() {
  return <svg viewBox="0 0 360 150" fill="none" aria-hidden="true" className="about-builder-art">
    <path d="M30 120H330M70 25V130M180 25V130M290 25V130" className="about-art-guide" />
    <path d="M70 75H130Q180 75 180 45V30M180 75H230Q290 75 290 105V120" className="about-art-line" />
    <circle cx="70" cy="75" r="34" className="about-art-fill" />
    <circle cx="70" cy="75" r="23" className="about-art-line" />
    <circle cx="70" cy="75" r="7" className="about-art-solid" />
    <rect x="145" y="40" width="70" height="70" rx="9" className="about-art-paper" />
    <path d="M159 66H201M159 77H190M159 88H196" className="about-art-line" />
    <path d="M260 57L290 40L320 57V92L290 110L260 92Z" className="about-art-fill" />
    <path d="M260 57L290 75L320 57M290 75V110" className="about-art-line" />
    <circle cx="180" cy="25" r="4" className="about-art-solid" />
    <circle cx="290" cy="125" r="4" className="about-art-solid" />
  </svg>;
}

export function ProductArtwork({ kind }: { kind: string }) {
  return <svg viewBox="0 0 520 300" fill="none" aria-hidden="true" className="about-product-art">
    <path d="M0 60H520M0 120H520M0 180H520M0 240H520M65 0V300M130 0V300M195 0V300M260 0V300M325 0V300M390 0V300M455 0V300" className="about-art-guide" />
    {kind === "sullix" ? <>
      <ellipse cx="255" cy="258" rx="180" ry="20" className="about-art-guide" />
      <path d="M96 242V135L199 80L302 135V242M199 80V242M96 135L199 192L302 135M96 242L199 297L302 242" className="about-art-line" />
      <path d="M96 135L199 80L302 135L199 192Z" className="about-art-paper" />
      <path d="M199 192L302 135V242L199 297Z" className="about-art-fill" />
      <path d="M114 158L168 188M114 179L168 209M114 200L168 230M218 199L282 165M218 219L282 185M218 239L282 205" className="about-art-line" />
      <path d="M302 174H363V53M363 114H430M363 174H430M363 234H430" className="about-art-line" />
      {[54,114,174,234].map(y => <g key={y}><circle cx={y === 54 ? 363 : 430} cy={y} r="15" className="about-art-paper" /><circle cx={y === 54 ? 363 : 430} cy={y} r="4" className="about-art-solid" /></g>)}
      <path d="M46 55H116M81 20V90" className="about-art-guide" />
    </> : kind === "medroute" ? <>
      <path d="M-10 85L530 225M-10 160L530 40M70 -10L140 310M320 -10L420 310" className="about-art-guide" />
      <path d="M98 195H177Q209 195 209 164V134Q209 104 240 104H322Q353 104 353 74V61" className="about-art-route" />
      <circle cx="98" cy="195" r="22" className="about-art-paper" />
      <circle cx="98" cy="195" r="8" className="about-art-solid" />
      <circle cx="353" cy="61" r="22" className="about-art-paper" />
      <path d="M343 61H363M353 51V71" className="about-art-line" />
      <rect x="285" y="157" width="95" height="113" rx="12" className="about-art-paper" />
      <path d="M303 178H362M303 196H346M303 214H355M322 251H345" className="about-art-line" />
      <rect x="116" y="33" width="108" height="67" rx="7" className="about-art-fill" />
      <path d="M135 53H192M135 70H180M157 100V116M143 116H185" className="about-art-line" />
      <circle cx="246" cy="104" r="5" className="about-art-solid" />
    </> : <>
      <ellipse cx="269" cy="157" rx="177" ry="106" className="about-art-guide" />
      <path d="M54 90H167M353 215H465M407 80V123M386 102H429" className="about-art-line" />
      <rect x="104" y="63" width="114" height="163" rx="5" transform="rotate(-10 104 63)" className="about-art-fill" />
      <path d="M159 91H219M154 111H199" className="about-art-guide" />
      <path d="M209 81Q246 73 273 88Q300 73 337 81V239Q300 231 273 246Q246 231 209 239Z" className="about-art-paper" />
      <path d="M273 88V246M225 111H258M225 132H250M225 153H258M289 111H322M289 132H314M289 153H322M289 174H319" className="about-art-line" />
      <circle cx="401" cy="215" r="29" className="about-art-fill" />
      <circle cx="401" cy="215" r="15" className="about-art-line" />
      <circle cx="401" cy="215" r="4" className="about-art-solid" />
    </>}
  </svg>;
}
