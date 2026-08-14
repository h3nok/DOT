import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Import Fontsource packages for local, high-fidelity offline fonts
import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/jetbrains-mono/300.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/playfair-display/400.css";
import "@fontsource/playfair-display/700.css";
import "@fontsource/playfair-display/900.css";
// Source Serif 4 sets long-form chapter prose. Playfair is a display face —
// small x-height and high stroke contrast — which thins out badly across the
// 3,000-word chapters it was carrying. It stays on headings, where it belongs.
import "@fontsource/source-serif-4/400.css";
import "@fontsource/source-serif-4/400-italic.css";
import "@fontsource/source-serif-4/600.css";
import "@fontsource/source-serif-4/700.css";

import { HelmetProvider } from "react-helmet-async";
import "./App.css";
import App from "./AppOptimized";
import "./index.css";
import { OrganismProvider } from "./organism";
import "./organism/organism.css";
import { AppProviders } from "./shared/contexts";
import { ThemeProvider } from "./shared/contexts/SimpleThemeContext";

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
