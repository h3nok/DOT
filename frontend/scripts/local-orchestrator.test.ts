import { describe, expect, it, vi } from "vitest";

vi.mock("vite", () => ({ loadEnv: vi.fn() }));
// @ts-expect-error -- plain ESM shared with Vite's configuration.
import { localOrchestratorConfig } from "./local-orchestrator.mjs";

describe("same-origin local orchestrator", () => {
  it("leaves production builds, remote APIs, and existing relative gateways alone", () => {
    expect(localOrchestratorConfig("build")).toEqual({});
    for (const target of ["https://api.example.test", "http://192.168.1.20:8000", "/api", "https://localhost:8000"]) {
      expect(localOrchestratorConfig("serve", target)).toEqual({});
    }
  });

  it.each([undefined, "", "http://127.0.0.1:8000", "http://localhost:8123", "http://[::1]:8000"])(
    "keeps local API calls and session cookies on the page's origin (%s)", target => {
      const config = localOrchestratorConfig("serve", target);
      expect(config.define["import.meta.env.VITE_ORCHESTRATOR_URL"]).toBe('"/__dot-api"');
      const [rule, proxy] = Object.entries(config.server.proxy)[0] as [string, {
        target: string; changeOrigin: boolean; rewrite: (path: string) => string;
      }];
      expect(proxy.target).toBe(target || "http://127.0.0.1:8000");
      expect(proxy.changeOrigin).toBe(false);
      for (const path of ["auth/otp/verify", "auth/session", "auth/logout", "contact/inbox?page=2"]) {
        expect(new RegExp(rule).test(`/__dot-api/v1/${path}`)).toBe(true);
        expect(proxy.rewrite(`/__dot-api/v1/${path}`)).toBe(`/v1/${path}`);
      }
      for (const path of ["/v1/auth/session", "/__dot-api/private", "/__dot-contact/v1/contact/messages"]) {
        expect(new RegExp(rule).test(path)).toBe(false);
      }
      expect(new RegExp(rule).test("/__dot-api/health/ready")).toBe(true);
      expect(proxy.rewrite("/__dot-api/health/ready")).toBe("/health/ready");
      // No cookie rewrites, authentication injection, or Origin rewrites.
      expect(Object.keys(proxy).sort()).toEqual(["changeOrigin", "rewrite", "target"]);
    },
  );

  it("rejects ambiguous local destinations", () => {
    for (const target of ["http://user:password@localhost:8000", "http://localhost:8000/api", "http://localhost:8000?token=x", "http://localhost:8000#x"]) {
      expect(() => localOrchestratorConfig("serve", target)).toThrow("loopback origin");
    }
  });
});
