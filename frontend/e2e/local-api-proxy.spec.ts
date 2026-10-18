import { expect, test } from "@playwright/test";
import { createServer as createHttpServer, type Server } from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { createServer, type ViteDevServer } from "vite";
// @ts-expect-error -- plain ESM shared with Vite's configuration.
import { localOrchestratorConfig } from "../scripts/local-orchestrator.mjs";

let upstream: Server;
let proxy: ViteDevServer;
let root: string;
let origin: string;
let received: { host?: string; origin?: string; cookie?: string; path?: string };

test.beforeAll(async () => {
  // An isolated API fixture: no real accounts, email, or databases. Unlike
  // page.route mocks, these requests pass through Vite's actual HTTP proxy.
  upstream = createHttpServer((request, response) => {
    received = { host: request.headers.host, origin: request.headers.origin, cookie: request.headers.cookie, path: request.url };
    response.setHeader("Content-Type", "application/json");
    if (request.method === "POST" && request.headers.cookie && request.headers.origin !== `http://${request.headers.host}`) {
      response.writeHead(403).end('{"detail":"Foreign origin"}');
      return;
    }
    if (request.url === "/v1/auth/otp/verify") {
      response.setHeader("Set-Cookie", "dot_session=proxy-fixture; Path=/; HttpOnly; SameSite=Lax");
      response.end('{"ok":true}');
    } else if (request.url === "/v1/auth/logout") {
      response.setHeader("Set-Cookie", "dot_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
      response.end('{"ok":true}');
    } else {
      response.end(JSON.stringify({ signedIn: request.headers.cookie?.includes("dot_session=proxy-fixture") || false }));
    }
  });
  await new Promise<void>(resolve => upstream.listen(0, "127.0.0.1", resolve));
  const port = (upstream.address() as AddressInfo).port;
  root = await mkdtemp(join(tmpdir(), "dot-local-proxy-"));
  const config = localOrchestratorConfig("serve", `http://127.0.0.1:${port}`);
  proxy = await createServer({
    ...config, root, configFile: false, logLevel: "silent",
    server: { ...config.server, host: "127.0.0.1", port: 0 },
    plugins: [{
      name: "fixture-page",
      configureServer(server) {
        return () => server.middlewares.use((_request, response) => {
          response.setHeader("Content-Type", "text/html");
          response.end("<!doctype html><title>Local session fixture</title>");
        });
      },
    }],
  });
  await proxy.listen();
  origin = `http://localhost:${(proxy.httpServer!.address() as AddressInfo).port}`;
});

test.afterAll(async () => {
  await proxy?.close();
  if (upstream) await new Promise<void>((resolve, reject) => upstream.close(error => error ? reject(error) : resolve()));
  if (root) await rm(root, { recursive: true, force: true });
});

test("the real dev proxy preserves HttpOnly cookies and origin checks across reload and logout", async ({ page }) => {
  await page.goto(origin);
  expect(await page.evaluate(async () => {
    const response = await fetch("/__dot-api/v1/auth/otp/verify", { method: "POST", credentials: "include" });
    return response.ok;
  })).toBe(true);
  expect(received).toMatchObject({ host: new URL(origin).host, origin, path: "/v1/auth/otp/verify" });
  expect(await page.evaluate(() => document.cookie)).not.toContain("dot_session");
  await page.reload();
  expect(await page.evaluate(async () => (await fetch("/__dot-api/v1/auth/session", { credentials: "include" })).json())).toEqual({ signedIn: true });
  expect(received.cookie).toContain("dot_session=proxy-fixture");

  // A hostile Origin stays hostile at the API; the proxy never launders it.
  const forbidden = await page.request.post(`${origin}/__dot-api/v1/auth/logout`, {
    headers: { Origin: "https://foreign.example.test" },
  });
  expect(forbidden.status()).toBe(403);
  expect(received.origin).toBe("https://foreign.example.test");
  expect(await page.evaluate(async () => (await fetch("/__dot-api/v1/auth/logout", { method: "POST", credentials: "include" })).ok)).toBe(true);
  await page.reload();
  expect(await page.evaluate(async () => (await fetch("/__dot-api/v1/auth/session", { credentials: "include" })).json())).toEqual({ signedIn: false });
});
