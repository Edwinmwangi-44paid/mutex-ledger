import React, { useState } from 'react';
import {
  Wallet,
  User,
  Send,
  Zap,
  ShieldCheck,
  Flame,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import { WalletNode, UserProfile } from '../types';

interface ClientWalletInterfaceProps {
  user: UserProfile;
  wallet: WalletNode;
  allWallets: WalletNode[];
  onRefreshWallet: () => void;
  onExecuteTransfer: (destWalletId: string, amount: number) => Promise<boolean>;
  onTriggerParallelStressBlast: (destWalletId: string, blastAmount: number) => Promise<void>;
  isTransferring: boolean;
  isBlasting: boolean;
}

export const ClientWalletInterface: React.FC<ClientWalletInterfaceProps> = ({
  user,
  wallet,
  allWallets,
  onRefreshWallet,
  onExecuteTransfer,
  onTriggerParallelStressBlast,
  isTransferring,
  isBlasting,
}) => {
  const [targetWalletId, setTargetWalletId] = useState('');
  const [transferAmount, setTransferAmount] = useState('100.00');
  const [stressAmount, setStressAmount] = useState('200.00');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [transferFeedback, setTransferFeedback] = useState<{ type: 'SUCCESS' | 'ERROR'; msg: string } | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Filter other wallets available for transfer
  const otherWallets = allWallets.filter((w) => w.id !== wallet.id);

  const handleManualTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferFeedback(null);

    const amt = parseFloat(transferAmount);
    if (isNaN(amt) || amt <= 0) {
      setTransferFeedback({ type: 'ERROR', msg: 'Transfer amount must be greater than zero.' });
      return;
    }
    if (!targetWalletId.trim()) {
      setTransferFeedback({ type: 'ERROR', msg: 'Destination wallet UUID is required.' });
      return;
    }
    if (targetWalletId.trim() === wallet.id) {
      setTransferFeedback({ type: 'ERROR', msg: 'Cannot transfer funds to your own wallet.' });
      return;
    }

    const success = await onExecuteTransfer(targetWalletId.trim(), amt);
    if (success) {
      setTransferFeedback({
        type: 'SUCCESS',
        msg: `Transaction settled: $${amt.toFixed(2)} transferred to ${targetWalletId.slice(0, 8)}...`,
      });
      setTransferAmount('100.00');
    } else {
      setTransferFeedback({
        type: 'ERROR',
        msg: 'Transaction rejected: Insufficient settled balance or concurrent lock limit.',
      });
    }
  };

  const handleStressBlastClick = () => {
    const amt = parseFloat(stressAmount);
    const destination = targetWalletId || (otherWallets[0]?.id ?? '310cb912-0000-0000-0000-000000000002');
    onTriggerParallelStressBlast(destination, isNaN(amt) ? 200.0 : amt);
  };

  return (
    <div className="space-y-4">
      {/* Top Split: Account Profile Card + Prominent Wallet Balance Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Authenticated User Profile Card */}
        <div className="bg-[#0E141B] border border-[#1E293B] rounded-2xl p-5 flex flex-col justify-between hover:border-[#2D3B4E] transition-all">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
              <span className="text-xs font-medium text-slate-400 flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>Account Profile</span>
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
                JWT Valid
              </span>
            </div>

            <div>
              <div className="text-[11px] text-slate-500 mb-0.5">Email Identifier</div>
              <div className="text-xs font-semibold text-slate-200 truncate">{user.email}</div>
            </div>

            <div>
              <div className="text-[11px] text-slate-500 mb-1 flex items-center justify-between">
                <span>Wallet UUID</span>
                <button
                  onClick={() => copyToClipboard(wallet.id, 'wallet-id')}
                  className="text-[10px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 cursor-pointer"
                >
                  {copiedId === 'wallet-id' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedId === 'wallet-id' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="text-[11px] text-emerald-400/90 font-mono bg-[#090D11] p-2 rounded-lg border border-[#1E293B] break-all select-all">
                {wallet.id}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#1E293B] mt-3 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Bcrypt 12 Rounds</span>
            <span>TTL 3600s</span>
          </div>
        </div>

        {/* Prominent High-End Balance Card */}
        <div className="md:col-span-2 bg-gradient-to-br from-[#0E141B] via-[#0E141B] to-[#121b24] border border-[#1E293B] rounded-2xl p-6 relative flex flex-col justify-between shadow-xl shadow-black/40 overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 blur-3xl pointer-events-none rounded-full" />

          <div className="flex items-center justify-between border-b border-[#1E293B] pb-3 mb-4 relative z-10">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-xs font-medium text-slate-300">
                Liquid Settled Balance
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 text-xs font-mono font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {wallet.currency || 'USD'}
              </span>
              <button
                onClick={onRefreshWallet}
                title="Synchronize balance with ledger"
                className="p-1.5 rounded-lg bg-[#090D11] border border-[#1E293B] text-slate-400 hover:text-emerald-400 hover:border-emerald-500/40 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Clean Prominent Balance Display */}
          <div className="my-auto py-2 relative z-10">
            <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
              <span>Available Funds</span>
              <span className="text-emerald-400 text-[11px] font-mono">Exact Numeric(20,4)</span>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white font-mono tabular-nums">
                ${Number(wallet.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-sm font-mono text-slate-500">USD</span>
            </div>
          </div>

          <div className="pt-3 border-t border-[#1E293B] flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2 relative z-10">
            <div className="flex items-center space-x-1.5 text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>SQL Check Constraint: <code className="text-slate-300 font-mono text-[11px]">balance &gt;= 0.0000</code></span>
            </div>
            <div className="text-slate-400 font-mono text-[11px]">
              Invariant Guaranteed
            </div>
          </div>
        </div>
      </div>

      {/* Operations Split: Transfer Form + Concurrency Stress Test */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Localized Transfer Form */}
        <div className="bg-[#0E141B] border border-[#1E293B] rounded-2xl p-5 hover:border-[#2D3B4E] transition-all">
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-3 mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Send className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span className="text-xs font-semibold text-slate-200">
                Direct Ledger Transfer
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Deadlock-Free Sorted Locking</span>
          </div>

          {transferFeedback && (
            <div
              className={`mb-4 p-3 rounded-xl border text-xs flex items-center space-x-2.5 ${
                transferFeedback.type === 'SUCCESS'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {transferFeedback.type === 'SUCCESS' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span className="leading-relaxed">{transferFeedback.msg}</span>
            </div>
          )}

          <form onSubmit={handleManualTransfer} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Destination Wallet UUID</span>
                <span className="text-[10px] text-slate-500 font-mono">Select Peer</span>
              </label>

              {otherWallets.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {otherWallets.map((w, idx) => (
                    <button
                      type="button"
                      key={w.id}
                      onClick={() => setTargetWalletId(w.id)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer truncate max-w-[210px] font-mono ${
                        targetWalletId === w.id
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-medium'
                          : 'border-[#1E293B] bg-[#090D11] text-slate-400 hover:border-slate-600 hover:text-slate-200'
                      }`}
                    >
                      {w.name || `Peer ${idx + 1}`} ({w.id.slice(0, 8)}...)
                    </button>
                  ))}
                </div>
              )}

              <input
                type="text"
                required
                value={targetWalletId}
                onChange={(e) => setTargetWalletId(e.target.value)}
                placeholder="00000000-0000-0000-0000-000000000000"
                className="w-full bg-[#090D11] border border-[#1E293B] focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/50 rounded-xl p-2.5 text-xs text-slate-100 font-mono placeholder:text-slate-600 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Transfer Amount ({wallet.currency || 'USD'})</span>
                <span className="text-[11px] text-slate-500 font-mono">Max: ${Number(wallet.balance).toFixed(2)}</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs text-slate-500 font-mono">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full bg-[#090D11] border border-[#1E293B] focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/50 rounded-xl py-2.5 pl-8 pr-3.5 text-xs text-slate-100 font-mono outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isTransferring || isBlasting}
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-semibold text-xs rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {isTransferring ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  Executing Atomic Settlement...
                </span>
              ) : (
                <>
                  <span>Dispatch Settlement</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Concurrency Stress Test Engine */}
        <div className="bg-[#0E141B] border border-[#1E293B] rounded-2xl p-5 flex flex-col justify-between hover:border-[#2D3B4E] transition-all">
          <div>
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3 mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <span className="text-xs font-semibold text-slate-200">
                  Concurrency Stress Engine
                </span>
              </div>
              <span className="text-[10px] text-rose-400 px-2 py-0.5 rounded-full border border-rose-500/20 bg-rose-500/10 font-mono">
                10x Parallel Workers
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-3.5">
              Simulates a live race-condition attack by firing <span className="text-slate-200 font-medium">10 simultaneous requests</span> via{' '}
              <code className="text-emerald-400 font-mono">Promise.all()</code>. PostgreSQL row-locks (<code className="text-emerald-400 font-mono">SELECT FOR UPDATE</code>) process valid debits sequentially while blocking overdraws with{' '}
              <span className="text-rose-400 font-semibold font-mono">HTTP 422</span>.
            </p>

            <div className="bg-[#090D11] border border-[#1E293B] rounded-xl p-3.5 mb-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Burst Request Count:</span>
                <span className="text-emerald-400 font-medium font-mono">10 Parallel Async</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Race Protocol:</span>
                <span className="text-slate-300 font-mono text-[11px]">Promise.all() + X-Idempotency</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Per-Request Amount:</span>
                <div className="flex items-center space-x-1">
                  <span className="text-slate-500 font-mono">$</span>
                  <input
                    type="number"
                    step="10"
                    min="1"
                    value={stressAmount}
                    onChange={(e) => setStressAmount(e.target.value)}
                    className="w-24 bg-[#141C24] border border-[#1E293B] focus:border-rose-500/80 rounded-lg px-2.5 py-1 text-xs text-slate-100 font-mono text-right outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#1E293B] text-[11px]">
                <span className="text-slate-400">Total Burst Volume:</span>
                <span className="text-amber-400 font-semibold font-mono">
                  ${(parseFloat(stressAmount || '0') * 10).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Trigger Stress Button */}
          <button
            type="button"
            onClick={handleStressBlastClick}
            disabled={isBlasting || isTransferring}
            className="w-full py-3 px-4 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 active:from-rose-600 active:to-rose-700 text-white font-semibold text-xs rounded-xl transition-all shadow-lg shadow-rose-500/25 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            {isBlasting ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Firing 10 Concurrent Requests...
              </span>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-current" />
                <span>Trigger Concurrency Stress Blast (10x)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
