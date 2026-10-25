import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { NOTE, writeDigitalScore } from "./channel-digital-audio.mjs";

export const TRAILER_VIDEO = {
  file: "channel-trailer.mp4",
  poster: "splash.png",
  storyboard: "channel-trailer-storyboard.png",
  width: 1920,
  height: 1080,
  fps: 30,
  duration_seconds: 44,
  frames: 1320,
  audio: true,
  audio_codec: "AAC",
  animation_version: 4,
  audio_style: "quiet digital",
  movements: [
    "Why Habits, Headlines & Systems Feel Locked",
    "Book One — A New Model of Reality (T × E → Big C → RF₀ → Little c)",
    "Current Affairs & AMM — Dependence, Extraction, Power & Agency",
    "Three Connected Streams & Four Claim Levels",
    "Read Free at dotheory.org · @dotheory",
  ],
};

export function trailerSourceHash(splashSvg, endCardSvg) {
  return createHash("sha256").update(splashSvg).update(endCardSvg).update(String(TRAILER_VIDEO.animation_version)).digest("hex");
}

export async function loadTrailerVideo(output, splashSvg, endCardSvg) {
  try {
    const metadata = JSON.parse(await readFile(path.join(output, "channel-trailer.json"), "utf8"));
    if (metadata.animation_version !== TRAILER_VIDEO.animation_version) return undefined;
    if (metadata.source_sha256 !== trailerSourceHash(splashSvg, endCardSvg)) return undefined;
    const video = await readFile(path.join(output, TRAILER_VIDEO.file));
    if (metadata.video_sha256 !== createHash("sha256").update(video).digest("hex")) return undefined;
    await readFile(path.join(output, TRAILER_VIDEO.storyboard));
    return metadata;
  } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }
}

