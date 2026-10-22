import React, { useState } from 'react';
import { ShieldAlert, Terminal, Lock, Mail, ArrowRight, UserPlus, KeyRound } from 'lucide-react';

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
      setErrorMessage('VALIDATION_FAULT: Email input cannot be empty.');
      return false;
    }
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('VALIDATION_FAULT: Malformed cryptographic email address format.');
      return false;
    }
    if (!password) {
      setErrorMessage('VALIDATION_FAULT: Password secret cannot be empty.');
      return false;
    }
    if (password.length < 6) {
      setErrorMessage('VALIDATION_FAULT: Password entropy too low (minimum 6 characters required).');
      return false;
    }
    if (mode === 'REGISTER' && password !== confirmPassword) {
      setErrorMessage('VALIDATION_FAULT: Password checksum mismatch with confirmation field.');
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
        let msg = 'AUTHENTICATION_GATEWAY_REJECTION: Access Denied.';
        if (typeof data.detail === 'string') {
          msg = data.detail;
        } else if (Array.isArray(data.detail) && data.detail[0]?.msg) {
          msg = `VALIDATION_FAULT: ${data.detail[0].msg}`;
        } else if (data.detail?.message) {
          msg = data.detail.message;
        }
        setErrorMessage(msg.toUpperCase());
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
      setErrorMessage('NETWORK_FAULT: Unable to establish handshake with Mutex Ledger Core daemon.');
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
    <div className="min-h-screen bg-[#0B0F12] text-[#E2E8F0] font-mono flex flex-col justify-center items-center p-4 antialiased selection:bg-[#222F3A] selection:text-[#10B981]">
      {/* Background terminal grid subtle accents */}
      <div className="w-full max-w-md">
        {/* Terminal Header Bar */}
        <div className="bg-[#131A20] border border-[#222F3A] border-b-0 p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 bg-[#EF4444] rounded-none"></span>
            <span className="w-2.5 h-2.5 bg-[#F59E0B] rounded-none"></span>
            <span className="w-2.5 h-2.5 bg-[#10B981] rounded-none"></span>
            <span className="text-[11px] font-bold tracking-widest text-[#64748B] ml-2">
              MUTEX_LEDGER // AUTH_GATEWAY_V4
            </span>
          </div>
          <span className="text-[10px] text-[#10B981] px-1.5 py-0.5 border border-[#10B981]/30 bg-[#10B981]/10">
            TLS_PESSIMISTIC_LOCK
          </span>
        </div>

        {/* Main Cryptographic Terminal Surface Card */}
        <div className="bg-[#131A20] border border-[#222F3A] p-6 shadow-2xl relative">
          <div className="mb-6 border-b border-[#222F3A] pb-4">
            <div className="flex items-center space-x-2 text-[#10B981] mb-1">
              <Terminal className="w-5 h-5" />
              <h1 className="text-base font-bold tracking-wider uppercase">
                MUTEX LEDGER CORE
              </h1>
            </div>
            <p className="text-[11px] text-[#64748B]">
              Deterministic High-Concurrency Double-Entry Accounting Daemon
            </p>
          </div>

          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('LOGIN');
                setErrorMessage(null);
              }}
              className={`py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                mode === 'LOGIN'
                  ? 'bg-[#10B981] text-[#0B0F12] border-[#10B981] shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                  : 'bg-[#0B0F12] text-[#64748B] border-[#222F3A] hover:text-[#E2E8F0]'
              }`}
            >
              [ 01_LOGIN ]
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('REGISTER');
                setErrorMessage(null);
              }}
              className={`py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                mode === 'REGISTER'
                  ? 'bg-[#10B981] text-[#0B0F12] border-[#10B981] shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                  : 'bg-[#0B0F12] text-[#64748B] border-[#222F3A] hover:text-[#E2E8F0]'
              }`}
            >
              [ 02_REGISTER ]
            </button>
          </div>

          {/* Industrial Warning Red Typography for Error States */}
          {errorMessage && (
            <div className="mb-5 p-3 bg-[#EF4444]/10 border border-[#EF4444] text-[#EF4444] text-xs flex items-start space-x-2.5 animate-pulse">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="font-mono text-[11px] leading-relaxed break-all">
                <span className="font-bold underline tracking-wider mr-1">[CRITICAL_FAULT]:</span>
                {errorMessage}
              </div>
            </div>
          )}

          {/* Geometric Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#64748B] mb-1.5 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>CLIENT_EMAIL_IDENTIFIER</span>
                </span>
                <span className="text-[9px] text-[#475569]">// RFC_5322</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent.smith@mutex.core"
                className="w-full bg-[#0B0F12] border border-[#222F3A] focus:border-[#10B981] focus:outline-none p-2.5 text-xs text-[#E2E8F0] font-mono transition-colors placeholder:text-[#334155]"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#64748B] mb-1.5 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>BCRYPT_SECRET_KEY</span>
                </span>
                <span className="text-[9px] text-[#475569]">// 12_ROUNDS</span>
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#0B0F12] border border-[#222F3A] focus:border-[#10B981] focus:outline-none p-2.5 text-xs text-[#E2E8F0] font-mono transition-colors placeholder:text-[#334155]"
              />
            </div>

            {mode === 'REGISTER' && (
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#64748B] mb-1.5 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>CONFIRM_SECRET_KEY</span>
                  </span>
                  <span className="text-[9px] text-[#475569]">// VERIFY</span>
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#0B0F12] border border-[#222F3A] focus:border-[#10B981] focus:outline-none p-2.5 text-xs text-[#E2E8F0] font-mono transition-colors placeholder:text-[#334155]"
                />
              </div>
            )}

            {mode === 'REGISTER' && (
              <div className="p-2.5 border border-[#222F3A] bg-[#0B0F12] text-[10px] text-[#64748B] space-y-1">
                <div className="text-[#10B981] font-bold">// AUTOMATIC_SEED_INITIALIZATION:</div>
                <div>Default Wallet will be created with seed balance: <span className="text-[#10B981] font-bold">$1,000.00 USD</span></div>
                <div>Check Constraint: <code className="text-[#E2E8F0]">balance &gt;= 0</code> enforced.</div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 bg-[#10B981] hover:bg-[#059669] text-[#0B0F12] text-xs font-bold uppercase tracking-widest transition-all border border-[#10B981] flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(16,185,129,0.3)] active:translate-y-0.5"
            >
              {isLoading ? (
                <span>SYNCHRONIZING_HANDSHAKE...</span>
              ) : mode === 'LOGIN' ? (
                <>
                  <span>AUTHENTICATE_SESSION</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>INSTANTIATE_USER_&amp;_WALLET</span>
                  <UserPlus className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Seed Credentials */}
          <div className="mt-6 pt-4 border-t border-[#222F3A]">
            <div className="text-[10px] font-bold text-[#64748B] uppercase mb-2 flex items-center justify-between">
              <span>// PRE-SEEDED TEST IDENTITIES:</span>
              <span className="text-[#10B981]">CLICK TO FILL</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <button
                type="button"
                onClick={() => handleQuickSeedLogin('agent.smith@mutex.core')}
                className="p-1.5 bg-[#0B0F12] border border-[#222F3A] hover:border-[#10B981] text-left truncate transition-colors text-[#94A3B8] hover:text-[#10B981]"
              >
                agent.smith@mutex.core
              </button>
              <button
                type="button"
                onClick={() => handleQuickSeedLogin('operator.neo@mutex.core')}
                className="p-1.5 bg-[#0B0F12] border border-[#222F3A] hover:border-[#10B981] text-left truncate transition-colors text-[#94A3B8] hover:text-[#10B981]"
              >
                operator.neo@mutex.core
              </button>
              <button
                type="button"
                onClick={() => handleQuickSeedLogin('trinity.cipher@mutex.core')}
                className="p-1.5 bg-[#0B0F12] border border-[#222F3A] hover:border-[#10B981] text-left truncate transition-colors text-[#94A3B8] hover:text-[#10B981]"
              >
                trinity.cipher@mutex.core
              </button>
              <button
                type="button"
                onClick={() => handleQuickSeedLogin('morpheus.root@mutex.core')}
                className="p-1.5 bg-[#0B0F12] border border-[#222F3A] hover:border-[#10B981] text-left truncate transition-colors text-[#94A3B8] hover:text-[#10B981]"
              >
                morpheus.root@mutex.core
              </button>
            </div>
          </div>
        </div>

        {/* Cryptographic Sub-footer */}
        <div className="mt-4 text-center text-[10px] text-[#475569]">
          CIPHER: AES_256_GCM // JWT_EXPIRATION: 3600_SECONDS // SEED_BALANCE: $1,000.00
        </div>
      </div>
    </div>
  );
};
