import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearMarginSession,
  loadMarginSession,
  saveMarginSession,
  streamMarginAnswer,
  type MarginEventEnvelope,
  type MarginTurn,
} from "./marginAgent";

afterEach(() => {
  clearMarginSession();
  vi.restoreAllMocks();
});

describe("The Margin session", () => {
  it("keeps a bounded study session in the browser tab", () => {
    const turns: MarginTurn[] = Array.from({ length: 28 }, (_, index) => ({
      id: `turn-${index}`,
      role: index % 2 ? "lumen" : "reader",
      content: `turn ${index}`,
      citations: [],
    }));

    saveMarginSession(turns);

    expect(loadMarginSession()).toHaveLength(20);
    expect(loadMarginSession()[0].id).toBe("turn-8");
  });
});

describe("The Margin stream", () => {
  it("parses partial SSE frames and sends exact release scope", async () => {
    const frames = [
      'id: 1\nevent: run.started\ndata: {"v":1,"run_id":"run-1","seq":1,"type":"run.started","payload":{}}\n\n',
      'id: 2\nevent: answer.block\ndata: {"v":1,"run_id":"run-1","seq":2,"type":"answer.block","payload":{"index":0,"text":"Grounded."}}\n\n',
      'id: 3\nevent: run.completed\ndata: {"v":1,"run_id":"run-1","seq":3,"type":"run.completed","payload":{"grounded":true}}\n\n',
    ].join("");
    const bytes = new TextEncoder().encode(frames);
    const response = new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(bytes.slice(0, 47));
          controller.enqueue(bytes.slice(47, 129));
          controller.enqueue(bytes.slice(129));
          controller.close();
        },
      }),
      { status: 200, headers: { "Content-Type": "text/event-stream" } },
    );
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(response);
    const events: MarginEventEnvelope[] = [];

    await streamMarginAnswer({
      question: "What is the Canvas?",
      lens: "ground",
      history: [],
      scope: {
        releaseId: "dot-book-one-v2",
        editionSlug: "digital-organism-theory",
        releaseLabel: "Line-edited edition · v2",
        sectionSlug: "the-canvas",
      },
      signal: new AbortController().signal,
      onEvent: (event) => events.push(event),
    });

    expect(events.map((event) => event.type)).toEqual([
      "run.started",
      "answer.block",
      "run.completed",
    ]);
    const request = fetchMock.mock.calls[0][1];
    const body = JSON.parse(String(request?.body));
    expect(body.scope).toMatchObject({
      release_id: "dot-book-one-v2",
      edition_slug: "digital-organism-theory",
      section_slug: "the-canvas",
    });
  });
});
