import React, { useEffect, useState } from 'react';
import {
  Eye,
  EyeOff,
  Bell,
  Search,
  ShieldCheck,
} from 'lucide-react';

interface TopBannerProps {
  isBalanceHidden: boolean;
  onToggleBalanceVisibility: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  userEmail?: string;
  onLogout?: () => void;
  serverOnline: boolean;
}

export const TopBanner: React.FC<TopBannerProps> = ({
  isBalanceHidden,
  onToggleBalanceVisibility,
  searchQuery,
  onSearchChange,
  userEmail,
  onLogout,
  serverOnline,
}) => {
  const [latency, setLatency] = useState<number>(14);

  useEffect(() => {
    const timer = setInterval(() => {
      setLatency(Math.floor(11 + Math.random() * 8));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="border-b border-[#2B313A] bg-[#181A20] px-4 md:px-6 py-2.5 select-none sticky top-0 z-50">
      <div className="max-w-[1720px] mx-auto flex items-center justify-between gap-4">
        {/* Left: Binance-style Brand Logo & Market Tabs */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2.5 cursor-pointer">
            <div className="w-8 h-8 rounded bg-[#F0B90B] flex items-center justify-center font-bold text-[#0B0E11] text-lg shadow-sm">
              <span className="tracking-tighter font-extrabold">M</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-sm tracking-tight text-[#EAECEF]">
                  MUTEX<span className="text-[#F0B90B]">EX</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#2B313A] text-[#F0B90B] border border-[#F0B90B]/30">
                  VIP 1
                </span>
              </div>
              <span className="text-[10px] text-[#848E9C] hidden sm:inline">
                Exchange Wallet &amp; Concurrency Engine
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-5 text-xs font-medium text-[#848E9C]">
            <span className="text-[#EAECEF] hover:text-[#F0B90B] cursor-pointer transition-colors">
              Wallet Overview
            </span>
            <span className="hover:text-[#EAECEF] cursor-pointer transition-colors">
              Spot
            </span>
            <span className="hover:text-[#EAECEF] cursor-pointer transition-colors">
              Funding
            </span>
            <span className="hover:text-[#EAECEF] cursor-pointer transition-colors">
              Futures
            </span>
            <span className="hover:text-[#EAECEF] cursor-pointer transition-colors">
              Earn
            </span>
          </nav>
        </div>

        {/* Center: Global Search Bar */}
        <div className="hidden md:flex items-center flex-1 max-w-xs relative mx-4">
          <Search className="w-3.5 h-3.5 text-[#848E9C] absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search coin, asset or tx hash..."
            className="w-full bg-[#2B313A]/60 hover:bg-[#2B313A] focus:bg-[#0B0E11] border border-transparent focus:border-[#F0B90B] rounded-full py-1.5 pl-8 pr-3 text-xs text-[#EAECEF] placeholder:text-[#848E9C] focus:outline-none transition-all"
          />
        </div>

        {/* Right: Quick Action Controls, Eye Toggle, Status & Profile */}
        <div className="flex items-center space-x-3 text-xs">
          {/* Balance Masking Toggle */}
          <button
            onClick={onToggleBalanceVisibility}
            title={isBalanceHidden ? 'Show balance' : 'Hide balance'}
            className="p-1.5 rounded hover:bg-[#2B313A] text-[#848E9C] hover:text-[#EAECEF] transition-colors cursor-pointer flex items-center space-x-1"
          >
            {isBalanceHidden ? (
              <EyeOff className="w-4 h-4 text-[#F0B90B]" />
            ) : (
              <Eye className="w-4 h-4 text-[#848E9C]" />
            )}
            <span className="hidden xl:inline text-[11px] text-[#848E9C]">
              {isBalanceHidden ? 'Hidden' : 'Visible'}
            </span>
          </button>

          {/* Engine Status Ping */}
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#2B313A]/50 text-[11px] font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                serverOnline ? 'bg-[#0ECB81]' : 'bg-[#F6465D]'
              }`}
            ></span>
            <span className={serverOnline ? 'text-[#0ECB81]' : 'text-[#F6465D]'}>
              {latency}ms
            </span>
          </div>

          {/* Notification Bell */}
          <button
            title="System notifications"
            className="p-1.5 rounded hover:bg-[#2B313A] text-[#848E9C] hover:text-[#EAECEF] transition-colors cursor-pointer relative"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-[#F0B90B] absolute top-1 right-1"></span>
          </button>

          {/* Security / Acid badge */}
          <div className="hidden lg:flex items-center space-x-1 px-2.5 py-1 rounded bg-[#2B313A]/50 text-[#848E9C]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0ECB81]" />
            <span className="text-[11px]">2FA Verified</span>
          </div>

          {/* User Profile & Sign Out */}
          {userEmail && (
            <div className="flex items-center space-x-2 pl-2 border-l border-[#2B313A]">
              <div className="w-7 h-7 rounded-full bg-[#2B313A] text-[#EAECEF] flex items-center justify-center font-bold text-xs uppercase border border-[#848E9C]/30">
                {userEmail.charAt(0)}
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="text-[11px] text-[#848E9C] hover:text-[#F6465D] font-medium transition-colors cursor-pointer"
                >
                  Log Out
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
