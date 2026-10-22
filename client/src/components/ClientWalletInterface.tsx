import React, { useState } from 'react';
import {
  Wallet,
  User,
  Send,
  Zap,
  ShieldCheck,
  Flame,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
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
  const [transferFeedback, setTransferFeedback] = useState<{ type: 'SUCCESS' | 'ERROR'; msg: string } | null>(null);

  // Filter other wallets available for transfer
  const otherWallets = allWallets.filter((w) => w.id !== wallet.id);

  const handleManualTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferFeedback(null);

    const amt = parseFloat(transferAmount);
    if (isNaN(amt) || amt <= 0) {
      setTransferFeedback({ type: 'ERROR', msg: 'INVALID_AMOUNT: Amount must be greater than zero.' });
      return;
    }
    if (!targetWalletId.trim()) {
      setTransferFeedback({ type: 'ERROR', msg: 'DESTINATION_REQUIRED: Provide destination Wallet UUID.' });
      return;
    }
    if (targetWalletId.trim() === wallet.id) {
      setTransferFeedback({ type: 'ERROR', msg: 'ROUTING_FAULT: Cannot transfer funds to own wallet.' });
      return;
    }

    const success = await onExecuteTransfer(targetWalletId.trim(), amt);
    if (success) {
      setTransferFeedback({
        type: 'SUCCESS',
        msg: `TRANSACTION_COMMITTED: $${amt.toFixed(2)} sent to ${targetWalletId.slice(0, 8)}...`,
      });
      setTransferAmount('100.00');
    } else {
      setTransferFeedback({
        type: 'ERROR',
        msg: 'TRANSACTION_BLOCKED: Transfer rejected by backend mutex or insufficient balance.',
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
      {/* Top Split: Profile Card + Wallet Balance Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Authenticated User Profile Card */}
        <div className="bg-[#131A20] border border-[#222F3A] p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#222F3A] pb-2">
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-[#10B981]" />
                <span>ACTIVE_AUTHENTICATED_PROFILE</span>
              </span>
              <span className="text-[10px] text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 border border-[#10B981]/30">
                JWT_AUTHENTICATED
              </span>
            </div>

            <div>
              <div className="text-[10px] uppercase text-[#64748B] mb-0.5">IDENTIFIER (EMAIL)</div>
              <div className="text-sm font-bold text-[#E2E8F0] truncate">{user.email}</div>
            </div>

            <div>
              <div className="text-[10px] uppercase text-[#64748B] mb-0.5">USER_UUID</div>
              <div className="text-xs text-[#94A3B8] font-mono select-all bg-[#0B0F12] p-1.5 border border-[#222F3A] break-all">
                {user.id}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase text-[#64748B] mb-0.5">OWNED_WALLET_UUID</div>
              <div className="text-xs text-[#10B981] font-mono select-all bg-[#0B0F12] p-1.5 border border-[#222F3A] break-all">
                {wallet.id}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#222F3A] mt-3 flex items-center justify-between text-[10px] text-[#64748B]">
            <span>ROUNDS: BCRYPT_12</span>
            <span>TOKEN_EXPIRY: 3600s</span>
          </div>
        </div>

        {/* Prominent Highly Styled Wallet Balance Card */}
        <div className="md:col-span-2 bg-[#131A20] border border-[#222F3A] p-6 relative flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between border-b border-[#222F3A] pb-3 mb-4">
            <div className="flex items-center space-x-2">
              <Wallet className="w-5 h-5 text-[#10B981]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#E2E8F0]">
                WALLET BALANCE STATE // LIQUID ASSET LEDGER
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {/* Currency Badge */}
              <span className="px-2.5 py-1 text-xs font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981] tracking-widest">
                {wallet.currency || 'USD'}
              </span>
              <button
                onClick={onRefreshWallet}
                title="Synchronize balance with DB"
                className="p-1.5 bg-[#0B0F12] border border-[#222F3A] text-[#94A3B8] hover:text-[#10B981] hover:border-[#10B981] transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right-aligned monospaced digits formatted exactly to two decimal places */}
          <div className="my-auto py-2">
            <div className="text-[11px] text-[#64748B] uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>AVAILABLE_SETTLED_CASH</span>
              <span className="text-[#10B981]">// ZERO_FLOATING_POINT_DRIFT</span>
            </div>
            <div className="text-right">
              <span className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#E2E8F0] font-mono selection:bg-[#10B981] selection:text-[#0B0F12]">
                ${Number(wallet.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-[#222F3A] flex flex-wrap items-center justify-between text-[11px] text-[#64748B] gap-2">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-[#10B981]" />
              <span>CHECK CONSTRAINT: balance &gt;= 0.0000 ENFORCED</span>
            </div>
            <div className="text-[#94A3B8] font-mono">
              PRECISION: NUMERIC(20,4)
            </div>
          </div>
        </div>
      </div>

      {/* Operations Split: Localized Transfer Form + Concurrency Stress Blast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Localized Transfer Form */}
        <div className="bg-[#131A20] border border-[#222F3A] p-5">
          <div className="flex items-center justify-between border-b border-[#222F3A] pb-2 mb-4">
            <div className="flex items-center space-x-2">
              <Send className="w-4 h-4 text-[#10B981]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#E2E8F0]">
                LOCALIZED CLIENT TRANSFER
              </span>
            </div>
            <span className="text-[10px] text-[#64748B]">// DEADLOCK_FREE_SORTED</span>
          </div>

          {transferFeedback && (
            <div
              className={`mb-4 p-2.5 border text-xs flex items-center space-x-2 font-mono ${
                transferFeedback.type === 'SUCCESS'
                  ? 'bg-[#10B981]/10 border-[#10B981] text-[#10B981]'
                  : 'bg-[#EF4444]/10 border-[#EF4444] text-[#EF4444]'
              }`}
            >
              {transferFeedback.type === 'SUCCESS' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span className="text-[11px] break-all">{transferFeedback.msg}</span>
            </div>
          )}

          <form onSubmit={handleManualTransfer} className="space-y-3">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#64748B] mb-1 flex items-center justify-between">
                <span>DESTINATION WALLET UUID</span>
                <span className="text-[10px] text-[#10B981]">SELECT OR PASTE</span>
              </label>

              {otherWallets.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {otherWallets.map((w, idx) => (
                    <button
                      type="button"
                      key={w.id}
                      onClick={() => setTargetWalletId(w.id)}
                      className={`text-[10px] px-2 py-1 border transition-colors cursor-pointer truncate max-w-[200px] ${
                        targetWalletId === w.id
                          ? 'border-[#10B981] text-[#10B981] bg-[#10B981]/10'
                          : 'border-[#222F3A] text-[#94A3B8] hover:border-[#10B981]/50'
                      }`}
                    >
                      {w.name || `PEER_${idx + 1}`} ({w.id.slice(0, 8)}...)
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
                className="w-full bg-[#0B0F12] border border-[#222F3A] focus:border-[#10B981] focus:outline-none p-2 text-xs text-[#E2E8F0] font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#64748B] mb-1 flex items-center justify-between">
                <span>TRANSFER AMOUNT ({wallet.currency || 'USD'})</span>
                <span className="text-[10px] text-[#64748B]">MAX: ${Number(wallet.balance).toFixed(2)}</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-[#64748B] font-mono">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full bg-[#0B0F12] border border-[#222F3A] focus:border-[#10B981] focus:outline-none py-2 pl-7 pr-3 text-xs text-[#E2E8F0] font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isTransferring || isBlasting}
              className="w-full py-2.5 bg-[#10B981] hover:bg-[#059669] text-[#0B0F12] font-bold text-xs uppercase tracking-wider transition-colors border border-[#10B981] flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {isTransferring ? (
                <span>EXECUTING_ATOMIC_TX...</span>
              ) : (
                <>
                  <span>DISPATCH_TRANSFER</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* The Concurrency Stress Button & Section */}
        <div className="bg-[#131A20] border border-[#222F3A] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#222F3A] pb-2 mb-3">
              <div className="flex items-center space-x-2">
                <Flame className="w-4 h-4 text-[#EF4444]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#E2E8F0]">
                  CONCURRENCY STRESS BLAST ENGINE
                </span>
              </div>
              <span className="text-[10px] text-[#EF4444] px-1.5 py-0.5 border border-[#EF4444]/30 bg-[#EF4444]/10">
                10x PARALLEL WORKERS
              </span>
            </div>

            <p className="text-[11px] text-[#94A3B8] leading-relaxed mb-3">
              Fires <span className="text-[#E2E8F0] font-bold">10 simultaneous fetch requests</span> using{' '}
              <code className="text-[#10B981]">Promise.all()</code> to force a balance race condition on your own account.
              Under pessimistic row-locking (<code className="text-[#10B981]">SELECT ... FOR UPDATE</code>), legitimate requests
              process atomically, while concurrent bursts that exceed available funds are gracefully rejected with{' '}
              <span className="text-[#EF4444] font-bold">HTTP 422 (BLOCKED_BY_MUTEX)</span>.
            </p>

            <div className="bg-[#0B0F12] border border-[#222F3A] p-3 mb-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#64748B]">BURST PACKET COUNT:</span>
                <span className="text-[#10B981] font-bold font-mono">10 ASYNC REQUESTS</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#64748B]">DISPATCH PROTOCOL:</span>
                <span className="text-[#E2E8F0] font-mono">Promise.all() + X-Idempotency-Key</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#64748B]">PER-REQUEST AMOUNT:</span>
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-[#64748B]">$</span>
                  <input
                    type="number"
                    step="10"
                    min="1"
                    value={stressAmount}
                    onChange={(e) => setStressAmount(e.target.value)}
                    className="w-20 bg-[#131A20] border border-[#222F3A] px-2 py-0.5 text-xs text-[#E2E8F0] font-mono text-right"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-1 border-t border-[#222F3A]">
                <span>TOTAL ATTEMPTED EXPOSURE:</span>
                <span className="text-[#F59E0B] font-bold font-mono">
                  ${(parseFloat(stressAmount || '0') * 10).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* The Concurrency Stress Button */}
          <button
            type="button"
            onClick={handleStressBlastClick}
            disabled={isBlasting || isTransferring}
            className="w-full py-3.5 bg-[#EF4444] hover:bg-[#DC2626] text-[#0B0F12] font-extrabold text-xs tracking-widest uppercase transition-all border border-[#EF4444] flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 shadow-[0_0_20px_rgba(239,68,68,0.35)] active:translate-y-0.5"
          >
            {isBlasting ? (
              <span className="animate-pulse">BLASTING 10 PARALLEL FETCH REQUESTS...</span>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-current" />
                <span>TRIGGER_PARALLEL_STRESS_BLAST</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
