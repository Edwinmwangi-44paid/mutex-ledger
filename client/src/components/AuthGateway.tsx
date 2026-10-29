import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowRight, UserPlus, KeyRound } from 'lucide-react';

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
      setErrorMessage('Please enter your email address.');
      return false;
    }
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('Invalid email format. Please provide a valid email address.');
      return false;
    }
    if (!password) {
      setErrorMessage('Password field cannot be empty.');
      return false;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters in length.');
      return false;
    }
    if (mode === 'REGISTER' && password !== confirmPassword) {
      setErrorMessage('Password confirmation does not match.');
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
        let msg = 'Authentication failed. Please verify your credentials.';
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

      // Successful auth
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
      setErrorMessage('Network connection failure. Unable to reach the settlement engine backend.');
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
    <div className="min-h-screen bg-[#181A20] text-[#EAECEF] flex flex-col justify-center items-center p-4 antialiased selection:bg-[#F0B90B] selection:text-[#0B0E11] relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[300px] bg-[#F0B90B]/5 blur-[140px] pointer-events-none rounded-full" />

      <div className="w-full max-w-md relative z-10">
        {/* Binance Exchange Card Container */}
        <div className="bg-[#1E2329] border border-[#2B313A] rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-6 pb-4 border-b border-[#2B313A] bg-[#181A20]/80">
            <div className="flex items-center space-x-3 mb-1.5">
              <div className="w-9 h-9 rounded bg-[#F0B90B] flex items-center justify-center font-extrabold text-[#0B0E11] text-lg shadow-sm">
                <span>P</span>
              </div>
              <div>
                <h1 className="text-base font-bold text-[#EAECEF] tracking-tight">
                  Pesa<span className="text-[#F0B90B]">Flip</span> Portal
                </h1>
                <p className="text-[12px] text-[#848E9C]">
                  Institutional Exchange &amp; Concurrency Ledger
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Mode Selector Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#181A20] rounded border border-[#2B313A] mb-5">
              <button
                type="button"
                onClick={() => {
                  setMode('LOGIN');
                  setErrorMessage(null);
                }}
                className={`py-2 text-xs font-bold rounded transition-all cursor-pointer ${
                  mode === 'LOGIN'
                    ? 'bg-[#2B313A] text-[#F0B90B] shadow-sm'
                    : 'text-[#848E9C] hover:text-[#EAECEF]'
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
                className={`py-2 text-xs font-bold rounded transition-all cursor-pointer ${
                  mode === 'REGISTER'
                    ? 'bg-[#2B313A] text-[#F0B90B] shadow-sm'
                    : 'text-[#848E9C] hover:text-[#EAECEF]'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Error Alert */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded bg-[#F6465D]/10 border border-[#F6465D]/40 text-[#F6465D] text-xs flex items-start space-x-2.5">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-[#F6465D]" />
                <div className="text-[12px] leading-relaxed break-all font-medium">
                  <span className="font-bold mr-1">Error:</span>
                  {errorMessage}
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#848E9C] mb-1.5 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#F0B90B]" />
                    <span>Email Address</span>
                  </span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@pesaflip.io"
                  className="w-full bg-[#181A20] border border-[#2B313A] rounded focus:border-[#F0B90B] focus:outline-none p-2.5 text-xs text-[#EAECEF] transition-all placeholder:text-[#474D57] font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#848E9C] mb-1.5 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#F0B90B]" />
                    <span>Password</span>
                  </span>
                  <span className="text-[10px] text-[#848E9C] font-mono">Bcrypt Enforced</span>
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#181A20] border border-[#2B313A] rounded focus:border-[#F0B90B] focus:outline-none p-2.5 text-xs text-[#EAECEF] transition-all placeholder:text-[#474D57] font-mono"
                />
              </div>

              {mode === 'REGISTER' && (
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#848E9C] mb-1.5 flex items-center space-x-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#F0B90B]" />
                    <span>Confirm Password</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#181A20] border border-[#2B313A] rounded focus:border-[#F0B90B] focus:outline-none p-2.5 text-xs text-[#EAECEF] transition-all placeholder:text-[#474D57] font-mono"
                  />
                </div>
              )}

              {mode === 'REGISTER' && (
                <div className="p-3 rounded border border-[#2B313A] bg-[#181A20] text-[11px] text-[#848E9C] space-y-1">
                  <div className="text-[#0ECB81] font-bold">Seed Balance Guarantee:</div>
                  <div>Default wallet will be provisioned with <span className="text-[#EAECEF] font-bold font-mono">$1,000.00 USD</span> liquid collateral.</div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 rounded bg-[#F0B90B] hover:bg-[#FCD535] text-[#0B0E11] text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
              >
                {isLoading ? (
                  <span className="animate-pulse">Authorizing Session...</span>
                ) : mode === 'LOGIN' ? (
                  <>
                    <span>Log In to Wallet</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Create Wallet Account</span>
                    <UserPlus className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Identities */}
            <div className="mt-5 pt-4 border-t border-[#2B313A]">
              <div className="text-[11px] font-semibold text-[#848E9C] uppercase mb-2 flex items-center justify-between">
                <span>Demo Trading Accounts</span>
                <span className="text-[#F0B90B] text-[10px]">Click to fill</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  'agent.smith@pesaflip.io',
                  'operator.neo@pesaflip.io',
                  'trinity.cipher@pesaflip.io',
                  'morpheus.root@pesaflip.io',
                ].map((demo) => (
                  <button
                    key={demo}
                    type="button"
                    onClick={() => handleQuickSeedLogin(demo)}
                    className="p-2 rounded bg-[#181A20] border border-[#2B313A] hover:border-[#F0B90B] text-left truncate transition-all text-[#848E9C] hover:text-[#F0B90B] font-mono text-[11px] cursor-pointer"
                  >
                    {demo}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sub-footer */}
        <div className="mt-4 text-center text-[11px] text-[#848E9C]">
          PesaFlip Exchange • 2FA Protected • Strict Serializable Row-Locks
        </div>
      </div>
    </div>
  );
};
