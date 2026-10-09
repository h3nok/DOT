import { act, renderHook, waitFor } from "@testing-library/react";
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

  it.each([true, false])("checks that the browser retained the verified member (retained: %s)", async retained => {
    const member = { id: "fixture-member", display_name: "Fixture", role: "owner", is_owner: true };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ user: null }))
      .mockResolvedValueOnce(Response.json({ user: member }))
      .mockResolvedValueOnce(Response.json({ user: retained ? member : null }));
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let verification;
    await act(async () => {
      verification = await result.current.verifyCode("owner@example.test", "123456");
    });
    expect(fetchMock).toHaveBeenLastCalledWith(expect.stringContaining("/v1/auth/session"), {
      credentials: "include", cache: "no-store",
    });
    if (retained) {
      expect(verification).toEqual({ ok: true, user: member });
      expect(result.current.user).toEqual(member);
    } else {
      expect(verification).toMatchObject({ ok: false, codeAccepted: true });
      expect(result.current.user).toBeNull();
    }
  });
});
