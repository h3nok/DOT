import React, { Suspense, useEffect } from "react";
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
import "./shared/splash-emergence.css";

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

/* The route splash performs the thesis: dot → boundary → field (ADR-0022's
   emergence, as CSS so a stalled JS bundle can never hide the wait state). */
const LoadingSpinner = () => (
  <div className="splash-emergence" role="status" aria-label="Loading">
    <div className="splash-emergence__stage">
      <span className="splash-emergence__halo" />
      <span className="splash-emergence__ring" />
      <span className="splash-emergence__dot" />
    </div>
  </div>
);

const RouteScrollManager: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

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
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/academy" element={<AcademyPage />} />
                <Route path="/doctrine" element={<DoctrinePage />} />
                <Route path="/doctrine/:nodeId" element={<DoctrinePage />} />
                <Route path="/applied" element={<AppliedPage />} />
                <Route path="/support" element={<SupportPage />} />
                <Route path="/join" element={<JoinPage />} />
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
              </Routes>
            </Suspense>
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