export function buildTrailerAnimationDocument(splashSvg) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
    html,body{margin:0;background:#f8fcf9;overflow:hidden}svg{display:block}
  </style></head><body>${splashSvg}<script>
    const svg = document.querySelector("svg");
    const make = (name, attributes = {}) => {
      const element = document.createElementNS(svg.namespaceURI, name);
      for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
      return element;
    };

    const clamp = (v) => Math.max(0, Math.min(1, v));
    const ease = (v) => 1 - Math.pow(1 - clamp(v), 3);
    const inOut = (v) => {
      const u = clamp(v);
      return 0.5 - 0.5 * Math.cos(u * Math.PI);
    };
    const sceneWeight = (t, start, fadeIn, holdEnd, end) => {
      if (t <= start || t >= end) return 0;
      if (t < start + fadeIn) return ease((t - start) / fadeIn);
      if (t <= holdEnd) return 1;
      return 1 - ease((t - holdEnd) / (end - holdEnd));
    };

    const field = svg.querySelector("[data-splash-field]");
    const fieldRingsPath = svg.querySelector("[data-field-rings]");
    const fieldSpokesPath = svg.querySelector("[data-field-spokes]");
    const archStage = svg.querySelector("[data-arch-stage]");
    const archRoot = svg.querySelector("[data-arch-root]");
    const ledgerPanel = svg.querySelector("[data-ledger-panel]");
    const actStage = svg.querySelector("[data-act-stage]");
    const splashLockup = svg.querySelector("[data-splash-lockup]");

    if (ledgerPanel) ledgerPanel.setAttribute("opacity", "0");
    if (actStage) actStage.setAttribute("opacity", "0");
    if (splashLockup) splashLockup.setAttribute("opacity", "0");

    // Studio lighting & soft gallery elevation filters inside SVG defs
    const svgDefs = svg.querySelector("defs");
    if (svgDefs) {
      const cardShadow = make("filter", { id: "trailer-card-shadow", x: "-8%", y: "-8%", width: "116%", height: "118%" });
      cardShadow.innerHTML = \`
        <feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="#062319" flood-opacity="0.08"/>
        <feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#062319" flood-opacity="0.05"/>
      \`;
      const rightStageGlow = make("radialGradient", { id: "trailer-right-glow", cx: "46%", cy: "44%", r: "54%" });
      rightStageGlow.innerHTML = \`
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.92"/>
        <stop offset="48%" stop-color="#e5f7ef" stop-opacity="0.52"/>
        <stop offset="100%" stop-color="#f8fcf9" stop-opacity="0"/>
      \`;
      svgDefs.append(cardShadow, rightStageGlow);
    }

    // Create the dedicated 44-second Channel Trailer overlay root inside the SVG
    const trailerRoot = make("g", { "data-trailer-root": "" });
    svg.append(trailerRoot);

    const renderLeftCard = ({ eyebrow, badgeTop, badgeMain, accent, bgTint, strokeTint, line1, line2, body1, body2, insight, footerLeft, footerRight, stepIndex, totalSteps }) => {
      const dots = Array.from({ length: totalSteps }, (_, i) => {
        const active = i === stepIndex;
        const passed = i < stepIndex;
        const fill = active ? accent : passed ? "#086946" : "#d0e4da";
        const op = active ? "1" : passed ? "0.6" : "0.85";
        return \`<circle cx="\${116 + i * 26}" cy="924" r="\${active ? 7.5 : 5}" fill="\${fill}" opacity="\${op}"/>\`;
      }).join("");
      return \`
        <rect x="64" y="88" width="856" height="904" rx="30" fill="#fbfcf9" fill-opacity="0.97" stroke="\${strokeTint}" stroke-width="2.6" filter="url(#trailer-card-shadow)"/>
        <rect x="64" y="140" width="9" height="800" rx="4.5" fill="\${accent}"/>
        <rect x="108" y="136" width="660" height="44" rx="22" fill="#041a13"/>
        <circle cx="134" cy="158" r="6.5" fill="#2ad89d"/>
        <text x="152" y="164" font-family="JetBrains Mono" font-size="14.5" font-weight="700" letter-spacing="1.8" fill="#e6fbf2">\${eyebrow}</text>

        <rect x="108" y="216" width="204" height="106" rx="20" fill="\${bgTint}" stroke="\${strokeTint}" stroke-width="2.2"/>
        <text x="210" y="254" text-anchor="middle" font-family="JetBrains Mono" font-size="15.5" font-weight="700" letter-spacing="1.8" fill="\${accent}">\${badgeTop}</text>
        <text x="210" y="296" text-anchor="middle" font-family="Space Grotesk" font-size="25" font-weight="700" fill="#041a13">\${badgeMain}</text>

        <text x="334" y="256" font-family="JetBrains Mono" font-size="16" font-weight="700" letter-spacing="1.6" fill="\${accent}">\${footerLeft}</text>
        <text x="334" y="296" font-family="Source Serif 4" font-size="22" font-weight="600" fill="#12382b">\${footerRight}</text>

        <line x1="108" y1="362" x2="876" y2="362" stroke="#d5e6dd" stroke-width="2"/>

        <text x="108" y="450" font-family="Space Grotesk" font-size="52" font-weight="700" letter-spacing="-1.6" fill="#041a13">\${line1}</text>
        <text x="108" y="518" font-family="Space Grotesk" font-size="52" font-weight="700" letter-spacing="-1.6" fill="\${accent}">\${line2}</text>

        <text x="108" y="614" font-family="Source Serif 4" font-size="28.5" font-weight="600" fill="#0c2f23">\${body1}</text>
        <text x="108" y="662" font-family="Source Serif 4" font-size="28.5" font-weight="600" fill="#0c2f23">\${body2}</text>

        <rect x="108" y="732" width="768" height="118" rx="18" fill="\${bgTint}" fill-opacity="0.76" stroke="\${strokeTint}" stroke-width="1.8"/>
        <text x="136" y="774" font-family="JetBrains Mono" font-size="15.5" font-weight="700" letter-spacing="1.8" fill="\${accent}">KEY INSIGHT</text>
        <text x="136" y="816" font-family="Space Grotesk" font-size="21.5" font-weight="700" fill="#041a13">\${insight}</text>

        <line x1="108" y1="888" x2="876" y2="888" stroke="#d5e6dd" stroke-width="1.6"/>
        \${dots}
        <text x="876" y="930" text-anchor="end" font-family="JetBrains Mono" font-size="15.5" font-weight="700" letter-spacing="1.8" fill="#184a38">DIGITAL ORGANISM THEORY · @DOTHEORY</text>
      \`;
    };

    // ── MOVEMENT I (0.0s – 7.4s): THE HOOK — WHY HABITS, HEADLINES & SYSTEMS FEEL LOCKED ──
    const mov1Group = make("g", { opacity: "0" });
    mov1Group.innerHTML = \`
      \${renderLeftCard({
        eyebrow: "DIGITAL ORGANISM THEORY · CHANNEL TRAILER",
        badgeTop: "THE QUESTION",
        badgeMain: "Why?",
        accent: "#086946",
        bgTint: "#eef8f3",
        strokeTint: "#9ed4be",
        line1: "Why Do Habits, Headlines,",
        line2: "& Systems Feel Locked?",
        body1: "What if the rules of reality—and the rules of our economy",
        body2: "and politics—are both frames we can learn to see clearly?",
        insight: "When you can see the rules of a frame, automatic fear loses its grip.",
        footerLeft: "INNER LIFE ↔ PUBLIC LIFE",
        footerRight: "One connected inquiry by Henok Ghebrechristos, PhD",
        stepIndex: 0,
        totalSteps: 6,
      })}
      <g data-mov1-diagram="" transform="translate(1420 540)">
        <circle r="430" fill="url(#trailer-right-glow)"/>
        <circle r="390" fill="#fbfcf9" fill-opacity="0.93" stroke="#b5decb" stroke-width="2.4" filter="url(#trailer-card-shadow)"/>
        <g data-mov1-outer="">
          <circle data-mov1-outer-ring="" r="330" fill="none" stroke="#b5381a" stroke-width="3.2" stroke-dasharray="14 10" opacity="0.84"/>
          <rect x="-230" y="-364" width="460" height="54" rx="27" fill="#fdf3ef" stroke="#e4b4a5" stroke-width="2"/>
          <text x="0" y="-330" text-anchor="middle" font-family="JetBrains Mono" font-size="18" font-weight="700" letter-spacing="1.8" fill="#b5381a">OUTER FRAME · PUBLIC SYSTEMS &amp; POWER</text>
        </g>
        <g data-mov1-inner="">
          <circle data-mov1-inner-ring="" r="215" fill="#eef8f3" fill-opacity="0.76" stroke="#086946" stroke-width="3.4"/>
          <rect x="-205" y="-242" width="410" height="50" rx="25" fill="#ecf8f2" stroke="#9ad2ba" stroke-width="2"/>
          <text x="0" y="-210" text-anchor="middle" font-family="JetBrains Mono" font-size="17.5" font-weight="700" letter-spacing="1.6" fill="#086946">INNER FRAME · CONDITIONING &amp; FEAR</text>
        </g>
        <g data-mov1-core="">
          <circle r="92" fill="#041a13" stroke="#2ad89d" stroke-width="3"/>
          <circle r="18" fill="#2ad89d"/>
          <text x="0" y="8" text-anchor="middle" font-family="Space Grotesk" font-size="28" font-weight="700" fill="#ffffff">Agency</text>
        </g>
        <g data-mov1-pills="">
          <g transform="translate(-270 115)">
            <rect x="-135" y="-38" width="270" height="76" rx="16" fill="#fbfcf9" stroke="#b5decb" stroke-width="2"/>
            <text x="0" y="-6" text-anchor="middle" font-family="Space Grotesk" font-size="23" font-weight="700" fill="#041a13">Book One (DOT)</text>
            <text x="0" y="22" text-anchor="middle" font-family="Source Serif 4" font-size="19" font-weight="600" fill="#086946">A New Model of Reality</text>
          </g>
          <g transform="translate(270 115)">
            <rect x="-135" y="-38" width="270" height="76" rx="16" fill="#fbfcf9" stroke="#e4b4a5" stroke-width="2"/>
            <text x="0" y="-6" text-anchor="middle" font-family="Space Grotesk" font-size="23" font-weight="700" fill="#041a13">The Manifesto (AMM)</text>
            <text x="0" y="22" text-anchor="middle" font-family="Source Serif 4" font-size="19" font-weight="600" fill="#b5381a">Current Affairs &amp; Power</text>
          </g>
          <rect x="-250" y="280" width="500" height="58" rx="29" fill="#041a13"/>
          <text x="0" y="316" text-anchor="middle" font-family="Space Grotesk" font-size="23" font-weight="700" fill="#e6fbf2">Conditioning · Choice · Agency</text>
        </g>
      </g>
    \`;
    trailerRoot.append(mov1Group);

    // ── MOVEMENT II (7.2s – 23.1s): BOOK ONE — A NEW MODEL OF REALITY (3 Sequential Left Cards + Right HeroArchitecture) ──
    const mov2Cards = [
      {
        start: 7200, fadeIn: 480, holdEnd: 12150, end: 12650,
        html: renderLeftCard({
          eyebrow: "PART 01 · BOOK ONE: A NEW MODEL OF REALITY",
          badgeTop: "ACT I",
          badgeMain: "T × E → Big C",
          accent: "#086946",
          bgTint: "#ecf8f2",
          strokeTint: "#9ad2ba",
          line1: "Consciousness Comes First",
          line2: "— Not Matter",
          body1: "From T × E — before and after, and what allows it (speculative) —",
          body2: "Big C emerges, stabilizes, then builds tools: Reality Frames.",
          insight: "Within T × E, Big C is a self-sustaining organism resisting decay (PuE).",
          footerLeft: "CONSCIOUSNESS: A DIGITAL ORGANISM",
          footerRight: "Why awareness is the foundation, not a byproduct",
          stepIndex: 1,
          totalSteps: 6,
        }),
      },
      {
        start: 12450, fadeIn: 480, holdEnd: 17400, end: 17900,
        html: renderLeftCard({
          eyebrow: "PART 01 · BOOK ONE: A NEW MODEL OF REALITY",
          badgeTop: "ACT II",
          badgeMain: "RF₀ World",
          accent: "#9c5108",
          bgTint: "#fcf5ea",
          strokeTint: "#e2bf8d",
          line1: "Our Physical World (RF₀)",
          line2: "Is a Rule-Governed Frame",
          body1: "After testing candidate worlds (RF₁…RFₙ), Big C stabilizes RF₀",
          body2: "so our choices carry lawful, shared consequences in real time.",
          insight: "RF₀ is built with strict laws so autonomous Free Will can mature.",
          footerLeft: "NOT A HOLLOW CLICHÉ · A LAWFUL WORLD",
          footerRight: "Built so Free Will has real stakes and real neighbors",
          stepIndex: 2,
          totalSteps: 6,
        }),
      },
      {
        start: 17700, fadeIn: 480, holdEnd: 22650, end: 23150,
        html: renderLeftCard({
          eyebrow: "PART 01 · BOOK ONE: A NEW MODEL OF REALITY",
          badgeTop: "ACT III",
          badgeMain: "Little c",
          accent: "#0b7a53",
          bgTint: "#eaf8f2",
          strokeTint: "#94d4bc",
          line1: "You Are Little c —",
          line2: "Learning to Choose Together",
          body1: "Inside RF₀, conditioning and fear-gating run our reactions until",
          body2: "we see the Painting, form Intent (I), and choose Cooperation.",
          insight: "Decoupling from fear turns automatic reaction into deliberate agency.",
          footerLeft: "THE PURPOSE OF HUMANITY",
          footerRight: "Living by the rules of RF₀ and with others (c₁ ↔ c₂)",
          stepIndex: 3,
          totalSteps: 6,
        }),
      },
    ].map((spec) => {
      const g = make("g", { opacity: "0" });
      g.innerHTML = spec.html;
      trailerRoot.append(g);
      return { ...spec, el: g };
    });

    // ── MOVEMENT III (22.9s – 32.5s): CURRENT AFFAIRS & THE AMERICAN MILLENNIAL MANIFESTO ──
    const mov3RightDiagram = make("g", { opacity: "0" });
    mov3RightDiagram.innerHTML = \`
      <g transform="translate(1418 540)">
        <rect x="-428" y="-452" width="856" height="904" rx="30" fill="#fbfcf9" fill-opacity="0.97" stroke="#e4b4a5" stroke-width="2.4" filter="url(#trailer-card-shadow)"/>
        <text x="-380" y="-392" font-family="JetBrains Mono" font-size="16" font-weight="700" letter-spacing="2" fill="#b5381a">THE AMERICAN MILLENNIAL MANIFESTO · SYSTEM MAP</text>
        <text x="-380" y="-344" font-family="Space Grotesk" font-size="36" font-weight="700" letter-spacing="-1" fill="#041a13">How Dependence Works — and What Helps</text>

        <g data-amm-step="1" transform="translate(0 -228)">
          <rect x="-380" y="-48" width="760" height="96" rx="18" fill="#fdf3ef" stroke="#e2b0a0" stroke-width="2"/>
          <rect x="-360" y="-28" width="64" height="56" rx="12" fill="#b5381a"/>
          <text x="-328" y="8" text-anchor="middle" font-family="JetBrains Mono" font-size="22" font-weight="700" fill="#ffffff">01</text>
          <text x="-276" y="-8" font-family="Space Grotesk" font-size="27" font-weight="700" fill="#041a13">Economic Dependence</text>
          <text x="-276" y="24" font-family="Source Serif 4" font-size="21" font-weight="600" fill="#5c2212">Housing, debt, healthcare, and wages tighten the margin for error.</text>
        </g>

        <g data-amm-step="2" transform="translate(0 -106)">
          <rect x="-380" y="-48" width="760" height="96" rx="18" fill="#fdf3ef" stroke="#e2b0a0" stroke-width="2"/>
          <rect x="-360" y="-28" width="64" height="56" rx="12" fill="#b5381a"/>
          <text x="-328" y="8" text-anchor="middle" font-family="JetBrains Mono" font-size="22" font-weight="700" fill="#ffffff">02</text>
          <text x="-276" y="-8" font-family="Space Grotesk" font-size="27" font-weight="700" fill="#041a13">Systemic Extraction &amp; Attention Capture</text>
          <text x="-276" y="24" font-family="Source Serif 4" font-size="21" font-weight="600" fill="#5c2212">Dependence becomes recurring payments and captured attention.</text>
        </g>

        <g data-amm-step="3" transform="translate(0 16)">
          <rect x="-380" y="-48" width="760" height="96" rx="18" fill="#fdf3ef" stroke="#e2b0a0" stroke-width="2"/>
          <rect x="-360" y="-28" width="64" height="56" rx="12" fill="#9c5108"/>
          <text x="-328" y="8" text-anchor="middle" font-family="JetBrains Mono" font-size="22" font-weight="700" fill="#ffffff">03</text>
          <text x="-276" y="-8" font-family="Space Grotesk" font-size="27" font-weight="700" fill="#041a13">Concentrated Power &amp; Fear-Gating</text>
          <text x="-276" y="24" font-family="Source Serif 4" font-size="21" font-weight="600" fill="#543008">Fear and habit make the arrangement feel normal.</text>
        </g>

        <g data-amm-step="bridge">
          <path d="M 0 78 V 126" stroke="#086946" stroke-width="4" stroke-dasharray="6 6"/>
          <circle cx="0" cy="102" r="9" fill="#2ad89d" stroke="#041a13" stroke-width="2"/>
        </g>

        <g data-amm-step="4" transform="translate(0 206)">
          <rect x="-380" y="-64" width="760" height="128" rx="22" fill="#eaf8f2" stroke="#086946" stroke-width="3"/>
          <rect x="-356" y="-36" width="72" height="72" rx="16" fill="#086946"/>
          <text x="-320" y="9" text-anchor="middle" font-family="JetBrains Mono" font-size="24" font-weight="700" fill="#ffffff">04</text>
          <text x="-264" y="-14" font-family="Space Grotesk" font-size="30" font-weight="700" fill="#041a13">The Decoupling Shift: Choosing Together</text>
          <text x="-264" y="22" font-family="Source Serif 4" font-size="22" font-weight="600" fill="#0b3b2b">See the pattern · Notice the fear · Choose deliberately, with others.</text>
        </g>

        <rect x="-380" y="346" width="760" height="62" rx="16" fill="#041a13"/>
        <text x="0" y="384" text-anchor="middle" font-family="JetBrains Mono" font-size="18" font-weight="700" letter-spacing="1.6" fill="#e6fbf2">READ FREE · DOTHEORY.ORG/AMM</text>
      </g>
    \`;
    trailerRoot.append(mov3RightDiagram);

    const mov3Cards = [
      {
        start: 22950, fadeIn: 480, holdEnd: 27350, end: 27850,
        html: renderLeftCard({
          eyebrow: "PART 02 · CURRENT AFFAIRS & PUBLIC LIFE (AMM)",
          badgeTop: "AMM I",
          badgeMain: "Extraction",
          accent: "#b5381a",
          bgTint: "#fdf3ef",
          strokeTint: "#e4b4a5",
          line1: "How a System Gets",
          line2: "Inside Us",
          body1: "The American Millennial Manifesto traces how economic dependence",
          body2: "turns into extraction, concentrated power, and everyday exhaustion.",
          insight: "Dependence → Extraction → Power → Cultural myths that normalize it.",
          footerLeft: "THE AMERICAN MILLENNIAL MANIFESTO",
          footerRight: "Connecting headlines, cost of living, and conditioning",
          stepIndex: 4,
          totalSteps: 6,
        }),
      },
      {
        start: 27650, fadeIn: 480, holdEnd: 32000, end: 32500,
        html: renderLeftCard({
          eyebrow: "PART 02 · CURRENT AFFAIRS & PUBLIC LIFE (AMM)",
          badgeTop: "AMM II",
          badgeMain: "Cooperation",
          accent: "#086946",
          bgTint: "#ecf8f2",
          strokeTint: "#9ad2ba",
          line1: "Notice the Fear.",
          line2: "Then Choose Together.",
          body1: "The same discipline that frees the mind from automatic fear",
          body2: "helps people see past division and cooperate on practical things.",
          insight: "Seeing how a system works is the first practical step.",
          footerLeft: "INNER AGENCY ↔ PUBLIC POWER",
          footerRight: "How people see the frame and live differently",
          stepIndex: 5,
          totalSteps: 6,
        }),
      },
    ].map((spec) => {
      const g = make("g", { opacity: "0" });
      g.innerHTML = spec.html;
      trailerRoot.append(g);
      return { ...spec, el: g };
    });

    // ── MOVEMENT IV (32.3s – 38.2s): THREE CONNECTED STREAMS & EPISTEMIC DISCIPLINE ──
    const mov4Group = make("g", { opacity: "0" });
    mov4Group.innerHTML = \`
      <rect x="64" y="76" width="1792" height="206" rx="28" fill="#fbfcf9" fill-opacity="0.97" stroke="#b5decb" stroke-width="2.4" filter="url(#trailer-card-shadow)"/>
      <text x="960" y="136" text-anchor="middle" font-family="JetBrains Mono" font-size="18" font-weight="700" letter-spacing="2.4" fill="#086946">THREE CONNECTED CHANNEL STREAMS · ONE EPISTEMIC CONTRACT</text>
      <text x="960" y="204" text-anchor="middle" font-family="Space Grotesk" font-size="56" font-weight="700" letter-spacing="-1.8" fill="#041a13">What You Will Find on This Channel</text>
      <text x="960" y="252" text-anchor="middle" font-family="Source Serif 4" font-size="27" font-weight="600" fill="#144534">Every episode connects inner consciousness, current affairs, and transparent reasoning.</text>

      <g data-stream-card="1" transform="translate(64 316)">
        <rect width="572" height="516" rx="26" fill="#fbfcf9" fill-opacity="0.97" stroke="#086946" stroke-width="2.6" filter="url(#trailer-card-shadow)"/>
        <rect x="36" y="36" width="140" height="44" rx="22" fill="#ecf8f2" stroke="#9ad2ba" stroke-width="1.8"/>
        <text x="106" y="64" text-anchor="middle" font-family="JetBrains Mono" font-size="16" font-weight="700" fill="#086946">STREAM 01</text>
        <text x="36" y="142" font-family="Space Grotesk" font-size="40" font-weight="700" letter-spacing="-1.2" fill="#041a13">A New Model</text>
        <text x="36" y="190" font-family="Space Grotesk" font-size="40" font-weight="700" letter-spacing="-1.2" fill="#086946">of Reality</text>
        <text x="36" y="256" font-family="Source Serif 4" font-size="26" font-weight="600" fill="#12382b">Book One — Consciousness: A Digital</text>
        <text x="36" y="294" font-family="Source Serif 4" font-size="26" font-weight="600" fill="#12382b">Organism. Why consciousness comes</text>
        <text x="36" y="332" font-family="Source Serif 4" font-size="26" font-weight="600" fill="#12382b">first, how RF₀ works, and how</text>
        <text x="36" y="370" font-family="Source Serif 4" font-size="26" font-weight="600" fill="#12382b">deliberate choice overcomes fear.</text>
        <text x="36" y="468" font-family="JetBrains Mono" font-size="17" font-weight="700" letter-spacing="1.5" fill="#086946">T × E · BIG C · RF₀ · LITTLE C</text>
      </g>

      <g data-stream-card="2" transform="translate(674 316)">
        <rect width="572" height="516" rx="26" fill="#fbfcf9" fill-opacity="0.97" stroke="#b5381a" stroke-width="2.6" filter="url(#trailer-card-shadow)"/>
        <rect x="36" y="36" width="140" height="44" rx="22" fill="#fdf3ef" stroke="#e4b4a5" stroke-width="1.8"/>
        <text x="106" y="64" text-anchor="middle" font-family="JetBrains Mono" font-size="16" font-weight="700" fill="#b5381a">STREAM 02</text>
        <text x="36" y="142" font-family="Space Grotesk" font-size="40" font-weight="700" letter-spacing="-1.2" fill="#041a13">Current Affairs</text>
        <text x="36" y="190" font-family="Space Grotesk" font-size="40" font-weight="700" letter-spacing="-1.2" fill="#b5381a">&amp; Public Life</text>
        <text x="36" y="256" font-family="Source Serif 4" font-size="26" font-weight="600" fill="#12382b">The American Millennial Manifesto.</text>
        <text x="36" y="294" font-family="Source Serif 4" font-size="26" font-weight="600" fill="#12382b">How dependence becomes extraction,</text>
        <text x="36" y="332" font-family="Source Serif 4" font-size="26" font-weight="600" fill="#12382b">how power protects itself, and how</text>
        <text x="36" y="370" font-family="Source Serif 4" font-size="26" font-weight="600" fill="#12382b">citizens build real cooperation.</text>
        <text x="36" y="468" font-family="JetBrains Mono" font-size="17" font-weight="700" letter-spacing="1.5" fill="#b5381a">DEPENDENCE · EXTRACTION · AGENCY</text>
      </g>

      <g data-stream-card="3" transform="translate(1284 316)">
        <rect width="572" height="516" rx="26" fill="#fbfcf9" fill-opacity="0.97" stroke="#9c5108" stroke-width="2.6" filter="url(#trailer-card-shadow)"/>
        <rect x="36" y="36" width="140" height="44" rx="22" fill="#fcf5ea" stroke="#e2bf8d" stroke-width="1.8"/>
        <text x="106" y="64" text-anchor="middle" font-family="JetBrains Mono" font-size="16" font-weight="700" fill="#9c5108">STREAM 03</text>
        <text x="36" y="142" font-family="Space Grotesk" font-size="40" font-weight="700" letter-spacing="-1.2" fill="#041a13">Epistemic</text>
        <text x="36" y="190" font-family="Space Grotesk" font-size="40" font-weight="700" letter-spacing="-1.2" fill="#9c5108">Discipline</text>
        <text x="36" y="256" font-family="Source Serif 4" font-size="26" font-weight="600" fill="#12382b">No guru claims or hidden premises.</text>
        <text x="36" y="294" font-family="Source Serif 4" font-size="26" font-weight="600" fill="#12382b">Every argument separates:</text>
        <text x="36" y="338" font-family="Space Grotesk" font-size="24" font-weight="700" fill="#041a13">• Observation   • External Model</text>
        <text x="36" y="376" font-family="Space Grotesk" font-size="24" font-weight="700" fill="#041a13">• DOT Derivation • Speculative</text>
        <text x="36" y="468" font-family="JetBrains Mono" font-size="17" font-weight="700" letter-spacing="1.5" fill="#9c5108">OPEN INQUIRY · FALSIFIABLE</text>
      </g>

      <rect x="64" y="868" width="1792" height="128" rx="24" fill="#041a13" filter="url(#trailer-card-shadow)"/>
      <text x="960" y="924" text-anchor="middle" font-family="Space Grotesk" font-size="32" font-weight="700" fill="#ffffff">Digital Organism Theory  ·  Henok Ghebrechristos, PhD</text>
      <text x="960" y="968" text-anchor="middle" font-family="JetBrains Mono" font-size="20" font-weight="700" letter-spacing="2" fill="#2ad89d">YOUTUBE.COM/@DOTHEORY   ·   DOTHEORY.ORG</text>
    \`;
    trailerRoot.append(mov4Group);

    // ── MOVEMENT V (38.0s – 44.0s): FINALE COLOPHON LOCKUP ──
    const mov5Group = make("g", { opacity: "0" });
    mov5Group.innerHTML = \`
      <rect x="290" y="180" width="1340" height="156" rx="26" fill="#fbfcf9" fill-opacity="0.97" stroke="#b5decb" stroke-width="2.4" filter="url(#trailer-card-shadow)"/>
      <text x="960" y="232" text-anchor="middle" font-family="JetBrains Mono" font-size="19" font-weight="700" letter-spacing="2.8" fill="#086946">CONTINUE THE INQUIRY AT YOUR OWN PACE</text>
      <text x="960" y="302" text-anchor="middle" font-family="Space Grotesk" font-size="64" font-weight="700" letter-spacing="-2" fill="#041a13">Read the full work &amp; inspect the sources.</text>

      <rect x="136" y="380" width="796" height="390" rx="28" fill="#fbfcf9" fill-opacity="0.97" stroke="#086946" stroke-width="2.8" filter="url(#trailer-card-shadow)"/>
      <text x="200" y="454" font-family="JetBrains Mono" font-size="18" font-weight="700" letter-spacing="2" fill="#086946">BOOK ONE · A NEW MODEL OF REALITY</text>
      <text x="200" y="528" font-family="Space Grotesk" font-size="44" font-weight="700" letter-spacing="-1.2" fill="#041a13">Consciousness: A Digital Organism</text>
      <text x="200" y="592" font-family="Source Serif 4" font-size="28" font-weight="600" fill="#12382b">Why consciousness comes first, how our world (RF₀)</text>
      <text x="200" y="634" font-family="Source Serif 4" font-size="28" font-weight="600" fill="#12382b">is structured, and how deliberate agency works.</text>
      <text x="200" y="716" font-family="JetBrains Mono" font-size="20" font-weight="700" letter-spacing="1.6" fill="#086946">DOTHEORY.ORG/BOOK/DIGITAL-ORGANISM-THEORY</text>

      <rect x="988" y="380" width="796" height="390" rx="28" fill="#fbfcf9" fill-opacity="0.97" stroke="#b5381a" stroke-width="2.8" filter="url(#trailer-card-shadow)"/>
      <text x="1052" y="454" font-family="JetBrains Mono" font-size="18" font-weight="700" letter-spacing="2" fill="#b5381a">CURRENT AFFAIRS · APPLIED INQUIRY</text>
      <text x="1052" y="528" font-family="Space Grotesk" font-size="44" font-weight="700" letter-spacing="-1.2" fill="#041a13">The American Millennial Manifesto</text>
      <text x="1052" y="592" font-family="Source Serif 4" font-size="28" font-weight="600" fill="#12382b">How economic dependence becomes extraction, how</text>
      <text x="1052" y="634" font-family="Source Serif 4" font-size="28" font-weight="600" fill="#12382b">power protects itself, and how people live differently.</text>
      <text x="1052" y="716" font-family="JetBrains Mono" font-size="20" font-weight="700" letter-spacing="1.6" fill="#b5381a">DOTHEORY.ORG/AMM</text>

      <rect x="136" y="814" width="1648" height="168" rx="24" fill="#041a13" filter="url(#trailer-card-shadow)"/>
      <text x="960" y="876" text-anchor="middle" font-family="JetBrains Mono" font-size="18" font-weight="700" letter-spacing="2.2" fill="#2ad89d">OBSERVATION  ·  EXTERNAL MODEL  ·  DOT DERIVATION  ·  SPECULATIVE EXTENSION</text>
      <text x="960" y="942" text-anchor="middle" font-family="Space Grotesk" font-size="38" font-weight="700" fill="#ffffff">Digital Organism Theory  ·  Henok Ghebrechristos, PhD  ·  @dotheory  ·  dotheory.org</text>
    \`;
    trailerRoot.append(mov5Group);

    // Living background field parameters
    const FIELD_W = 1920;
    const FIELD_H = 1080;
    const FIELD_CX = 1396;
    const FIELD_CY = 540;
    const FIELD_CORE = Math.min(FIELD_W, FIELD_H) * 0.047;
    const FIELD_SPOKES = 96;
    const FIELD_RINGS = 30;
    const FIELD_EXTENT = Math.hypot(FIELD_W, FIELD_H);

    const updateLivingField = (time) => {
      if (!fieldRingsPath || !fieldSpokesPath) return;
      const motionEnv = Math.sin(Math.PI * clamp(time / 44000));
      const grid = Array.from({ length: FIELD_RINGS }, (_, ring) => {
        const progress = ring / (FIELD_RINGS - 1);
        const baseRadius = FIELD_CORE * 1.2 * Math.pow(FIELD_EXTENT / (FIELD_CORE * 1.2), progress);
        const power = 2 + 5 * Math.pow(progress, 3);
        const radialRipple = motionEnv * 16 * Math.sin(ring * 0.5 - time * 0.0028);
        const angleTwist = motionEnv * 0.042 * Math.sin(ring * 0.22 - time * 0.0016);
        return Array.from({ length: FIELD_SPOKES }, (_, spoke) => {
          const baseAngle = (spoke / FIELD_SPOKES) * Math.PI * 2;
          const spokeRipple = motionEnv * 6.5 * Math.cos(spoke * 0.25 + time * 0.002);
          const angle = baseAngle + angleTwist * (1 - 0.35 * progress);
          const c = Math.cos(angle);
          const s = Math.sin(angle);
          const stretch = 1 / Math.pow(Math.pow(Math.abs(c), power) + Math.pow(Math.abs(s), power), 1 / power);
          const r = Math.max(12, baseRadius + radialRipple + spokeRipple);
          return {
            x: FIELD_CX + r * c * stretch,
            y: FIELD_CY + r * s * stretch,
          };
        });
      });
      const pt = (p) => p.x.toFixed(1) + " " + p.y.toFixed(1);
      fieldRingsPath.setAttribute("d", grid.map((ring) => "M" + ring.map(pt).join("L") + "Z").join(""));
      fieldSpokesPath.setAttribute("d", grid[0].map((_, s) => "M" + grid.map((ring) => pt(ring[s])).join("L")).join(""));
    };

    // Sub-elements inside mov1Group for progressive reveal & breathing (0ms - 7400ms)
    const mov1Outer = mov1Group.querySelector("[data-mov1-outer]");
    const mov1OuterRing = mov1Group.querySelector("[data-mov1-outer-ring]");
    const mov1Inner = mov1Group.querySelector("[data-mov1-inner]");
    const mov1InnerRing = mov1Group.querySelector("[data-mov1-inner-ring]");
    const mov1Core = mov1Group.querySelector("[data-mov1-core]");
    const mov1Pills = mov1Group.querySelector("[data-mov1-pills]");

    // Sub-elements inside archRoot for progressive reveal during Movement II (7200ms - 23150ms)
    const teGroup = [
      archRoot?.querySelector("[data-te-wash]"),
      archRoot?.querySelector("[data-te-boundary]"),
      archRoot?.querySelector("[data-te-contours]"),
      archRoot?.querySelector("[data-label='te']"),
    ];
    const bigCGroup = [
      archRoot?.querySelector("[data-big-c-body]"),
      archRoot?.querySelector("[data-big-c-details]"),
      archRoot?.querySelector("[data-label='big-c']"),
      archRoot?.querySelector("[data-loop='outer']"),
      ...(archRoot ? [...archRoot.querySelectorAll("[data-big-c-node]")] : []),
      ...(archRoot ? [...archRoot.querySelectorAll("[data-rfn-body]")] : []),
    ];
    const rf0Group = [
      archRoot?.querySelector("[data-rf0-body]"),
      archRoot?.querySelector("[data-rf0-polar]"),
      archRoot?.querySelector("[data-rf0-axes]"),
      archRoot?.querySelector("[data-label='rf0']"),
    ];
    const littleCGroup = [
      archRoot?.querySelector("[data-arch='little-c']"),
      archRoot?.querySelector("[data-label='little-c']"),
      archRoot?.querySelector("[data-loop='inner']"),
      archRoot?.querySelector("[data-label='awareness']"),
    ];

    // Sub-elements inside mov3RightDiagram for progressive step illumination (22950ms - 32500ms)
    const ammStep1 = mov3RightDiagram.querySelector("[data-amm-step='1']");
    const ammStep2 = mov3RightDiagram.querySelector("[data-amm-step='2']");
    const ammStep3 = mov3RightDiagram.querySelector("[data-amm-step='3']");
    const ammBridge = mov3RightDiagram.querySelector("[data-amm-step='bridge']");
    const ammStep4 = mov3RightDiagram.querySelector("[data-amm-step='4']");

    // Sub-elements inside mov4Group for staggered stream reveal (32300ms - 38200ms)
    const streamCard1 = mov4Group.querySelector("[data-stream-card='1']");
    const streamCard2 = mov4Group.querySelector("[data-stream-card='2']");
    const streamCard3 = mov4Group.querySelector("[data-stream-card='3']");

    const setGroupOpacity = (els, op) => {
      const val = op.toFixed(3);
      for (const el of els) {
        if (el) el.style.opacity = val;
      }
    };

    window.seekTrailer = async (milliseconds) => {
      const time = Math.max(0, Math.min(${TRAILER_VIDEO.duration_seconds * 1000}, milliseconds));
      updateLivingField(time);

      // 1. Movement I (0ms - 7400ms): Progressive Hook Diagram
      const w1 = sceneWeight(time, 0, 480, 6900, 7400);
      mov1Group.setAttribute("opacity", w1.toFixed(3));
      mov1Group.setAttribute("transform", \`translate(0 \${((1 - w1) * 14).toFixed(1)})\`);
      if (w1 > 0) {
        if (mov1Outer) mov1Outer.style.opacity = ease((time - 240) / 620).toFixed(3);
        if (mov1OuterRing) mov1OuterRing.style.strokeDashoffset = String((-time * 0.018).toFixed(2));
        if (mov1Inner) mov1Inner.style.opacity = ease((time - 780) / 620).toFixed(3);
        if (mov1InnerRing) mov1InnerRing.setAttribute("r", (215 + 3.5 * Math.sin(time * 0.0028)).toFixed(2));
        if (mov1Core) mov1Core.style.opacity = ease((time - 1320) / 620).toFixed(3);
        if (mov1Pills) mov1Pills.style.opacity = ease((time - 1860) / 680).toFixed(3);
      }

      // 2. Movement II (7200ms - 23150ms): Book One HeroArchitecture on the right + 3 sequential cards on the left
      const w2 = sceneWeight(time, 7200, 520, 22650, 23150);
      if (archStage) {
        archStage.setAttribute("opacity", w2.toFixed(3));
      }
      if (archRoot && w2 > 0) {
        const camScale = 1.24 + 0.07 * Math.sin(clamp((time - 7200) / 15950) * Math.PI);
        archRoot.setAttribute("transform", \`translate(1396 540) scale(\${camScale.toFixed(4)}) translate(-348 -352)\`);
        setGroupOpacity(teGroup, ease((time - 7280) / 650));
        setGroupOpacity(bigCGroup, ease((time - 7980) / 860));
        setGroupOpacity(rf0Group, ease((time - 12550) / 860));
        setGroupOpacity(littleCGroup, ease((time - 17800) / 920));
      }

      for (const card of mov2Cards) {
        const cw = sceneWeight(time, card.start, card.fadeIn, card.holdEnd, card.end);
        card.el.setAttribute("opacity", cw.toFixed(3));
        card.el.setAttribute("transform", \`translate(0 \${((1 - cw) * 14).toFixed(1)})\`);
      }

      // 3. Movement III (22950ms - 32500ms): AMM & Current Affairs with progressive step illumination
      const w3 = sceneWeight(time, 22950, 500, 32000, 32500);
      mov3RightDiagram.setAttribute("opacity", w3.toFixed(3));
      mov3RightDiagram.setAttribute("transform", \`translate(0 \${((1 - w3) * 14).toFixed(1)})\`);
      if (w3 > 0) {
        const coopShift = ease((time - 27650) / 680);
        const s1 = ease((time - 23150) / 560) * (1 - 0.22 * coopShift);
        const s2 = ease((time - 23650) / 560) * (1 - 0.22 * coopShift);
        const s3 = ease((time - 24150) / 560) * (1 - 0.22 * coopShift);
        const s4 = 0.26 * ease((time - 24650) / 560) + 0.74 * coopShift;
        if (ammStep1) ammStep1.style.opacity = s1.toFixed(3);
        if (ammStep2) ammStep2.style.opacity = s2.toFixed(3);
        if (ammStep3) ammStep3.style.opacity = s3.toFixed(3);
        if (ammBridge) ammBridge.style.opacity = s4.toFixed(3);
        if (ammStep4) ammStep4.style.opacity = s4.toFixed(3);
      }
      for (const card of mov3Cards) {
        const cw = sceneWeight(time, card.start, card.fadeIn, card.holdEnd, card.end);
        card.el.setAttribute("opacity", cw.toFixed(3));
        card.el.setAttribute("transform", \`translate(0 \${((1 - cw) * 14).toFixed(1)})\`);
      }

      // 4. Movement IV (32300ms - 38200ms): 3 Channel Streams & Epistemic Contract
      const w4 = sceneWeight(time, 32300, 520, 37700, 38200);
      mov4Group.setAttribute("opacity", w4.toFixed(3));
      mov4Group.setAttribute("transform", \`translate(0 \${((1 - w4) * 14).toFixed(1)})\`);
      if (w4 > 0) {
        if (streamCard1) streamCard1.style.opacity = ease((time - 32450) / 540).toFixed(3);
        if (streamCard2) streamCard2.style.opacity = ease((time - 32820) / 540).toFixed(3);
        if (streamCard3) streamCard3.style.opacity = ease((time - 33190) / 540).toFixed(3);
      }

      // 5. Movement V (38000ms - 44000ms): Finale Colophon Lockup (holds at opacity 1 through frame 1319)
      const w5 = time < 38000 ? 0 : ease((time - 38000) / 680);
      mov5Group.setAttribute("opacity", w5.toFixed(3));
      mov5Group.setAttribute("transform", \`translate(0 \${((1 - w5) * 14).toFixed(1)})\`);

      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    };
  </script></body></html>`;
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "ignore", "pipe"] });
    let log = "";
    child.stderr.on("data", (chunk) => { log += chunk; });
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolve(log) : reject(new Error(`${command} exited ${code}: ${log.slice(-4000)}`)));
  });
}

