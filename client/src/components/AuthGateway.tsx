import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  
} from 'lucide-react';

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
  const navigate = useNavigate();

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

      onAuthSuccess({
        token: data.access_token,
        user: {
          id: data.user_id,
          email: data.email,
          created_at: data.created_at || new Date().toISOString(),
        },
        wallet: data.wallet || { id: 'wallet_main', balance: 0 },
      });
    } catch {
      setErrorMessage('Unable to reach auth server. Please check your network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-12 md:py-16 flex items-center justify-center">
      <div className="w-full max-w-md space-y-4">
        {/* Prominent Back to Landing Page Button */}
        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#141822] hover:bg-[#1C2230] border border-[#232A3B] hover:border-emerald-500/40 text-xs font-semibold text-gray-300 hover:text-white transition-all cursor-pointer shadow-md group"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-emerald-400 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back</span>
          </button>

          <span className="text-[11px] text-gray-500 font-medium">PesaFlip Platform</span>
        </div>

        {/* Brand Auth Card */}
        <div className="rounded-3xl bg-[#12151D] border border-[#202636] p-7 md:p-8 shadow-2xl space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-cyan-500 to-indigo-500 p-[1.5px] shadow-lg shadow-emerald-500/20 mx-auto">
              <div className="w-full h-full bg-[#0D0F12] rounded-[14px] flex items-center justify-center font-black text-white text-xl">
                P
              </div>
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              {mode === 'LOGIN' ? 'Welcome to PesaFlip' : 'Create Your Account'}
            </h2>
            <p className="text-xs text-gray-400">
              Sign in to customize your sports, market, and entertainment feeds.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-[#0B0D12] border border-[#1C212E]">
            <button
              type="button"
              onClick={() => {
                setMode('LOGIN');
                setErrorMessage(null);
              }}
              className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'LOGIN'
                  ? 'bg-[#1C2230] text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
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
              className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'REGISTER'
                  ? 'bg-[#1C2230] text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#0B0D12] border border-[#202534] focus:border-emerald-500 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#0B0D12] border border-[#202534] focus:border-emerald-500 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {mode === 'REGISTER' && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-300">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#0B0D12] border border-[#202534] focus:border-emerald-500 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-[0.99]"
            >
              <span>{isLoading ? 'Authenticating...' : mode === 'LOGIN' ? 'Sign In' : 'Create Free Account'}</span>
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
