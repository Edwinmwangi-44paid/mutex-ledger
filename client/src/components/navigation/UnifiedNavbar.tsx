import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Trophy,
  LineChart,
  Film,
  Compass,
  Search,
  Sparkles,
  LogOut,
  Menu,
  X,
  ChevronRight,
  User,
  Sun,
  Moon,
} from 'lucide-react';

interface NavbarProps {
  userEmail?: string;
  userName?: string;
  onLogout?: () => void;
  onOpenSearch?: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export const UnifiedNavbar: React.FC<NavbarProps> = ({
  userEmail,
  userName,
  onLogout,
  onOpenSearch,
  isDark = true,
  onToggleTheme,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { label: 'Home', path: '/', icon: Compass },
    { label: 'Sports', path: '/sports', icon: Trophy, badge: 'Live' },
    { label: 'TradingView', path: '/tradingview', icon: LineChart },
    { label: 'Entertainment', path: '/entertainment', icon: Film },
    { label: 'Discover', path: '/discover', icon: Sparkles },
  ];

  return (
    <header className={`sticky top-0 z-50 backdrop-blur-2xl border-b select-none transition-colors duration-200 ${
      isDark
        ? 'bg-[#050608]/85 border-white/[0.07]'
        : 'bg-[#FAFAFB]/90 border-black/[0.07] shadow-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo - Micro1 Style */}
          <div className="flex items-center space-x-8">
            <NavLink to="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#3E4FFF] to-[#00D2FF] opacity-35 blur-md group-hover:opacity-75 transition duration-300" />
                <div className={`relative w-9 h-9 rounded-xl border flex items-center justify-center font-black text-base shadow-inner ${
                  isDark ? 'bg-[#090B10] border-white/15 text-white' : 'bg-white border-black/10 text-black'
                }`}>
                  <span className="bg-gradient-to-br from-[#3E4FFF] to-[#00D2FF] bg-clip-text text-transparent font-bold">P</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className={`font-extrabold text-sm tracking-tight flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Pesa<span className="text-[#3E4FFF]">Flip</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold tracking-wider uppercase bg-[#3E4FFF]/15 text-[#3E4FFF] border border-[#3E4FFF]/30">AI</span>
                </span>
                <span className={`text-[10px] font-medium tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Intelligence Engine
                </span>
              </div>
            </NavLink>

            {/* Desktop Navigation */}
            <nav className={`hidden md:flex items-center space-x-1 p-1 border rounded-xl backdrop-blur-md ${
              isDark ? 'bg-white/[0.025] border-white/[0.06]' : 'bg-black/[0.03] border-black/[0.06]'
            }`}>
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path ||
                  (link.path !== '/' && location.pathname.startsWith(link.path));
                return (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className={`relative px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all ${
                      isActive
                        ? isDark
                          ? 'text-white bg-white/[0.09] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.16)]'
                          : 'text-black bg-white shadow-sm border border-black/[0.05]'
                        : isDark
                          ? 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.03]'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-black/[0.03]'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 transition-colors ${isActive ? 'text-[#3E4FFF]' : isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span>{link.label}</span>
                    {link.badge && (
                      <span className="relative flex h-2 w-2 ml-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3E4FFF] opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3E4FFF]" />
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Right Controls: Search, Theme Switcher, Profile, Mobile Menu */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Global Quick Search Button */}
            <button
              onClick={onOpenSearch}
              className={`flex items-center space-x-2.5 px-3 py-1.5 rounded-xl border text-xs transition-all cursor-pointer shadow-sm active:scale-95 ${
                isDark
                  ? 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.08] hover:border-white/20 text-gray-400 hover:text-gray-200'
                  : 'bg-black/[0.03] hover:bg-black/[0.06] border-black/[0.08] hover:border-black/20 text-gray-600 hover:text-gray-900'
              }`}
            >
              <Search className={`w-3.5 h-3.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              <span className="hidden sm:inline font-medium">Search intelligence...</span>
              <kbd className={`hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono border rounded-md ${
                isDark ? 'bg-white/[0.06] border-white/10 text-gray-300' : 'bg-black/[0.05] border-black/10 text-gray-700'
              }`}>
                ⌘K
              </kbd>
            </button>

            {/* Light / Dark Mode Toggle Button */}
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className={`p-2 rounded-xl border transition-all active:scale-95 cursor-pointer ${
                  isDark
                    ? 'bg-white/[0.03] hover:bg-white/[0.08] border-white/[0.08] text-amber-300 hover:text-amber-200'
                    : 'bg-black/[0.03] hover:bg-black/[0.08] border-black/[0.08] text-[#3E4FFF] hover:text-[#3140E8]'
                }`}
              >
                {isDark ? (
                  <Sun className="w-4 h-4 transition-transform hover:rotate-45" />
                ) : (
                  <Moon className="w-4 h-4 transition-transform hover:-rotate-12" />
                )}
              </button>
            )}

            {/* Customer Profile & Authentication Status */}
            {userEmail ? (
              <div className={`hidden sm:flex items-center space-x-2 pl-2 border-l ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
                <button
                  onClick={() => navigate('/profile')}
                  className={`flex items-center space-x-2 py-1 px-2.5 rounded-xl border transition-all cursor-pointer group shadow-sm active:scale-95 ${
                    isDark
                      ? 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.08] hover:border-[#3E4FFF]/50'
                      : 'bg-black/[0.03] hover:bg-black/[0.06] border-black/[0.08] hover:border-[#3E4FFF]/50'
                  }`}
                  title="View Customer Profile"
                >
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#3E4FFF] to-[#00D2FF] p-[1px] shadow-sm">
                    <div className={`w-full h-full rounded-[7px] flex items-center justify-center text-xs font-bold transition-colors ${
                      isDark ? 'bg-[#050608] text-[#8D9BFF]' : 'bg-white text-[#3E4FFF]'
                    }`}>
                      {(userName?.trim() || userEmail).charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <span className={`text-xs font-semibold transition-colors max-w-[120px] truncate ${
                    isDark ? 'text-gray-300 group-hover:text-white' : 'text-gray-700 group-hover:text-black'
                  }`}>
                    {userName?.trim() || userEmail.split('@')[0]}
                  </span>
                </button>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    title="Sign Out"
                    className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                      isDark ? 'text-gray-400 hover:text-rose-400 hover:bg-white/[0.04]' : 'text-gray-600 hover:text-rose-600 hover:bg-black/[0.04]'
                    }`}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigate('/auth')}
                className="micro-btn-primary hidden sm:inline-flex items-center px-4 py-1.5 text-xs font-semibold cursor-pointer"
              >
                Sign In
              </button>
            )}

            {/* Mobile Hamburger toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-2 rounded-xl transition-colors ${
                isDark ? 'text-gray-400 hover:text-white hover:bg-white/[0.04]' : 'text-gray-600 hover:text-black hover:bg-black/[0.04]'
              }`}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/[0.07] bg-[#080A0E] px-4 pt-3 pb-6 space-y-1">
          {userEmail && (
            <NavLink
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium mb-2 ${
                location.pathname === '/profile' ? 'bg-white/[0.08] text-white font-semibold' : 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
              }`}
            >
              <div className="flex items-center space-x-3">
                <User className="w-4 h-4 text-emerald-400" />
                <span>My Profile ({userName?.trim() || userEmail.split('@')[0]})</span>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-400" />
            </NavLink>
          )}

          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium ${
                  isActive ? 'bg-white/[0.08] text-white font-semibold' : 'text-gray-300 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-gray-400'}`} />
                  <span>{link.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </NavLink>
            );
          })}

          {userEmail && onLogout && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onLogout();
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 mt-2"
            >
              <div className="flex items-center space-x-3">
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </div>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
