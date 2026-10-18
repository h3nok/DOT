import { loadEnv } from "vite";

// Explicitly opt a local preview into the live public intake. Private inbox
// and authentication routes continue to use the normal local orchestrator.
export function contactPreviewConfig(command, target = "") {
  const enabled = command === "serve" && Boolean(target.trim());
  const define = { "import.meta.env.VITE_CONTACT_PREVIEW": JSON.stringify(String(enabled)) };
  if (!enabled) return { define };

  const url = new URL(target.trim());
  if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("DOT_CONTACT_PREVIEW_TARGET must be an HTTPS origin without credentials or a path.");
  }

  return {
    define,
    server: {
      proxy: {
        "^/__dot-contact/v1/contact/(?:status|messages)$": {
          target: url.origin,
          changeOrigin: true,
          rewrite: path => path.replace(/^\/__dot-contact/, ""),
          configure(proxy) {
            proxy.on("proxyReq", request => {
              request.removeHeader("cookie");
              request.removeHeader("authorization");
            });
            proxy.on("proxyRes", response => {
              delete response.headers["set-cookie"];
            });
          },
        },
      },
    },
  };
}

export function contactPreviewPlugin() {
  return {
    name: "dot-contact-preview",
    config(_config, { command, mode }) {
      const env = command === "serve" ? loadEnv(mode, process.cwd(), "DOT_") : {};
      return contactPreviewConfig(command, env.DOT_CONTACT_PREVIEW_TARGET);
    },
  };
}
