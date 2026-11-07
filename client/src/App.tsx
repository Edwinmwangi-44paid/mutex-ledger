import React, { useState, useEffect } from 'react';
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
import { CustomerProfile } from './components/profile/CustomerProfile';
import { AuthSession } from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';


export const App: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('pesaflip_theme');
    if (saved) return saved === 'dark';
    return true; // Default to signature Micro1 dark mode
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('pesaflip_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('pesaflip_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

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
    <div className={`min-h-screen flex flex-col antialiased relative overflow-x-hidden micro-grid-bg font-sans transition-colors duration-200 ${
      isDark
        ? 'bg-[#050608] text-[#EDEEF0] selection:bg-[#3E4FFF]/30 selection:text-[#8D9BFF]'
        : 'bg-[#FAFAFB] text-[#111318] selection:bg-[#3E4FFF]/20 selection:text-[#3E4FFF]'
    }`}>
      {/* Background Micro1 Noise Layer & Ambient Electric Blue Spotlight */}
      <div className="fixed inset-0 pointer-events-none grain-overlay z-0 opacity-40" />
      <div className={`fixed top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[500px] bg-gradient-to-b from-[#3E4FFF]/[0.15] via-[#00D2FF]/[0.05] to-transparent blur-[120px] pointer-events-none z-0 ${
        isDark ? 'opacity-100' : 'opacity-40'
      }`} />

      {/* Unified Global Platform Navigation */}
      {!hidePlatformShell && (
        <div className="relative z-50">
          <UnifiedNavbar
            userEmail={session?.user?.email}
            userName={session?.user?.username}
            onLogout={handleLogout}
            onOpenSearch={() => setIsSearchOpen(true)}
            isDark={isDark}
            onToggleTheme={toggleTheme}
          />
        </div>
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
        className={`flex-1 w-full mx-auto relative z-10 ${
          hidePlatformShell
            ? 'w-full'
            : 'max-w-7xl px-4 sm:px-6 lg:px-8 py-8'
        }`}
      >
        <Routes>
          {/* Public Landing Page at root when not authenticated; redirects to /discover if signed in */}
          <Route
            path="/"
            element={session ? <UnifiedHome apiBase={API_BASE} /> : <LandingPage isDark={isDark} onToggleTheme={toggleTheme} />}
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
                  isDark={isDark}
                  onToggleTheme={toggleTheme}
                />
              )
            }
          />

          {/* Customer Profile View */}
          <Route
            path="/profile"
            element={
              session ? (
                <CustomerProfile
                  session={session}
                  apiBase={API_BASE}
                  onLogout={handleLogout}
                />
              ) : (
                <Navigate to="/auth" replace />
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

          {/* 2. TradingView Market Intelligence Domain */}
          <Route
            path="/tradingview"
            element={
              session ? (
                <CryptoIntelligenceHub apiBase={API_BASE} />
              ) : (
                <Navigate to="/auth" replace />
              )
            }
          />
          <Route
            path="/tradingview/:id"
            element={
              session ? (
                <CryptoIntelligenceHub apiBase={API_BASE} />
              ) : (
                <Navigate to="/auth" replace />
              )
            }
          />
          {/* Legacy /crypto redirect to /tradingview */}
          <Route path="/crypto" element={<Navigate to="/tradingview" replace />} />
          <Route path="/crypto/:id" element={<Navigate to="/tradingview" replace />} />

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
