import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useReadingFocus } from "./useReadingFocus";

describe("useReadingFocus", () => {
  afterEach(() => {
    Reflect.deleteProperty(document.documentElement, "requestFullscreen");
  });

  it("keeps CSS focus available when native fullscreen is unavailable", async () => {
    const requestFullscreen = vi.fn().mockRejectedValue(new Error("Fullscreen denied"));
    Object.defineProperty(document.documentElement, "requestFullscreen", {
      configurable: true,
      value: requestFullscreen,
    });
    const { result } = renderHook(() => useReadingFocus());

    await act(async () => result.current.enter());

    expect(result.current.active).toBe(true);
    expect(requestFullscreen).toHaveBeenCalledOnce();
  });

  it("leaves focus mode with Escape outside native fullscreen", async () => {
    const requestFullscreen = vi.fn().mockRejectedValue(new Error("Fullscreen denied"));
    Object.defineProperty(document.documentElement, "requestFullscreen", {
      configurable: true,
      value: requestFullscreen,
    });
    const { result } = renderHook(() => useReadingFocus());
    await act(async () => result.current.enter());

    act(() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));

    expect(result.current.active).toBe(false);
  });
  const press = (key: string, init: KeyboardEventInit = {}) =>
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, ...init }));
    });

  /* The mode's only way in was a button in the page header, which a reader has
     to leave the text to reach — the exact interruption focus mode exists to
     remove. These pin the key that replaced it, and the guards that stop it
     firing when it would be unwelcome. */

  it("toggles with f, so entering does not require leaving the text", () => {
    const { result } = renderHook(() => useReadingFocus());

    press("f");
    expect(result.current.active).toBe(true);

    press("f");
    expect(result.current.active).toBe(false);
  });

  it("stays out of the way while the reader is writing", () => {
    const note = document.createElement("textarea");
    document.body.appendChild(note);
    note.focus();

    const { result } = renderHook(() => useReadingFocus());
    press("f");

    // Typing "f" into a private note, or into a question for Minty, must not
    // blank the chrome mid-sentence.
    expect(result.current.active).toBe(false);
    note.remove();
  });

  it("leaves modified keys to the browser", () => {
    const { result } = renderHook(() => useReadingFocus());

    // Cmd/Ctrl+F is find-in-page, which a reader of a 6,000-word chapter needs
    // considerably more than a focus toggle.
    press("f", { metaKey: true });
    expect(result.current.active).toBe(false);
    press("f", { ctrlKey: true });
    expect(result.current.active).toBe(false);
  });
});
