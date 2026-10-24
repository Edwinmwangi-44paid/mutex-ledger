import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowRight, UserPlus, KeyRound, AlertCircle, Cpu, CheckCircle } from 'lucide-react';

interface AuthGatewayProps {
  onAuthSuccess: (session: { token: string; user: any; wallet: any }) => void;
  apiBase: string;
}

export const AuthGateway: React.FC<AuthGatewayProps> = ({ onAuthSuccess, apiBase }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    setErrorMessage(null);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setErrorMessage('Email address cannot be empty.');
      return false;
    }
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return false;
    }
    if (!password) {
      setErrorMessage('Password cannot be empty.');
      return false;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return false;
    }
    if (mode === 'REGISTER' && password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrorMessage(null);

    const endpoint = mode === 'LOGIN' ? `${apiBase}/auth/login` : `${apiBase}/auth/register`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok) {
        let msg = 'Authentication failed. Please check your credentials.';
        if (typeof data.detail === 'string') {
          msg = data.detail;
        } else if (Array.isArray(data.detail) && data.detail[0]?.msg) {
          msg = data.detail[0].msg;
        } else if (data.detail?.message) {
          msg = data.detail.message;
        }
        setErrorMessage(msg);
        return;
      }

      onAuthSuccess({
        token: data.access_token,
        user: {
          id: data.user_id,
          email: data.email,
          created_at: data.created_at || new Date().toISOString(),
        },
        wallet: data.wallet || {
          id: '00000000-0000-0000-0000-000000000000',
          currency: 'USD',
          balance: 1000.0,
        },
      });
    } catch {
      setErrorMessage('Unable to connect to Mutex Ledger backend daemon. Ensure the server is running on port 8000.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSeedLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#090D11] bg-grid-subtle flex flex-col justify-center items-center p-4 relative antialiased selection:bg-[#10B981]/20 selection:text-[#34D399]">
      {/* Subtle ambient glow behind the card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-emerald-500/5 blur-[120px] pointer-events-none rounded-full" />

      <div className="w-full max-w-md relative z-10 space-y-4">
        {/* Main Institutional Card */}
        <div className="bg-[#0E141B] border border-[#1E293B] rounded-2xl p-7 shadow-2xl shadow-black/80 backdrop-blur-sm">
          {/* Brand Header */}
          <div className="flex items-center justify-between mb-6 pb-5 border-b border-[#1E293B]">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
                <div className="w-full h-full bg-[#0E141B] rounded-[10px] flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <div>
                <h1 className="text-base font-semibold text-slate-100 tracking-tight flex items-center gap-2">
                  Mutex Ledger
                  <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Core v2.5
                  </span>
                </h1>
                <p className="text-xs text-slate-400">Deterministic Double-Entry Settlement</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>ACID 422</span>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="grid grid-cols-2 p-1 bg-[#090D11] border border-[#1E293B] rounded-xl mb-5">
            <button
              type="button"
              onClick={() => {
                setMode('LOGIN');
                setErrorMessage(null);
              }}
              className={`py-2 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                mode === 'LOGIN'
                  ? 'bg-[#141C24] text-white shadow-sm border border-[#2D3B4E]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('REGISTER');
                setErrorMessage(null);
              }}
              className={`py-2 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                mode === 'REGISTER'
                  ? 'bg-[#141C24] text-white shadow-sm border border-[#2D3B4E]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Register Node
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="leading-relaxed font-sans">{errorMessage}</div>
            </div>
          )}

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Email Address</span>
                <span className="text-[10px] text-slate-500 font-mono">User ID</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@mutex-ledger.io"
                  className="w-full bg-[#090D11] border border-[#1E293B] focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/50 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 transition-all outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Password</span>
                <span className="text-[10px] text-slate-500 font-mono">Bcrypt (12 Rounds)</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#090D11] border border-[#1E293B] focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/50 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 transition-all outline-none font-mono"
                />
              </div>
            </div>

            {mode === 'REGISTER' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Confirm Password</span>
                  <span className="text-[10px] text-slate-500 font-mono">Match</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#090D11] border border-[#1E293B] focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/50 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 transition-all outline-none font-mono"
                  />
                </div>
              </div>
            )}

            {mode === 'REGISTER' && (
              <div className="p-3 rounded-xl bg-slate-900/60 border border-[#1E293B] text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center space-x-1.5 text-emerald-400 font-medium">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Seed Wallet Provisioning</span>
                </div>
                <p className="text-slate-400">
                  New nodes receive a funded <strong className="text-slate-200">$1,000.00 USD</strong> double-entry wallet with SQL constraints enforced.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-semibold text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : mode === 'LOGIN' ? (
                <>
                  <span>Sign In to Terminal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Create Account &amp; Wallet</span>
                  <UserPlus className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Identities */}
          <div className="mt-6 pt-5 border-t border-[#1E293B]">
            <div className="text-[11px] font-medium text-slate-400 mb-2 flex items-center justify-between">
              <span>Quick Test Accounts</span>
              <span className="text-[10px] text-slate-500 font-mono">Click to autofill</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { name: 'Agent Smith', email: 'agent.smith@mutex.core' },
                { name: 'Operator Neo', email: 'operator.neo@mutex.core' },
                { name: 'Trinity Cipher', email: 'trinity.cipher@mutex.core' },
                { name: 'Morpheus Root', email: 'morpheus.root@mutex.core' },
              ].map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleQuickSeedLogin(acc.email)}
                  className="p-2 rounded-lg bg-[#090D11] border border-[#1E293B] hover:border-emerald-500/50 hover:bg-[#141C24] text-left transition-all cursor-pointer group"
                >
                  <div className="text-[11px] font-medium text-slate-300 group-hover:text-emerald-400 truncate">
                    {acc.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">{acc.email}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security verification tag */}
        <div className="flex items-center justify-center space-x-3 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400/80" />
            Row-Lock Protected
          </span>
          <span>•</span>
          <span>AES-256 Idempotent</span>
          <span>•</span>
          <span>Double-Entry Validated</span>
        </div>
      </div>
    </div>
  );
};
