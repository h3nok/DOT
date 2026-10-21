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
  A2: 110,
  E3: 164.814,
  A3: 220,
  C4: 261.626,
  D4: 293.665,
  E4: 329.628,
  G4: 391.995,
  A4: 440,
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
  if (kind === "bell") {
    // Glassy FM bell: inharmonic 3.5 ratio, index decays quickly.
    const index = 0.9 * Math.exp(-dt / 0.14);
    const env = smoothstep(0, 0.004, dt) * Math.exp(-dt / 0.55);
    return env * Math.sin(TAU * freq * dt + index * Math.sin(TAU * freq * 3.5 * dt));
  }
  if (kind === "thump") {
    const env = smoothstep(0, 0.003, dt) * Math.exp(-dt / 0.11);
    return env * Math.sin(TAU * freq * dt);
  }
  // "blip": short FM pluck, sample-and-hold at 16 kHz for a light digital edge.
  const held = Math.floor(dt * 16000) / 16000;
  const index = 1.4 * Math.exp(-held / 0.018);
  const env = smoothstep(0, 0.002, dt) * Math.exp(-dt / 0.05);
  const raw = Math.sin(TAU * freq * held + index * Math.sin(TAU * freq * 2 * held));
  return env * Math.round(raw * 48) / 48;
}

const VOICE_LENGTH = { bell: 2.6, thump: 0.6, blip: 0.32 };

/**
 * @param {object} options
 * @param {number} options.durationSeconds
 * @param {{ t: number, freq: number, amp?: number, pan?: number, kind?: "blip" | "bell" | "thump" }[]} [options.events]
 * @param {number[]} [options.ticks] keystroke times in seconds
 * @param {number} [options.peak] final peak level (0–1); 0.2 ≈ −14 dBFS
 * @param {string} options.wavPath
 */
export async function writeDigitalScore({ durationSeconds, events = [], ticks = [], peak = 0.2, wavPath }) {
  const length = Math.round(durationSeconds * SAMPLE_RATE);
  const dryL = new Float32Array(length);
  const dryR = new Float32Array(length);
  const sendL = new Float32Array(length);
  const sendR = new Float32Array(length);

  // 1. Low FM drone (A2 + E3), slowly breathing, fading in and out with the piece.
  for (let i = 0; i < length; i++) {
    const t = i / SAMPLE_RATE;
    const env = smoothstep(0, 1.4, t) * (1 - smoothstep(durationSeconds - 1.6, durationSeconds - 0.05, t));
    const breathe = 0.82 + 0.18 * Math.sin(TAU * 0.16 * t);
    const left = 0.55 * Math.sin(TAU * NOTE.A2 * t + 0.3 * Math.sin(TAU * NOTE.A3 * t))
      + 0.3 * Math.sin(TAU * NOTE.E3 * t + 0.22 * Math.sin(TAU * NOTE.E4 * t + 1));
    const right = 0.55 * Math.sin(TAU * (NOTE.A2 + 0.14) * t + 0.3 * Math.sin(TAU * NOTE.A3 * t + 0.4))
      + 0.3 * Math.sin(TAU * (NOTE.E3 - 0.11) * t + 0.22 * Math.sin(TAU * NOTE.E4 * t + 1.3));
    dryL[i] += 0.075 * env * breathe * left;
    dryR[i] += 0.075 * env * breathe * right;
  }

  // 2. Events (blips, bell, thump), equal-power panned, with a send to the echo.
  for (const { t, freq, amp = 1, pan = 0, kind = "blip" } of events) {
    const start = Math.max(0, Math.round(t * SAMPLE_RATE));
    const end = Math.min(length, start + Math.round(VOICE_LENGTH[kind] * SAMPLE_RATE));
    const angle = ((pan + 1) / 2) * (Math.PI / 2);
    const gainL = Math.cos(angle) * amp;
    const gainR = Math.sin(angle) * amp;
    const send = kind === "thump" ? 0 : 0.45;
    for (let i = start; i < end; i++) {
      const value = voice(kind, freq, (i - start) / SAMPLE_RATE);
      dryL[i] += value * gainL;
      dryR[i] += value * gainR;
      sendL[i] += value * gainL * send;
      sendR[i] += value * gainR * send;
    }
  }

  // 3. Keystroke ticks: 4 ms high sine bursts, barely audible, alternating sides.
  ticks.forEach((t, index) => {
    const start = Math.round(t * SAMPLE_RATE);
    const end = Math.min(length, start + Math.round(0.014 * SAMPLE_RATE));
    const freq = 3100 + (index % 3) * 260;
    const side = index % 2 === 0 ? 0.62 : 0.38;
    for (let i = Math.max(0, start); i < end; i++) {
      const dt = (i - start) / SAMPLE_RATE;
      const value = 0.05 * Math.exp(-dt / 0.0026) * Math.sin(TAU * freq * dt);
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

