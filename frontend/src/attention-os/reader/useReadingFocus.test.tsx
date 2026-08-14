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
});
