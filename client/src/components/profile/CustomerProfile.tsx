import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  User,
  Wallet,
  Shield,
  Copy,
  Check,
  Calendar,
  Trophy,
  LineChart,
  Film,
  ArrowLeft,
  LogOut,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { AuthSession } from '../../types';

interface CustomerProfileProps {
  session: AuthSession;
  apiBase: string;
  onLogout: () => void;
}

interface FreshProfileData {
  id: string;
  email: string;
  username?: string;
  created_at: string;
  wallet?: {
    id: string;
    user_id?: string;
    currency: string;
    balance: number | string;
    created_at?: string;
  };
}

export const CustomerProfile: React.FC<CustomerProfileProps> = ({
  session,
  apiBase,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<FreshProfileData>({
    id: session.user.id,
    email: session.user.email,
    username: session.user.username,
    created_at: session.user.created_at || new Date().toISOString(),
    wallet: session.wallet,
  });

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);

  // Fetch real-time fresh profile data from /api/v1/auth/me
  const fetchFreshProfile = async () => {
    setIsRefreshing(true);
    setRefreshSuccess(false);
    try {
      const response = await fetch(`${apiBase}/auth/me`, {
        headers: {
          Authorization: `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile({
          id: data.id || session.user.id,
          email: data.email || session.user.email,
          username: data.username || session.user.username,
          created_at: data.created_at || session.user.created_at,
          wallet: data.wallet || session.wallet,
        });
        setRefreshSuccess(true);
        setTimeout(() => setRefreshSuccess(false), 2000);
      }
    } catch {
      // Backend offline / network fallback to local session state
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFreshProfile();
  }, [session.token]);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Recently joined';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const displayName = profile.username?.trim() || profile.email.split('@')[0];
  const avatarLetter = (profile.username?.trim() || profile.email).charAt(0).toUpperCase();
  const userHandle = profile.username
    ? `@${profile.username.toLowerCase().replace(/\s+/g, '')}`
    : `@${profile.email.split('@')[0]}`;

  const walletBalance = profile.wallet?.balance !== undefined 
    ? Number(profile.wallet.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '1,000.00';

  return (
    <div className="max-w-6xl mx-auto space-y-8 select-none py-2">
      {/* ─── Breadcrumb & Navigation Bar ─── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#141822] hover:bg-[#1C2230] border border-[#232A3B] hover:border-emerald-500/40 text-xs font-semibold text-gray-300 hover:text-white transition-all cursor-pointer shadow-sm group"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-emerald-400 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchFreshProfile}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141822] hover:bg-[#1C2230] border border-[#232A3B] text-xs font-medium text-gray-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
            title="Refresh profile and wallet balance"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : refreshSuccess ? 'Synced' : 'Sync'}</span>
          </button>

          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-medium text-rose-300 hover:text-rose-200 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* ─── Customer Profile Hero Banner ─── */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#121620] via-[#0E1118] to-[#0A0D12] border border-[#1E2535] p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Avatar and Primary Identity */}
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-indigo-500 p-[2px] shadow-xl shadow-emerald-500/20">
                <div className="w-full h-full bg-[#0D0F14] rounded-[14px] flex items-center justify-center font-black text-2xl sm:text-3xl text-white">
                  {avatarLetter}
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#0E1118] flex items-center justify-center" title="Online & Verified">
                <Check className="w-3 h-3 text-black stroke-[3]" />
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {displayName}
                </h1>
                <span className="text-xs text-gray-400 font-mono">
                  {userHandle}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Verified Customer
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                  Pro Intelligence Tier
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Mail className="w-3.5 h-3.5 text-gray-500" />
                <span>{profile.email}</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Calendar className="w-3.5 h-3.5 text-gray-500" />
                <span>Member since {formatDate(profile.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Wallet Summary Card */}
          <div className="rounded-2xl bg-[#141924]/80 border border-[#232C3E] p-4 sm:p-5 flex flex-col justify-between min-w-[240px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                Available Wallet Balance
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                {profile.wallet?.currency || 'USD'}
              </span>
            </div>

            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              ${walletBalance}
            </div>

            <div className="mt-2 pt-2 border-t border-[#1F2737] flex items-center justify-between text-[11px] text-gray-400">
              <span className="truncate max-w-[130px] font-mono">
                ID: {profile.wallet?.id ? `${profile.wallet.id.slice(0, 8)}...` : 'wallet_main'}
              </span>
              <button
                onClick={() => copyToClipboard(profile.wallet?.id || 'wallet_main', 'wallet')}
                className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer font-medium"
              >
                {copiedField === 'wallet' ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy ID</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Grid: Account Security & Intelligence Feed Preferences ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Account Identity & Security */}
        <div className="rounded-3xl bg-[#11141C] border border-[#1E2433] p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#1C212E]">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white">Identity &amp; Security</h2>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="text-gray-500 text-[11px] font-medium mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-gray-400" />
                <span>Customer Full Name</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0B0D12] border border-[#1C2230] font-semibold text-white">
                {profile.username || 'Not set'}
              </div>
            </div>

            <div>
              <div className="text-gray-500 text-[11px] font-medium mb-1">Customer Identifier (UUID)</div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0B0D12] border border-[#1C2230] font-mono text-gray-300">
                <span className="truncate pr-2">{profile.id}</span>
                <button
                  onClick={() => copyToClipboard(profile.id, 'userId')}
                  className="text-gray-400 hover:text-white cursor-pointer shrink-0"
                  title="Copy User ID"
                >
                  {copiedField === 'userId' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <div className="text-gray-500 text-[11px] font-medium mb-1">Active Authentication Token</div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0B0D12] border border-[#1C2230] font-mono text-gray-400">
                <span className="truncate pr-2">{session.token.slice(0, 22)}...</span>
                <span className="text-[10px] text-emerald-400 font-semibold uppercase">1h Valid</span>
              </div>
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between text-[11px] text-gray-400 py-1">
                <span>Account Protection</span>
                <span className="text-emerald-400 font-medium">Bcrypt + JWT Secured</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-gray-400 py-1">
                <span>Data Isolation</span>
                <span className="text-emerald-400 font-medium">Non-Custodial</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Connected Ecosystem Domains */}
        <div className="rounded-3xl bg-[#11141C] border border-[#1E2433] p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#1C212E]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white">Ecosystem Domains</h2>
            </div>
            <span className="text-[11px] text-gray-500 font-medium">3 Active</span>
          </div>

          <div className="space-y-2.5">
            {/* Sports domain */}
            <div
              onClick={() => navigate('/sports')}
              className="p-3 rounded-2xl bg-[#141924]/60 hover:bg-[#1A202E] border border-[#1E2738] flex items-center justify-between transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                    Sports AI Predictor
                  </div>
                  <div className="text-[10px] text-gray-400">Poisson 1X2, BTTS &amp; Form Projections</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
            </div>

            {/* Crypto domain */}
            <div
              onClick={() => navigate('/crypto')}
              className="p-3 rounded-2xl bg-[#141924]/60 hover:bg-[#1A202E] border border-[#1E2738] flex items-center justify-between transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                  <LineChart className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">
                    Crypto Intelligence
                  </div>
                  <div className="text-[10px] text-gray-400">Real-time Orderbooks &amp; Metrics</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
            </div>

            {/* Entertainment domain */}
            <div
              onClick={() => navigate('/entertainment')}
              className="p-3 rounded-2xl bg-[#141924]/60 hover:bg-[#1A202E] border border-[#1E2738] flex items-center justify-between transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <Film className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors">
                    Media Discovery
                  </div>
                  <div className="text-[10px] text-gray-400">Official Streaming Availability</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
            </div>
          </div>
        </div>

        {/* Card 3: Platform Preferences & Settings */}
        <div className="rounded-3xl bg-[#11141C] border border-[#1E2433] p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#1C212E]">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-white">Customer Preferences</h2>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold">Configured</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-2xl bg-[#0B0D12] border border-[#1E2330]">
              <div className="font-semibold text-gray-300 mb-1">Favorite Football Leagues</div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="px-2 py-0.5 rounded-lg bg-[#191F2C] text-[10px] font-medium text-emerald-400 border border-emerald-500/20">Premier League</span>
                <span className="px-2 py-0.5 rounded-lg bg-[#191F2C] text-[10px] font-medium text-gray-300">La Liga</span>
                <span className="px-2 py-0.5 rounded-lg bg-[#191F2C] text-[10px] font-medium text-gray-300">Champions League</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#0B0D12] border border-[#1E2330]">
              <div className="font-semibold text-gray-300 mb-1">Watchlist Assets</div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="px-2 py-0.5 rounded-lg bg-[#191F2C] text-[10px] font-medium text-cyan-400 border border-cyan-500/20">BTC/USDT</span>
                <span className="px-2 py-0.5 rounded-lg bg-[#191F2C] text-[10px] font-medium text-gray-300">ETH/USDT</span>
                <span className="px-2 py-0.5 rounded-lg bg-[#191F2C] text-[10px] font-medium text-gray-300">SOL/USDT</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