/** Quiet digital score: a blip motif at each movement, a sonic-logo bell at the finale. */
function trailerScore() {
  const motif = (t, notes, pan = 0) => notes.map((freq, index) => ({ t: t + index * 0.08, freq, amp: 0.42 - index * 0.04, pan: pan + (index - 1) * 0.25 }));
  return {
    durationSeconds: TRAILER_VIDEO.duration_seconds,
    events: [
      { t: 0.3, freq: NOTE.A3, amp: 0.5 },
      ...motif(7.25, [NOTE.A4, NOTE.C5, NOTE.E5], -0.1),
      ...motif(12.55, [NOTE.D5, NOTE.E5, NOTE.G5], 0.1),
      { t: 12.55, freq: NOTE.A1, amp: 0.6, kind: "thump" },
      ...motif(17.8, [NOTE.E5, NOTE.G5, NOTE.A5], 0),
      ...motif(23.05, [NOTE.A3, NOTE.C4, NOTE.E4], -0.1),
      ...motif(27.75, [NOTE.C5, NOTE.E5, NOTE.G5], 0.1),
      ...motif(32.45, [NOTE.E4, NOTE.G4, NOTE.A4], 0),
      { t: 38.15, freq: NOTE.E5, amp: 0.55, pan: -0.1, kind: "bell" },
      { t: 38.39, freq: NOTE.A5, amp: 0.5, pan: 0.1, kind: "bell" },
    ],
  };
}

