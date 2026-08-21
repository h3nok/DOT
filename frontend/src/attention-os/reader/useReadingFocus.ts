import { useCallback, useEffect, useState } from "react";

export function useReadingFocus() {
  const [active, setActive] = useState(false);

  const enter = useCallback(async () => {
    setActive(true);
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // CSS focus mode remains available when fullscreen is denied.
    }
  }, []);

  const exit = useCallback(async () => {
    setActive(false);
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {
      // The reader has already left the CSS focus state.
    }
  }, []);

  /** True while the reader is typing — a private note, or a question to Minty. */
  const isWriting = (): boolean => {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return false;
    return (
      el.tagName === "INPUT" ||
      el.tagName === "TEXTAREA" ||
      el.isContentEditable === true
    );
  };

  useEffect(() => {
    const syncFullscreen = () => {
      if (!document.fullscreenElement) setActive(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && active && !document.fullscreenElement) {
        setActive(false);
        return;
      }

      // `f` toggles focus. The only way in was a button in the header, which a
      // reader has to leave the page to reach — the exact interruption the mode
      // exists to remove. Guarded so that writing the letter f into a private
      // note or a question does not blank the chrome mid-sentence, and left
      // alone when a modifier is held so browser and OS shortcuts still work.
      if (
        (event.key === "f" || event.key === "F") &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !isWriting()
      ) {
        event.preventDefault();
        if (active) void exit();
        else void enter();
      }
    };

    document.addEventListener("fullscreenchange", syncFullscreen);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreen);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [active, enter, exit]);

  return { active, enter, exit } as const;
}
