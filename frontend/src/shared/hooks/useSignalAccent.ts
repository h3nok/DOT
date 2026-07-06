import { useEffect, useState } from "react";

// Single source of truth for the user-selected DOT signal color.
//
// The color is chosen from the home "DOT signal" picker and persisted under
// `dot-graph-accent`. Every surface that wants to adhere to the one selected
// theme color reads it through this hook so the whole app stays in one accent.

export const SIGNAL_ACCENT_STORAGE_KEY = "dot-graph-accent";
export const SIGNAL_ACCENT_EVENT = "dot-signal-accent-change";
export const DEFAULT_SIGNAL_ACCENT = "#00a896";

export const normalizeSignalAccent = (value: string | null | undefined) =>
  value && /^#[0-9a-f]{6}$/i.test(value) ? value : DEFAULT_SIGNAL_ACCENT;

const readSignalAccent = () => {
  if (typeof window === "undefined") return DEFAULT_SIGNAL_ACCENT;
  return normalizeSignalAccent(
    window.localStorage.getItem(SIGNAL_ACCENT_STORAGE_KEY),
  );
};

/** Persist a new signal accent and notify every live subscriber in this tab. */
export const setSignalAccent = (value: string) => {
  if (typeof window === "undefined") return;
  const next = normalizeSignalAccent(value);
  window.localStorage.setItem(SIGNAL_ACCENT_STORAGE_KEY, next);
  window.dispatchEvent(
    new CustomEvent<string>(SIGNAL_ACCENT_EVENT, { detail: next }),
  );
};

/** Read the selected signal accent, staying in sync across tabs and surfaces. */
export const useSignalAccent = (): string => {
  const [accent, setAccent] = useState<string>(readSignalAccent);

  useEffect(() => {
    const handleCustom = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      setAccent(normalizeSignalAccent(detail ?? readSignalAccent()));
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== SIGNAL_ACCENT_STORAGE_KEY) return;
      setAccent(readSignalAccent());
    };

    window.addEventListener(SIGNAL_ACCENT_EVENT, handleCustom);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(SIGNAL_ACCENT_EVENT, handleCustom);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return accent;
};
