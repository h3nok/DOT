import { writeFile } from "node:fs/promises";

/**
 * Quiet, deterministic "digital" score shared by the channel videos.
 *
 * Palette: a low FM drone, short FM blips with light sample-and-hold crushing, a
 * glassy FM bell for the brand moment, and near-silent keystroke ticks that follow
 * the on-screen typewriter text. Everything is synthesized from code (no samples,
 * no network) and peak-normalized low so it sits under a voice.
 */

export const SAMPLE_RATE = 48000;

export const NOTE = {
  A1: 55,
  E2: 82.407,
  A2: 110,
  C3: 130.813,
  D3: 146.832,
  E3: 164.814,
  F3: 174.614,
  G3: 195.998,
  A3: 220,
  B3: 246.942,
  C4: 261.626,
  D4: 293.665,
  E4: 329.628,
  F4: 349.228,
  G4: 391.995,
  A4: 440,
  B4: 493.883,
  C5: 523.251,
  D5: 587.33,
  E5: 659.255,
  G5: 783.991,
  A5: 880,
};

const smoothstep = (a, b, x) => {
  const u = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return u * u * (3 - 2 * u);
};

const TAU = Math.PI * 2;

/** One voice for a given event kind; dt is seconds since onset. */
function voice(kind, freq, dt) {
  if (kind === "pad") {
    // Subtle, short, dry low-register warm pulse (no meditation swell).
    const env = smoothstep(0, 0.02, dt) * Math.exp(-dt / 0.18);
    return 0.35 * env * Math.sin(TAU * freq * dt);
  }
  if (kind === "bell") {
    // Dry, muted micro-tick (no ringing bell or singing-bowl resonance).
    const env = smoothstep(0, 0.0015, dt) * Math.exp(-dt / 0.028);
    return 0.3 * env * Math.sin(TAU * freq * dt);
  }
  if (kind === "thump") {
    const env = smoothstep(0, 0.002, dt) * Math.exp(-dt / 0.065);
    return env * Math.sin(TAU * freq * dt);
  }
  // "blip": short dry digital micro-pulse, no musical ringing.
  const env = smoothstep(0, 0.0015, dt) * Math.exp(-dt / 0.024);
  return env * Math.sin(TAU * freq * dt);
}

const VOICE_LENGTH = { pad: 0.45, bell: 0.12, thump: 0.28, blip: 0.1 };

/**
 * @param {object} options
 * @param {number} options.durationSeconds
 * @param {{ t: number, freq: number, amp?: number, pan?: number, kind?: "blip" | "bell" | "thump" | "pad" }[]} [options.events]
 * @param {number[]} [options.ticks] keystroke times in seconds
 * @param {number} [options.peak] final peak level (0–1); 0.12 ≈ −18.4 dBFS
 * @param {boolean} [options.cinematicSilence] when true, keeps background room floor near-silent
 * @param {string} options.wavPath
 */
