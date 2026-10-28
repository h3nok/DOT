/* The sound of the words being typed: a short filtered click for each key over a low
   knock, a heavier one for the space bar, and a soft bell when a concept's words are done.
   Nothing here makes a sound until the reader presses Play, and nothing is sustained. */

export type KeystrokeKind = "key" | "space" | "bell";

export interface Keystroke {
  /** Film second at which the key lands. */
  at: number;
  kind: KeystrokeKind;
}

/** Keys closer together than this are heard as one, so fast typing stays a patter. */
const KEY_SPACING_SECONDS = 0.065;

/** The keystrokes in (from, to], from a list sorted by time. */
export function keystrokesBetween(list: readonly Keystroke[], from: number, to: number): Keystroke[] {
  if (to <= from) return [];
  let low = 0;
  let high = list.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (list[mid].at <= from) low = mid + 1;
    else high = mid;
  }
  const found: Keystroke[] = [];
  for (let i = low; i < list.length && list[i].at <= to; i++) found.push(list[i]);
  return found;
}

export class TypewriterSound {
  private context: AudioContext | null = null;
  private output: GainNode | null = null;
  private click: AudioBuffer | null = null;
  private lastKey = -Infinity;

  /** Opens the sound inside the reader's own gesture; browsers refuse sound before one. */
  start() {
    if (typeof window === "undefined" || typeof window.AudioContext !== "function") return;
    if (!this.context) {
      const context = new window.AudioContext();
      const output = context.createGain();
      output.gain.value = 0.3;
      output.connect(context.destination);
      const length = Math.floor(context.sampleRate * 0.06);
      const click = context.createBuffer(1, length, context.sampleRate);
      const samples = click.getChannelData(0);
      for (let i = 0; i < length; i++) samples[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 2;
      this.context = context;
      this.output = output;
      this.click = click;
    }
    void this.context.resume();
  }

  strike(kind: KeystrokeKind) {
    const context = this.context;
    const output = this.output;
    if (!context || !output || !this.click || context.state !== "running") return;
    const now = context.currentTime;
    if (kind === "bell") {
      this.bell(context, output, now);
      return;
    }
    if (now - this.lastKey < KEY_SPACING_SECONDS) return;
    this.lastKey = now;
    const space = kind === "space";

    // The type bar striking the page.
    const bar = context.createBufferSource();
    bar.buffer = this.click;
    bar.playbackRate.value = 0.9 + Math.random() * 0.25;
    const band = context.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = (space ? 1300 : 2600) + Math.random() * 600;
    band.Q.value = 1.4;
    const barGain = context.createGain();
    barGain.gain.setValueAtTime(space ? 0.55 : 0.38 + Math.random() * 0.15, now);
    barGain.gain.exponentialRampToValueAtTime(0.001, now + (space ? 0.06 : 0.035));
    bar.connect(band).connect(barGain).connect(output);
    bar.start(now);
    bar.stop(now + 0.07);

    // The carriage knocking beneath it.
    const knock = context.createOscillator();
    knock.type = "triangle";
    knock.frequency.setValueAtTime(space ? 120 : 170 + Math.random() * 30, now);
    knock.frequency.exponentialRampToValueAtTime(60, now + 0.04);
    const knockGain = context.createGain();
    knockGain.gain.setValueAtTime(space ? 0.26 : 0.14, now);
    knockGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    knock.connect(knockGain).connect(output);
    knock.start(now);
    knock.stop(now + 0.06);
  }

  private bell(context: AudioContext, output: GainNode, now: number) {
    for (const [frequency, level] of [[2093, 0.06], [3136, 0.018], [4186, 0.022]] as const) {
      const tone = context.createOscillator();
      tone.type = "sine";
      tone.frequency.value = frequency;
      const gain = context.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(level, now + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
      tone.connect(gain).connect(output);
      tone.start(now);
      tone.stop(now + 1.15);
    }
  }

  dispose() {
    void this.context?.close();
    this.context = null;
    this.output = null;
    this.click = null;
  }
}
