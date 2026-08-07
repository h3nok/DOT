import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authedFetch } from "./orchestratorHttp";

/**
 * Identity is the session cookie. `X-Owner-Id` is the orchestrator's
 * `local_header` development adapter and must not survive into a production
 * build, where the server would refuse that mode anyway.
 */

const capture = () => {
  const spy = vi.fn(
    async (_url: string, _init?: RequestInit) =>
      new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } }),
  );
  vi.stubGlobal("fetch", spy);
  return spy;
};

const initOf = (spy: ReturnType<typeof capture>) => spy.mock.calls[0][1] as RequestInit;
const headersOf = (spy: ReturnType<typeof capture>) =>
  initOf(spy).headers as Record<string, string>;

describe("authedFetch", () => {
  let fetchSpy: ReturnType<typeof capture>;

  beforeEach(() => {
    fetchSpy = capture();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("always sends the session cookie", async () => {
    await authedFetch("/v1/graph/snapshot");

    expect(initOf(fetchSpy).credentials).toBe("include");
  });

  it("asserts a dev owner only in a development build", async () => {
    await authedFetch("/v1/graph/snapshot", { ownerId: "alice" });

    expect(headersOf(fetchSpy)["X-Owner-Id"]).toBe("alice");
  });

  it("never asserts an owner in a production build", async () => {
    vi.stubEnv("DEV", false);

    await authedFetch("/v1/graph/snapshot", { ownerId: "alice" });

    expect(headersOf(fetchSpy)["X-Owner-Id"]).toBeUndefined();
  });

  it("serializes a JSON body with its content type", async () => {
    await authedFetch("/v1/graph/accounts", { method: "POST", json: { handle: "x" } });

    expect(initOf(fetchSpy).body).toBe('{"handle":"x"}');
    expect(headersOf(fetchSpy)["Content-Type"]).toBe("application/json");
  });

  it("sends no body and no content type when there is nothing to send", async () => {
    await authedFetch("/v1/publications/projects");

    expect(initOf(fetchSpy).body).toBeUndefined();
    expect(headersOf(fetchSpy)["Content-Type"]).toBeUndefined();
  });

  it("passes an idempotency key through", async () => {
    await authedFetch("/v1/graph/imports", {
      method: "POST",
      idempotencyKey: "rss:feed",
      json: {},
    });

    expect(headersOf(fetchSpy)["Idempotency-Key"]).toBe("rss:feed");
  });

  it("does not cache authenticated reads", async () => {
    await authedFetch("/v1/publications/projects");

    expect(initOf(fetchSpy).cache).toBe("no-store");
  });
});
