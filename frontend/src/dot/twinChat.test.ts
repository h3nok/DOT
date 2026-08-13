import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  clearEphemeralTurns,
  isUnauthenticated,
  listThreads,
  loadEphemeralTurns,
  saveEphemeralTurns,
  sendMessage,
  type TwinTurn,
} from "./twinChat";

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

    const outcome = await sendMessage("hello", null, [], "ground", true);

    expect(outcome?.ephemeral).toBe(false);
    expect(outcome?.thread?.id).toBe("conv_1");
    expect(outcome?.turn.citations[0].label).toBe("a note");
  });

  it("still answers a visitor with no session, without storing the thread", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      jsonResponse(200, {
        answer: "Public answer.",
        citations: [{ node_id: "book-1", kind: "book", label: "Book One" }],
        grounded: true,
        refusal_code: null,
      }),
    );

    const outcome = await sendMessage(
      "What is Little c?",
      null,
      [{ role: "member", content: "Tell me about consciousness." }],
      "test",
      false,
    );

    expect(outcome?.ephemeral).toBe(true);
    expect(outcome?.turn.content).toBe("Public answer.");
    const body = JSON.parse(calls()[0][1].body as string);
    expect(body.owner_id).toBe("henok");
    expect(body.lens).toBe("test");
    expect(body.history).toEqual([
      { role: "member", content: "Tell me about consciousness." },
    ]);
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
        answer: {
          answer: "More.",
          citations: [{ node_id: "book-1", kind: "book", label: "Book One" }],
          grounded: true,
          refusal_code: null,
        },
      }),
    );

    await sendMessage("and the second one?", "conv_1", [], "ground", true);
    const body = JSON.parse(calls()[0][1].body as string);

    expect(body.conversation_id).toBe("conv_1");
    expect(body.owner_id).toBeUndefined();
  });

  it("falls back to the shipped book when the service is unreachable", async () => {
    vi.mocked(globalThis.fetch).mockRejectedValue(new Error("offline"));
    const outcome = await sendMessage(
      "What is a Digital Organism?",
      null,
      [],
      "ground",
      false,
    );
    expect(outcome?.ephemeral).toBe(true);
    expect(outcome?.turn.citations[0].kind).toBe("book");
  });

  it("rejects a substantive server answer with no inspectable source", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      jsonResponse(200, {
        answer: "Trust me.",
        citations: [],
        grounded: true,
        refusal_code: null,
      }),
    );

    const outcome = await sendMessage(
      "What is a Digital Organism?",
      null,
      [],
      "ground",
      false,
    );

    expect(outcome?.turn.content).not.toBe("Trust me.");
    expect(outcome?.turn.citations[0].kind).toBe("book");
  });
});

describe("visitor session continuity", () => {
  const turn: TwinTurn = {
    id: "turn-1",
    role: "member",
    content: "What is Little c?",
    citations: [],
    refusal_code: null,
  };

  afterEach(() => clearEphemeralTurns());

  it("restores and explicitly clears the tab-scoped conversation", () => {
    saveEphemeralTurns([turn]);
    expect(loadEphemeralTurns()).toEqual([turn]);
    clearEphemeralTurns();
    expect(loadEphemeralTurns()).toEqual([]);
  });
});

describe("twinChat.listThreads", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not probe the private thread route for a visitor", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      jsonResponse(200, { user: null }),
    );

    expect(await listThreads()).toEqual({ threads: [], authenticated: false });
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(vi.mocked(globalThis.fetch).mock.calls[0][0]).toContain(
      "/v1/auth/session",
    );
  });

  it("loads private threads only after a session is confirmed", async () => {
    vi.mocked(globalThis.fetch)
      .mockResolvedValueOnce(jsonResponse(200, { user: { id: "member-1" } }))
      .mockResolvedValueOnce(
        jsonResponse(200, {
          conversations: [{ id: "conv-1", title: "A question", message_count: 2 }],
        }),
      );

    const result = await listThreads();

    expect(result.authenticated).toBe(true);
    expect(result.threads[0].id).toBe("conv-1");
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });
});

describe("isUnauthenticated", () => {
  it("treats a missing session as a boundary, not a failure", () => {
    expect(isUnauthenticated(401)).toBe(true);
    expect(isUnauthenticated(403)).toBe(true);
    expect(isUnauthenticated(500)).toBe(false);
  });
});
