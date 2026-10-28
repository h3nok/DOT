export function formatTimecode(seconds: number): string {
  const clamped = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(clamped / 60)).padStart(2, "0")}:${String(clamped % 60).padStart(2, "0")}`;
}

/** A running time as people say it, e.g. "0:16" or "3:01". */
export function formatDuration(seconds: number): string {
  const whole = Math.round(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

/** Smooth 0→1 ramp that starts at `at` and lasts `length` film seconds. */
export const reveal = (t: number, at: number, length = 0.8) => {
  const u = Math.min(1, Math.max(0, (t - at) / length));
  return u * u * (3 - 2 * u);
};

/** One line of a frame's words as it is typed: from `start` to `end`, at `charsPerSecond`. */
export interface TypedLine {
  text: string;
  start: number;
  end: number;
  charsPerSecond: number;
}

export interface LineToType {
  text: string;
  charsPerSecond: number;
  /** Seconds to wait after the line before it. */
  delay?: number;
  /** The line never starts before this second. */
  earliest?: number;
}

/** Types lines one after another, beginning at `start`. */
export function typeInSequence(lines: readonly LineToType[], start: number): TypedLine[] {
  const typed: TypedLine[] = [];
  let at = start;
  for (const { text, charsPerSecond, delay = 0, earliest = 0 } of lines) {
    const begin = Math.max(at + delay, earliest);
    const end = begin + text.length / charsPerSecond;
    typed.push({ text, start: begin, end, charsPerSecond });
    at = end;
  }
  return typed;
}
