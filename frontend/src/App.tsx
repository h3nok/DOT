import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './shared/contexts/SimpleThemeContext';
import Navigation from './blocks/core/navigation/Navigation';
import HomePage from './blocks/core/home/HomePage';
import BlogPage from './blocks/knowledge/blog/BlogPage';
import BlogPostPage from './blocks/knowledge/blog/BlogPostPage';
import BlogEditorPage from './blocks/knowledge/blog/BlogEditorPage';
import CommunityPage from './blocks/community/CommunityPage';
import LearnPage from './blocks/learn/LearnPage';
import SupportPage from './blocks/support/SupportPage';
import IntegrationPage from './blocks/integration/IntegrationPage';
import UserProfilePage from './blocks/core/profile/UserProfilePage';
import SettingsPage from './blocks/core/settings/SettingsPage';
import { useAppState } from './shared/contexts/AppStateContext';
import './App.css';

const App: React.FC = () => {
  const { state, toggleMobileMenu } = useAppState();

  return (
    <ThemeProvider>
      <Router>
        <div className="App">
          <Navigation isOpen={state.ui.isMobileMenuOpen} onToggle={toggleMobileMenu} />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
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
            </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
};

export default App;
