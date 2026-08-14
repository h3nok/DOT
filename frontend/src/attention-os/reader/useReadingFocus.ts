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

  useEffect(() => {
    const syncFullscreen = () => {
      if (!document.fullscreenElement) setActive(false);
    };
    const leaveWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && active && !document.fullscreenElement) {
        setActive(false);
      }
    };

    document.addEventListener("fullscreenchange", syncFullscreen);
    document.addEventListener("keydown", leaveWithEscape);
    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreen);
      document.removeEventListener("keydown", leaveWithEscape);
    };
  }, [active]);

  return { active, enter, exit } as const;
}
