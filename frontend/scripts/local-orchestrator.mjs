import { loadEnv } from "vite";

const PREFIX = "/__dot-api";
const DEFAULT_TARGET = "http://127.0.0.1:8000";

// Local HTTP sessions must stay on the page's site: localhost and 127.0.0.1
// are different sites to a browser, even though both reach this machine.
export function localOrchestratorConfig(command, target = DEFAULT_TARGET) {
  if (command !== "serve") return {};
  const url = new URL(target || DEFAULT_TARGET, "http://relative.invalid");
  if (url.protocol !== "http:" || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) return {};
  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("The local VITE_ORCHESTRATOR_URL must be an HTTP loopback origin without credentials or a path.");
  }
  return {
    define: { "import.meta.env.VITE_ORCHESTRATOR_URL": JSON.stringify(PREFIX) },
    server: {
      proxy: {
        [`^${PREFIX}/(?:v1/|health(?:/|$))`]: {
          target: url.origin,
          // Preserve Host and Origin together so the API's origin guard can
          // check same-origin writes, including on alternate preview ports.
          changeOrigin: false,
          rewrite: path => path.slice(PREFIX.length),
        },
      },
    },
  };
}

export function localOrchestratorPlugin() {
  return {
    name: "dot-local-orchestrator",
    config(_config, { command, mode }) {
      const env = command === "serve" ? loadEnv(mode, process.cwd(), "VITE_") : {};
      return localOrchestratorConfig(command, env.VITE_ORCHESTRATOR_URL);
    },
  };
}
