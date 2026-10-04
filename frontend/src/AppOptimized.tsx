import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import {
  OrganismMembrane,
  OrganismThemeBridge,
  OrganismReadingProbe,
  OrganismHud,
  AppearanceControl,
} from "./organism";
import { SiteContentProvider } from "./content/editable";
import { RouteLoadingBoundary } from "./shared/RouteLoadingBoundary";

// Lazy load surfaces for code splitting.
const HomePage = React.lazy(() => import("./blocks/core/home/HomePage"));
const DoctrinePage = React.lazy(
  () => import("./blocks/knowledge/DoctrinePage"),
);
const AcademyPage = React.lazy(() => import("./blocks/academy/AcademyPage"));
const PublicationStudioPage = React.lazy(
  () => import("./blocks/publication/PublicationStudioPage"),
);
const PublicationStudioIndexPage = React.lazy(
  () => import("./blocks/publication/PublicationStudioIndexPage"),
);
const StudioAuthGate = React.lazy(() =>
  import("./blocks/publication/components/StudioAuthGate").then((module) => ({
    default: module.StudioAuthGate,
  })),
);
const PublicationReaderPage = React.lazy(
  () => import("./blocks/publication/PublicationReaderPage"),
);
const BookOnePage = React.lazy(
  () => import("./blocks/publication/BookOnePage"),
);
const BookAccessPage = React.lazy(
  () => import("./blocks/publication/BookAccessPage"),
);
const AppliedPage = React.lazy(() => import("./blocks/applied/AppliedPage"));
const SupportPage = React.lazy(
  () => import("./blocks/core/support/SupportPage"),
);
const JoinPage = React.lazy(() => import("./blocks/core/support/JoinPage"));
// The author layer (ADR-0033): who writes, what else they have written, how
// to hear again, and what the site keeps.
const AboutPage = React.lazy(() => import("./blocks/about/AboutPage"));
const EssaysPage = React.lazy(() => import("./blocks/essays/EssaysPage"));
const EssayPage = React.lazy(() => import("./blocks/essays/EssayPage"));
const ReadersPage = React.lazy(() => import("./blocks/readers/ReadersPage"));
const ReaderLeavePage = React.lazy(
  () => import("./blocks/readers/ReaderLeavePage"),
);
const PrivacyPage = React.lazy(() => import("./blocks/privacy/PrivacyPage"));
const NotFoundPage = React.lazy(() => import("./blocks/core/NotFoundPage"));

const RouteScrollManager: React.FC = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      return;
    }

    // Route elements are lazy. On a direct visit the manager can render one
    // frame before the anchored section exists, so retry briefly instead of
    // erasing a valid deep link by immediately scrolling to the top.
    let frame = 0;
    let attempts = 0;
    let settleTimer = 0;
    let cancelled = false;
    const alignTarget = (target: HTMLElement) => {
      if (!cancelled) {
        target.scrollIntoView({ block: "start", behavior: "auto" });
      }
    };
    const revealAnchor = () => {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        alignTarget(target);
        // Web fonts and responsive lazy children can settle after the section
        // first enters the DOM. Realign once after layout stabilises so a
        // mobile deep link does not drift half a section away from its target.
        void document.fonts?.ready.then(() => alignTarget(target));
        settleTimer = window.setTimeout(() => alignTarget(target), 500);
        return;
      }
      attempts += 1;
      if (attempts < 60) frame = window.requestAnimationFrame(revealAnchor);
    };
    frame = window.requestAnimationFrame(revealAnchor);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      window.clearTimeout(settleTimer);
    };
  }, [hash, pathname]);

  return null;
};

/** Book surfaces own this control in their sticky reading chrome. */
const FloatingAppearanceControl: React.FC = () => {
  const { pathname } = useLocation();

  if (
    pathname.startsWith("/book/digital-organism-theory") &&
    !pathname.endsWith("/copy")
  ) {
    return null;
  }
  if (pathname === "/") return null;
  return <AppearanceControl />;
};

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="mb-2 text-xl font-semibold text-destructive">
              Something went wrong
            </h2>
            <p className="text-muted-foreground">
              Please refresh the page and try again.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Router basename={import.meta.env.BASE_URL}>
        {/* Published copy overrides, resolved once for the whole app. Every
            failure here falls back to the released wording (ADR-0021). */}
        <SiteContentProvider>
        <div className="App">
          {/* Living organism layer: ambient membrane + CSS-var bridge +
                reading reflex + diagnostics. Behind all content, pointer-inert,
                and self-disabling. The reading probe lives here (inside Router)
                so it can sense the route and quiet the organism while reading. */}
          <OrganismMembrane />
          <OrganismThemeBridge />
          <OrganismReadingProbe />
          <OrganismHud />
          <RouteScrollManager />
          {/* Routes render their own <main>; a second landmark here would nest them. */}
          <div>
            <RouteLoadingBoundary>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/academy" element={<AcademyPage />} />
                <Route path="/doctrine" element={<DoctrinePage />} />
                <Route path="/doctrine/:nodeId" element={<DoctrinePage />} />
                <Route path="/applied" element={<AppliedPage />} />
                <Route path="/support" element={<SupportPage />} />
                <Route path="/join" element={<JoinPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/essays" element={<EssaysPage />} />
                <Route path="/essays/:slug" element={<EssayPage />} />
                <Route path="/readers" element={<ReadersPage />} />
                <Route path="/readers/leave" element={<ReaderLeavePage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route
                  path="/studio"
                  element={
                    <StudioAuthGate>
                      <PublicationStudioIndexPage />
                    </StudioAuthGate>
                  }
                />
                <Route
                  path="/studio/:projectId"
                  element={
                    <StudioAuthGate>
                      <PublicationStudioPage />
                    </StudioAuthGate>
                  }
                />
                <Route path="/read/:ownerId/:slug" element={<PublicationReaderPage />} />
                <Route
                  path="/read/:ownerId/:slug/:sectionSlug"
                  element={<PublicationReaderPage />}
                />
                <Route path="/book/digital-organism-theory" element={<BookOnePage />} />
                <Route
                  path="/book/digital-organism-theory/copy"
                  element={<BookAccessPage />}
                />
                <Route
                  path="/book/digital-organism-theory/:sectionSlug"
                  element={<BookOnePage />}
                />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </RouteLoadingBoundary>
          </div>
          {/* User-facing appearance control (theme + living background). */}
          <FloatingAppearanceControl />
        </div>
        </SiteContentProvider>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
