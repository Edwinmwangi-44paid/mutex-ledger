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
  } from 'lucide-react';

interface NavbarProps {
  userEmail?: string;
  onLogout?: () => void;
  onOpenSearch?: () => void;
}

export const UnifiedNavbar: React.FC<NavbarProps> = ({
  userEmail,
  onLogout,
  onOpenSearch,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { label: 'Home', path: '/', icon: Compass },
    { label: 'Sports', path: '/sports', icon: Trophy, badge: 'Live' },
    { label: 'Crypto', path: '/crypto', icon: LineChart },
    { label: 'Entertainment', path: '/entertainment', icon: Film },
    { label: 'Discover', path: '/discover', icon: Sparkles },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0D0F12]/90 backdrop-blur-md border-b border-[#1E222B] select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center space-x-8">
            <NavLink to="/" className="flex items-center space-x-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-cyan-500 to-indigo-500 p-[1.5px] shadow-lg shadow-emerald-500/10 group-hover:shadow-emerald-500/25 transition-all">
                <div className="w-full h-full bg-[#0D0F12] rounded-[10px] flex items-center justify-center font-black text-white text-base">
                  P
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1">
                  Pesa<span className="text-emerald-400">Flip</span>
                </span>
                <span className="text-[10px] text-gray-400 font-medium tracking-wide">
                  Intelligence &amp; Media
                </span>
              </div>
            </NavLink>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path || 
                  (link.path !== '/' && location.pathname.startsWith(link.path));
                return (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className={`px-3.5 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-all ${
                      isActive
                        ? 'text-white bg-[#1A1E26] shadow-inner font-semibold'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-[#15181E]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-gray-400'}`} />
                    <span>{link.label}</span>
                    {link.badge && (
                      <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                        {link.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Right Controls: Search, Profile, Mobile Menu */}
          <div className="flex items-center space-x-3">
            {/* Global Quick Search Button */}
            <button
              onClick={onOpenSearch}
              className="flex items-center space-x-2.5 px-3 py-1.5 rounded-lg bg-[#15181E] border border-[#222630] hover:border-gray-600 text-gray-400 hover:text-gray-200 text-xs transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-gray-400" />
              <span className="hidden sm:inline">Search anything...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-[#222630] text-gray-400 rounded">
                ⌘K
              </kbd>
            </button>

            {/* status */}
            {userEmail ? (
              <div className="hidden sm:flex items-center space-x-2 pl-2 border-l border-[#222630]">
                <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs font-semibold">
                  {userEmail.charAt(0).toUpperCase()}
                </div>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    title="Sign Out"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-[#1A1E26] transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigate('/auth')}
                className="hidden sm:inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black transition-colors"
              >
                Sign In
              </button>
            )}

            {/* Mobile Hamburger toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#15181E]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#1E222B] bg-[#0D0F12] px-4 pt-3 pb-6 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-[#1A1E26] text-white font-semibold' : 'text-gray-300 hover:bg-[#15181E]'
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
        </div>
      )}
    </header>
  );
};
