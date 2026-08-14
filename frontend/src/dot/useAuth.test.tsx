import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useAuth } from "./useAuth";

describe("useAuth", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns a recoverable error when verification cannot reach the service", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ user: null }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockRejectedValueOnce(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const verification = await result.current.verifyCode(
      "reader@example.com",
      "123456",
    );

    expect(verification).toEqual({
      ok: false,
      error: "Sign-in is temporarily unavailable. Please try again.",
    });
  });
});
