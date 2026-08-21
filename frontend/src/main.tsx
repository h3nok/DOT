import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// The published manuscript is English. Loading Fontsource's unscoped files
// emitted every Cyrillic, Greek, Vietnamese, and Latin Extended face at every
// weight into the release even though the browser never requested them. Keep
// the same local/offline typography while shipping only the glyph set this
// edition uses; future translated editions can add their own subset explicitly.
import "@fontsource/inter/latin-300.css";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import "@fontsource/jetbrains-mono/latin-300.css";
import "@fontsource/jetbrains-mono/latin-400.css";
import "@fontsource/jetbrains-mono/latin-500.css";
import "@fontsource/space-grotesk/latin-400.css";
import "@fontsource/space-grotesk/latin-500.css";
import "@fontsource/playfair-display/latin-400.css";
import "@fontsource/playfair-display/latin-700.css";
import "@fontsource/playfair-display/latin-900.css";
// Source Serif 4 sets long-form chapter prose. Playfair is a display face —
// small x-height and high stroke contrast — which thins out badly across the
// 3,000-word chapters it was carrying. It stays on headings, where it belongs.
import "@fontsource/source-serif-4/latin-400.css";
import "@fontsource/source-serif-4/latin-400-italic.css";
import "@fontsource/source-serif-4/latin-600.css";
import "@fontsource/source-serif-4/latin-700.css";

import { HelmetProvider } from "react-helmet-async";
import "./App.css";
import { initAnalytics } from "./lib/analytics";
import App from "./AppOptimized";
import "./index.css";
import { OrganismProvider } from "./organism";
import "./organism/organism.css";
import { AppProviders } from "./shared/contexts";
import { ThemeProvider } from "./shared/contexts/SimpleThemeContext";

// Aggregate readership only, and only when a domain is configured (ADR-0024).
// Nothing is stored on the reader's device and no profile exists to unseal.
initAnalytics();

if (typeof window !== "undefined" && "serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // Offline cache registration failed silently without blocking UI.
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <AppProviders>
        <ThemeProvider>
          <OrganismProvider>
            <App />
          </OrganismProvider>
        </ThemeProvider>
      </AppProviders>
    </HelmetProvider>
  </StrictMode>,
);