export async function renderTrailerVideo({ page, splashSvg, endCardSvg, output, ffmpeg = "ffmpeg" }) {
  try {
    await run(ffmpeg, ["-version"]);
  } catch (error) {
    throw new Error("Trailer export needs FFmpeg with libx264.", { cause: error });
  }
  const temporary = await mkdtemp(path.join(os.tmpdir(), "dot-channel-trailer-"));
  try {
    await mkdir(output, { recursive: true });
    await page.setViewportSize({ width: TRAILER_VIDEO.width, height: TRAILER_VIDEO.height });
    await page.setContent(buildTrailerAnimationDocument(splashSvg));
    await page.evaluate(async () => {
      await document.fonts.ready;
      for (const spec of [
        '500 30px "Space Grotesk"',
        '700 30px "Space Grotesk"',
        '400 30px "Source Serif 4"',
        '600 30px "Source Serif 4"',
        'italic 400 30px "Source Serif 4"',
        '400 30px "JetBrains Mono"',
        '700 30px "JetBrains Mono"',
      ]) {
        const faces = await document.fonts.load(spec);
        if (!faces.length) throw new Error(`Trailer font failed to load: ${spec}`);
      }
    });

    // 8 keyframes spanning the 44-second arc: 3.0s, 9.6s, 15.0s, 20.4s, 25.4s, 30.0s, 35.4s, 41.6s
    const sampleFrames = new Set([90, 288, 450, 612, 762, 900, 1062, 1248]);
    const checkpoints = new Map();

    for (let frame = 0; frame < TRAILER_VIDEO.frames; frame++) {
      await page.evaluate((milliseconds) => window.seekTrailer(milliseconds), (frame * 1000) / TRAILER_VIDEO.fps);
      const framePath = path.join(temporary, `${String(frame).padStart(4, "0")}.jpg`);
      await page.screenshot({ path: framePath, type: "jpeg", quality: 96, animations: "allow" });
      if (sampleFrames.has(frame)) {
        checkpoints.set(frame, framePath);
      }
    }

    const wavPath = path.join(temporary, "channel-trailer.wav");
    await writeDigitalScore({ ...trailerScore(), wavPath });
    const encoded = path.join(temporary, TRAILER_VIDEO.file);

    await run(ffmpeg, [
      "-hide_banner", "-loglevel", "error", "-y", "-framerate", String(TRAILER_VIDEO.fps),
      "-i", path.join(temporary, "%04d.jpg"),
      "-i", wavPath,
      "-frames:v", String(TRAILER_VIDEO.frames),
      "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p",
      "-c:v", "libx264", "-threads", "2", "-preset", "medium", "-crf", "18", "-profile:v", "high",
      "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
      "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-shortest",
      "-movflags", "+faststart", encoded,
    ]);

    const decoded = await run(ffmpeg, ["-hide_banner", "-i", encoded, "-f", "null", "-"]);
    assert.match(decoded, /Video: h264/);
    assert.match(decoded, /1920x1080/);
    assert.match(decoded, /30 fps/);
    assert.ok(decoded.includes("Duration: 00:00:44.00"));
    assert.match(decoded, /frame=\s*1320\b/);
    assert.match(decoded, /Audio: aac/);

    const thumbEntries = [];
    for (const [frame, srcPath] of checkpoints) {
      const thumbPath = path.join(temporary, `thumb-${String(frame).padStart(4, "0")}.png`);
      await run(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", "-i", srcPath, "-vf", "scale=480:270:flags=lanczos", thumbPath]);
      const thumbPng = await readFile(thumbPath);
      thumbEntries.push([frame, thumbPng]);
    }
    const frames = thumbEntries.map(([frame, png]) => `<figure><img src="data:image/png;base64,${png.toString("base64")}"><figcaption>${(frame / TRAILER_VIDEO.fps).toFixed(1)}s</figcaption></figure>`).join("");
    const styles = splashSvg.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? "";
    await page.setViewportSize({ width: 1920, height: 620 });
    await page.setContent(`<!doctype html><html><head><style>${styles}
      html,body{margin:0;background:#f8f7f2;color:#041a13;font:700 20px "Space Grotesk",sans-serif}
      main{display:grid;grid-template-columns:repeat(4,480px)}figure{margin:0}img{display:block;width:480px;height:270px}figcaption{height:40px;padding:8px 20px;box-sizing:border-box}
    </style></head><body><main>${frames}</main></body></html>`);
    await page.evaluate(async () => {
      await document.fonts.ready;
      for (const image of document.images) {
        await image.decode();
      }
    });
    await page.screenshot({ path: path.join(output, TRAILER_VIDEO.storyboard) });
    await copyFile(encoded, path.join(output, TRAILER_VIDEO.file));

    const metadata = {
      ...TRAILER_VIDEO,
      codec: "H.264",
      source_sha256: trailerSourceHash(splashSvg, endCardSvg),
      video_sha256: createHash("sha256").update(await readFile(encoded)).digest("hex"),
    };
    await writeFile(path.join(output, "channel-trailer.json"), `${JSON.stringify(metadata, null, 2)}\n`);
    console.log(`channel trailer: ${metadata.width}x${metadata.height}, ${metadata.fps} fps, ${metadata.duration_seconds}s, ${metadata.frames} decoded frames, H.264 MP4 + AAC 48kHz stereo audio`);
    return metadata;
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

