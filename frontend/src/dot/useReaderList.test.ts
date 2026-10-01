import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useReaderList } from "./useReaderList";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("reader-list availability", () => {
  it.each([true, false])("preserves the server's explicit availability: %s", async (available) => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ available })),
    );
    const { result } = renderHook(() => useReaderList());

    await waitFor(() => expect(result.current.available).toBe(available));
    expect(result.current.availabilityError).toBeNull();
  });

  it("distinguishes an unreachable service from a closed list", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));
    const { result } = renderHook(() => useReaderList());

    await waitFor(() => expect(result.current.availabilityError).toBe("The service is unreachable."));
    expect(result.current.available).toBe(false);
  });

  it("preserves a server error rather than treating it as closed availability", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ detail: "Reader status is temporarily unavailable." }), {
        status: 503,
      }),
    );
    const { result } = renderHook(() => useReaderList());

    await waitFor(() =>
      expect(result.current.availabilityError).toBe("Reader status is temporarily unavailable."),
    );
    expect(result.current.available).toBe(false);
  });

  it.each([null, {}, { available: "false" }])("rejects malformed availability: %j", async (payload) => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(payload)),
    );
    const { result } = renderHook(() => useReaderList());

    await waitFor(() =>
      expect(result.current.availabilityError).toBe("The reader list returned an unexpected response."),
    );
    expect(result.current.available).toBe(false);
  });
});