export async function writeDigitalScore({ durationSeconds, events = [], ticks = [], peak = 0.12, cinematicSilence = false, wavPath }) {
  const length = Math.round(durationSeconds * SAMPLE_RATE);
  const dryL = new Float32Array(length);
  const dryR = new Float32Array(length);
  const sendL = new Float32Array(length);
  const sendR = new Float32Array(length);

  // 1. Whisper-quiet sub-room floor (pure low A1/A2 warmth, no singing-bowl harmonics or meditation drone).
  for (let i = 0; i < length; i++) {
    const t = i / SAMPLE_RATE;
    let env = smoothstep(0, 1.2, t) * (1 - smoothstep(durationSeconds - 1.4, durationSeconds - 0.05, t));
    if (cinematicSilence) {
      const emerge = smoothstep(1.5, 4.0, t);
      const tailFade = 1 - smoothstep(durationSeconds - 2.0, durationSeconds - 0.2, t);
      env = emerge * tailFade * 0.45;
    }
    const left = Math.sin(TAU * NOTE.A1 * t);
    const right = Math.sin(TAU * (NOTE.A1 + 0.08) * t);
    dryL[i] += 0.006 * env * left;
    dryR[i] += 0.006 * env * right;
  }

  // 2. Subtle dry mechanical/frame events (no reverb wash).
  for (const { t, freq, amp = 1, pan = 0, kind = "blip" } of events) {
    const start = Math.max(0, Math.round(t * SAMPLE_RATE));
    const end = Math.min(length, start + Math.round(VOICE_LENGTH[kind] * SAMPLE_RATE));
    const angle = ((pan + 1) / 2) * (Math.PI / 2);
    const gainL = Math.cos(angle) * amp;
    const gainR = Math.sin(angle) * amp;
    for (let i = start; i < end; i++) {
      const value = voice(kind, freq, (i - start) / SAMPLE_RATE);
      dryL[i] += value * gainL;
      dryR[i] += value * gainR;
    }
  }

  // 3. Precision typewriter keystroke ticks: tactile mechanical-digital switch click + soft key-bottom thock.
  ticks.forEach((t, index) => {
    const start = Math.round(t * SAMPLE_RATE);
    const end = Math.min(length, start + Math.round(0.018 * SAMPLE_RATE));
    const clickFreq = 1950 + ((index * 7) % 5) * 145;
    const bodyFreq = 260 + (index % 3) * 28;
    const side = 0.44 + ((index % 4) - 1.5) * 0.06;
    const vel = 0.86 + ((index * 13) % 5) * 0.05;
    for (let i = Math.max(0, start); i < end; i++) {
      const dt = (i - start) / SAMPLE_RATE;
      // Crisp top switch transient (1.8 ms) + damped key body (4.2 ms)
      const switchClick = 0.095 * Math.exp(-dt / 0.0017) * Math.sin(TAU * clickFreq * dt + 0.6 * Math.sin(TAU * clickFreq * 2.3 * dt));
      const keyThock = 0.075 * Math.exp(-dt / 0.0042) * Math.sin(TAU * bodyFreq * dt);
      const value = vel * (switchClick + keyThock);
      dryL[i] += value * (1 - side) * 2;
      dryR[i] += value * side * 2;
    }
  });

  // 4. Ping-pong echo (230 ms) with a darkening one-pole filter in the feedback path.
  const delay = Math.round(0.23 * SAMPLE_RATE);
  const outL = new Float32Array(length);
  const outR = new Float32Array(length);
  let lpL = 0;
  let lpR = 0;
  for (let i = 0; i < length; i++) {
    const fromR = i >= delay ? outR[i - delay] : 0;
    const fromL = i >= delay ? outL[i - delay] : 0;
    lpL += 0.35 * (fromR - lpL);
    lpR += 0.35 * (fromL - lpR);
    outL[i] = sendL[i] + 0.34 * lpL;
    outR[i] = sendR[i] + 0.34 * lpR;
  }

  // 5. Mix, soft-limit, then normalize to a deliberately low peak.
  const mixL = new Float32Array(length);
  const mixR = new Float32Array(length);
  let maximum = 1e-9;
  for (let i = 0; i < length; i++) {
    mixL[i] = Math.tanh(dryL[i] + 0.5 * outL[i]);
    mixR[i] = Math.tanh(dryR[i] + 0.5 * outR[i]);
    maximum = Math.max(maximum, Math.abs(mixL[i]), Math.abs(mixR[i]));
  }
  const gain = peak / maximum;

  const dataBytes = length * 4;
  const buffer = Buffer.alloc(44 + dataBytes);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataBytes, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(2, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 4, 28);
  buffer.writeUInt16LE(4, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataBytes, 40);
  for (let i = 0; i < length; i++) {
    buffer.writeInt16LE(Math.round(Math.max(-1, Math.min(1, mixL[i] * gain)) * 32767), 44 + i * 4);
    buffer.writeInt16LE(Math.round(Math.max(-1, Math.min(1, mixR[i] * gain)) * 32767), 46 + i * 4);
  }
  await writeFile(wavPath, buffer);
}

