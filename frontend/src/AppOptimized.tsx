import React, { Suspense, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "./shared/contexts/SimpleThemeContext";
import Navigation from "./blocks/core/navigation/Navigation";
import { PWAStatus } from "./shared/components/pwa/PWAStatus";
import { useUI } from "./shared/contexts";
import "./App.css";

// Lazy load all major pages for code splitting
const HomePage = React.lazy(() => import("./blocks/core/home/HomePage"));
const AboutPage = React.lazy(() => import("./blocks/about/AboutPage"));
const ContactPage = React.lazy(() => import("./blocks/contact/ContactPage"));
const CaseStudyPage = React.lazy(() =>
  import("./blocks/work/CaseStudyPage").then((module) => ({
    default: module.CaseStudyPage,
  })),
);
const BlogPage = React.lazy(() => import("./blocks/knowledge/blog/BlogPage"));
const BlogPostPage = React.lazy(
  () => import("./blocks/knowledge/blog/BlogPostPage"),
);
const BlogEditorPage = React.lazy(
  () => import("./blocks/knowledge/blog/BlogEditorPage"),
);
const CommunityPage = React.lazy(
  () => import("./blocks/community/CommunityPage"),
);
const LearnPage = React.lazy(() => import("./blocks/learn/LearnPage"));
const SupportPage = React.lazy(() => import("./blocks/support/SupportPage"));
const IntegrationPage = React.lazy(
  () => import("./blocks/integration/IntegrationPage"),
);
const UserProfilePage = React.lazy(
  () => import("./blocks/core/profile/UserProfilePage"),
);
const SettingsPage = React.lazy(
  () => import("./blocks/core/settings/SettingsPage"),
);
const InviteGatewayPage = React.lazy(
  () => import("./blocks/core/invite/InviteGatewayPage"),
);
const UIShowcase = React.lazy(
  () => import("./shared/components/ui/UIShowcase"),
);

// Simple loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
  </div>
);

const RouteScrollManager: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
};

// Simple error boundary component
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
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600">
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
  const { state, toggleMobileMenu } = useUI();

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Router basename={import.meta.env.BASE_URL}>
          <div className="App">
            <RouteScrollManager />
            <Navigation
              isOpen={state.ui.isMobileMenuOpen}
              onToggle={toggleMobileMenu}
            />
            {/* PWA Status for install prompts and offline notifications */}
            <div className="container mx-auto px-4 pt-4">
              <PWAStatus />
            </div>
            <main>
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/work/:id" element={<CaseStudyPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/blog" element={<BlogPage />} />
                  <Route path="/blog/:id" element={<BlogPostPage />} />
                  <Route path="/blog/edit/:id" element={<BlogEditorPage />} />
                  <Route path="/blog/new" element={<BlogEditorPage />} />
                  <Route path="/community" element={<CommunityPage />} />
                  <Route path="/learn" element={<LearnPage />} />
                  <Route path="/support" element={<SupportPage />} />
                  <Route path="/integration" element={<IntegrationPage />} />
                  <Route path="/profile" element={<UserProfilePage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/invite" element={<InviteGatewayPage />} />
                  <Route path="/join" element={<InviteGatewayPage />} />
                  <Route path="/ui" element={<UIShowcase />} />
                  <Route path="/styleguide" element={<UIShowcase />} />
                </Routes>
              </Suspense>
            </main>
          </div>
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
