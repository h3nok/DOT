import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { sendMessage, isUnauthenticated } from "./twinChat";

/**
 * The chat client's job is to never leave the member without a reply and never
 * pretend a thread survived when it did not. Both are network-shaped failures,
 * so they are asserted against a stubbed fetch rather than a live orchestrator.
 */

const jsonResponse = (status: number, body: unknown) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as Response;

describe("twinChat.sendMessage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const calls = () => (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;

  it("returns the stored thread when the member has a session", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      jsonResponse(200, {
        conversation: { id: "conv_1", title: "hello", message_count: 2 },
        answer: {
          answer: "Grounded.",
          citations: [{ node_id: "n1", kind: "note", label: "a note" }],
          grounded: true,
          refusal_code: null,
        },
      }),
    );

    const outcome = await sendMessage("hello", null);

    expect(outcome?.ephemeral).toBe(false);
    expect(outcome?.thread?.id).toBe("conv_1");
    expect(outcome?.turn.citations[0].label).toBe("a note");
  });

  it("still answers a visitor with no session, without storing the thread", async () => {
    vi.mocked(globalThis.fetch)
      .mockResolvedValueOnce(jsonResponse(401, { detail: "no session" }))
      .mockResolvedValueOnce(
        jsonResponse(200, {
          answer: "Public answer.",
          citations: [],
          grounded: true,
          refusal_code: null,
        }),
      );

    const outcome = await sendMessage("hello", null);

    expect(outcome?.ephemeral).toBe(true);
    expect(outcome?.turn.content).toBe("Public answer.");
  });

  it("reports a vanished thread rather than retrying into the same 404", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      jsonResponse(404, { detail: "conversation not found" }),
    );

    expect(await sendMessage("hello", "conv_gone")).toBeNull();
    expect(calls()).toHaveLength(1);
  });

  it("continues a thread by id and does not redirect the subject", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      jsonResponse(200, {
        conversation: { id: "conv_1", title: "hello", message_count: 4 },
        answer: { answer: "More.", citations: [], grounded: true, refusal_code: null },
      }),
    );

    await sendMessage("and the second one?", "conv_1");
    const body = JSON.parse(calls()[0][1].body as string);

    expect(body.conversation_id).toBe("conv_1");
    expect(body.owner_id).toBeUndefined();
  });

  it("returns nothing when the service is unreachable", async () => {
    vi.mocked(globalThis.fetch).mockRejectedValue(new Error("offline"));
    expect(await sendMessage("hello", null)).toBeNull();
  });
});

describe("isUnauthenticated", () => {
  it("treats a missing session as a boundary, not a failure", () => {
    expect(isUnauthenticated(401)).toBe(true);
    expect(isUnauthenticated(403)).toBe(true);
    expect(isUnauthenticated(500)).toBe(false);
  });
});
