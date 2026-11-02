import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { UnifiedNavbar } from './components/navigation/UnifiedNavbar';
import { GlobalSearchModal } from './components/navigation/GlobalSearchModal';
import { LandingPage } from './components/LandingPage';
import { UnifiedHome } from './components/home/UnifiedHome';
import { MatchCenter } from './components/sports/MatchCenter';
import { MatchDetailsPage } from './components/sports/MatchDetailsPage';
import { CryptoIntelligenceHub } from './components/crypto/CryptoIntelligenceHub';
import { EntertainmentDiscovery } from './components/entertainment/EntertainmentDiscovery';
import { AuthGateway } from './components/AuthGateway';
import { AuthSession } from './types';

const API_BASE = 'http://127.0.0.1:8000/api/v1';

export const App: React.FC = () => {
  const [session, setSession] = useState<AuthSession | null>(() => {
    try {
      const saved = localStorage.getItem('pesaflip_auth_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleAuthSuccess = (newSession: AuthSession) => {
    setSession(newSession);
    localStorage.setItem('pesaflip_auth_session', JSON.stringify(newSession));
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem('pesaflip_auth_session');
  };

  // Determine if on landing page or auth page
  const isLandingPage = location.pathname === '/' && !session;
  const isAuthPage = location.pathname === '/auth';
  const hidePlatformShell = isLandingPage || isAuthPage;

  return (
    <div className="min-h-screen bg-[#0D0F12] text-gray-100 flex flex-col antialiased selection:bg-emerald-500 selection:text-black">
      {/* Unified Global Platform Navigation - Shown when logged in or in-app */}
      {!hidePlatformShell && (
        <UnifiedNavbar
          userEmail={session?.user?.email}
          onLogout={handleLogout}
          onOpenSearch={() => setIsSearchOpen(true)}
        />
      )}

      {/* Global Cross-Domain Omni-Search Modal */}
      {!hidePlatformShell && (
        <GlobalSearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          apiBase={API_BASE}
        />
      )}

      {/* Main Content Viewport */}
      <main
        className={`flex-1 w-full mx-auto ${
          hidePlatformShell
            ? 'w-full'
            : 'max-w-7xl px-4 sm:px-6 lg:px-8 py-6'
        }`}
      >
        <Routes>
          {/* Public Landing Page at root when not authenticated; redirects to /discover if signed in */}
          <Route
            path="/"
            element={session ? <UnifiedHome apiBase={API_BASE} /> : <LandingPage />}
          />

          {/* Authentication Gateway */}
          <Route
            path="/auth"
            element={
              session ? (
                <Navigate to="/sports" replace />
              ) : (
                <AuthGateway
                  onAuthSuccess={(s) => {
                    handleAuthSuccess(s);
                    navigate('/sports');
                  }}
                  apiBase={API_BASE}
                />
              )
            }
          />

          {/* 1. Sports Domain (Protected / Primary Experience) */}
          <Route
            path="/sports"
            element={
              session ? (
                <MatchCenter apiBase={API_BASE} />
              ) : (
                <Navigate to="/auth" replace />
              )
            }
          />
          <Route
            path="/sports/:id"
            element={
              session ? (
                <MatchDetailsPage apiBase={API_BASE} />
              ) : (
                <Navigate to="/auth" replace />
              )
            }
          />

          {/* 2. Crypto Intelligence Domain */}
          <Route
            path="/crypto"
            element={
              session ? (
                <CryptoIntelligenceHub apiBase={API_BASE} />
              ) : (
                <Navigate to="/auth" replace />
              )
            }
          />
          <Route
            path="/crypto/:id"
            element={
              session ? (
                <CryptoIntelligenceHub apiBase={API_BASE} />
              ) : (
                <Navigate to="/auth" replace />
              )
            }
          />

          {/* 3. Entertainment & Media Discovery */}
          <Route
            path="/entertainment"
            element={
              session ? (
                <EntertainmentDiscovery apiBase={API_BASE} />
              ) : (
                <Navigate to="/auth" replace />
              )
            }
          />
          <Route
            path="/entertainment/:id"
            element={
              session ? (
                <EntertainmentDiscovery apiBase={API_BASE} />
              ) : (
                <Navigate to="/auth" replace />
              )
            }
          />

          {/* 4. Discover & Unified Feed */}
          <Route
            path="/discover"
            element={
              session ? (
                <UnifiedHome apiBase={API_BASE} />
              ) : (
                <Navigate to="/auth" replace />
              )
            }
          />

          {/* Legacy route compatibility */}
          <Route path="/app" element={<Navigate to="/sports" replace />} />

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Modern Platform Footer - Shown inside platform */}
      {!hidePlatformShell && (
        <footer className="border-t border-[#1A1F2B] bg-[#0A0C0F] px-6 py-6 text-xs text-gray-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <span className="font-semibold text-gray-300">PesaFlip Intelligence</span>
              <span>•</span>
              <span>Sports AI Predictions</span>
              <span>•</span>
              <span>Market Analytics</span>
              <span>•</span>
              <span>Media Discovery</span>
            </div>
            <div>
              <span>© 2026 PesaFlip Ecosystem. Probabilistic predictions carry inherent sporting risk.</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;
