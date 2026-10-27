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
