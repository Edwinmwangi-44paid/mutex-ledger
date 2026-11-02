import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { UnifiedNavbar } from './components/navigation/UnifiedNavbar';
import { GlobalSearchModal } from './components/navigation/GlobalSearchModal';
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

  const handleAuthSuccess = (newSession: AuthSession) => {
    setSession(newSession);
    localStorage.setItem('pesaflip_auth_session', JSON.stringify(newSession));
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem('pesaflip_auth_session');
  };

  return (
    <div className="min-h-screen bg-[#0D0F12] text-gray-100 flex flex-col antialiased selection:bg-emerald-500 selection:text-black">
      {/* Unified Global Platform Navigation */}
      <UnifiedNavbar
        userEmail={session?.user?.email}
        onLogout={handleLogout}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Global Cross-Domain Omni-Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        apiBase={API_BASE}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Routes>
          {/* 1. Unified Home Feed */}
          <Route path="/" element={<UnifiedHome apiBase={API_BASE} />} />

          {/* 2. Sports Domain */}
          <Route path="/sports" element={<MatchCenter apiBase={API_BASE} />} />
          <Route path="/sports/:id" element={<MatchDetailsPage apiBase={API_BASE} />} />

          {/* 3. Crypto Intelligence Domain */}
          <Route path="/crypto" element={<CryptoIntelligenceHub apiBase={API_BASE} />} />
          <Route path="/crypto/:id" element={<CryptoIntelligenceHub apiBase={API_BASE} />} />

          {/* 4. Entertainment & Media Discovery */}
          <Route
            path="/entertainment"
            element={<EntertainmentDiscovery apiBase={API_BASE} />}
          />
          <Route
            path="/entertainment/:id"
            element={<EntertainmentDiscovery apiBase={API_BASE} />}
          />

          {/* 5. Discover & Unified Feed */}
          <Route path="/discover" element={<UnifiedHome apiBase={API_BASE} />} />

          {/* Auth Route */}
          <Route
            path="/auth"
            element={
              session ? (
                <Navigate to="/" replace />
              ) : (
                <AuthGateway
                  onAuthSuccess={(s) => {
                    handleAuthSuccess(s);
                    navigate('/');
                  }}
                  apiBase={API_BASE}
                />
              )
            }
          />

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Modern Platform Footer */}
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
    </div>
  );
};

export default App;
