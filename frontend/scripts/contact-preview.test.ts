import { EventEmitter } from "node:events";
import { describe, expect, it, vi } from "vitest";

// Config generation is independent of Vite's filesystem environment loader.
vi.mock("vite", () => ({ loadEnv: vi.fn() }));
// @ts-expect-error -- plain ESM shared with Vite's configuration.
import { contactPreviewConfig } from "./contact-preview.mjs";

const target = "https://contact.example";

describe("explicit live contact preview", () => {
  it("stays off by default and cannot be enabled in production builds", () => {
    for (const config of [contactPreviewConfig("serve"), contactPreviewConfig("build", target)]) {
      expect(config.server).toBeUndefined();
      expect(config.define["import.meta.env.VITE_CONTACT_PREVIEW"]).toBe('"false"');
    }
  });

  it("accepts only an HTTPS origin with no credentials or extra destination", () => {
    for (const invalid of ["http://contact.example", "https://user:password@contact.example", `${target}/private`, `${target}?token=test`, `${target}#private`]) {
      expect(() => contactPreviewConfig("serve", invalid)).toThrow();
    }
  });

  it("routes only public status and submission, never private inbox or auth", () => {
    const config = contactPreviewConfig("serve", target);
    const rule = Object.keys(config.server.proxy)[0];
    const proxy = config.server.proxy[rule];
    const match = new RegExp(rule);
    for (const path of ["status", "messages"]) {
      expect(match.test(`/__dot-contact/v1/contact/${path}`)).toBe(true);
      expect(proxy.rewrite(`/__dot-contact/v1/contact/${path}`)).toBe(`/v1/contact/${path}`);
    }
    for (const path of ["/__dot-contact/v1/contact/inbox", "/__dot-contact/v1/auth/session", "/__dot-contact/v1/contact/messages/../inbox", "/__dot-contact/v1/contact/messages%2finbox"]) {
      expect(match.test(path)).toBe(false);
    }
    expect(proxy.target).toBe(target);
  });

  it("strips session credentials while preserving the submission reference", () => {
    const config = contactPreviewConfig("serve", target);
    const proxy = config.server.proxy[Object.keys(config.server.proxy)[0]];
    const events = new EventEmitter();
    proxy.configure(events);
    const headers = new Map([
      ["cookie", "local-session=test"], ["authorization", "Bearer local-token"],
      ["idempotency-key", "test-submission-reference"], ["content-type", "application/json"],
    ]);
    events.emit("proxyReq", { removeHeader: (name: string) => headers.delete(name) });
    expect([...headers.keys()]).toEqual(["idempotency-key", "content-type"]);
    const response = { headers: { "set-cookie": "unexpected-cookie", "content-type": "application/json" } };
    events.emit("proxyRes", response);
    expect(response.headers).toEqual({ "content-type": "application/json" });
  });
});
