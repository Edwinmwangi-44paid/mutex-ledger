import React, { useState } from 'react';
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Repeat,
  TrendingUp,
  User,
  ChevronDown,
  Coins,
} from 'lucide-react';
import { WalletNode, UserProfile } from '../types';
import { AssetDistribution } from './AssetDistribution';
import { LiveOrderBookChart } from './LiveOrderBookChart';

interface ClientWalletInterfaceProps {
  user: UserProfile;
  wallet: WalletNode;
  allWallets: WalletNode[];
  onRefreshWallet: () => void;
  onExecuteTransfer: (destWalletId: string, amount: number) => Promise<boolean>;
  isTransferring: boolean;
  isBalanceHidden: boolean;
  searchFilter: string;
}

export const ClientWalletInterface: React.FC<ClientWalletInterfaceProps> = ({
  wallet,
  allWallets,
  onRefreshWallet,
  onExecuteTransfer,
  isTransferring,
  isBalanceHidden,
  searchFilter,
}) => {
  const [targetWalletId, setTargetWalletId] = useState('');
  const [transferAmount, setTransferAmount] = useState('100.00');
  const [selectedToken, setSelectedToken] = useState<'USD' | 'USDT' | 'BTC' | 'ETH'>('USD');
  const [transferFeedback, setTransferFeedback] = useState<{ type: 'SUCCESS' | 'ERROR'; msg: string } | null>(null);
  const [selectedActionModal, setSelectedActionModal] = useState<'TRANSFER' | 'DEPOSIT' | 'WITHDRAW' | 'CONVERT' | null>(null);

  // Convert USD balance into BTC equivalent
  const btcPrice = 64280.0;
  const balanceBtc = (Number(wallet.balance) / btcPrice).toFixed(6);

  // Filter other wallets available for recipient selection
  const otherWallets = allWallets.filter((w) => w.id !== wallet.id);

  const handleManualTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferFeedback(null);

    const amt = parseFloat(transferAmount);
    if (isNaN(amt) || amt <= 0) {
      setTransferFeedback({ type: 'ERROR', msg: 'Invalid amount: Must specify a value greater than $0.00.' });
      return;
    }
    if (!targetWalletId.trim()) {
      setTransferFeedback({ type: 'ERROR', msg: 'Recipient Required: Please select a destination recipient account.' });
      return;
    }
    if (targetWalletId.trim() === wallet.id) {
      setTransferFeedback({ type: 'ERROR', msg: 'Routing Fault: Self-transfers to the same wallet account are forbidden.' });
      return;
    }

    const success = await onExecuteTransfer(targetWalletId.trim(), amt);
    if (success) {
      setTransferFeedback({
        type: 'SUCCESS',
        msg: `Settlement Confirmed: $${amt.toFixed(2)} transferred to ${targetWalletId.slice(0, 8)}...`,
      });
      setTransferAmount('100.00');
    } else {
      setTransferFeedback({
        type: 'ERROR',
        msg: 'Settlement Rejected: Insufficient balance or concurrency contention.',
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. PRIMARY OVERVIEW CARD & QUICK ACTION ROW (Binance Style) */}
      <div className="bg-[#1E2329] border border-[#2B313A] rounded-xl p-5 md:p-6 shadow-xl relative overflow-hidden">
        {/* Subtle Brand Accent Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#F0B90B]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          {/* Balance Block */}
          <div>
            <div className="flex items-center space-x-2 text-xs text-[#848E9C] mb-1.5 font-medium">
              <span>Estimated Total Balance</span>
              <button
                onClick={onRefreshWallet}
                title="Sync balance"
                className="hover:text-[#F0B90B] transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Primary Crypto Display (BTC) */}
            <div className="flex items-baseline space-x-3">
              <span className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#EAECEF] font-mono tracking-tight">
                {isBalanceHidden ? '********' : balanceBtc}
              </span>
              <span className="text-base md:text-lg font-bold text-[#F0B90B] font-mono">
                BTC
              </span>
            </div>

            {/* Secondary Fiat Conversion (USD) & Mini 24h PnL Indicator */}
            <div className="flex items-center space-x-3 mt-1.5 text-xs text-[#848E9C]">
              <span className="font-mono text-sm text-[#848E9C]">
                ≈ {isBalanceHidden ? '********' : `$${Number(wallet.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`}
              </span>
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-bold text-[#0ECB81] bg-[#0ECB81]/15 font-mono">
                <TrendingUp className="w-3 h-3" />
                <span>Today's PnL +$38.40 (+3.42%)</span>
              </span>
            </div>
          </div>

          {/* Quick Action Row */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setTransferFeedback(null);
                setSelectedActionModal(selectedActionModal === 'DEPOSIT' ? null : 'DEPOSIT');
              }}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded bg-[#F0B90B] hover:bg-[#FCD535] text-[#0B0E11] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-md shadow-[#F0B90B]/10 active:scale-[0.98]"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Deposit</span>
            </button>

            <button
              onClick={() => {
                setTransferFeedback(null);
                setSelectedActionModal(selectedActionModal === 'WITHDRAW' ? null : 'WITHDRAW');
              }}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded bg-[#2B313A] hover:bg-[#363D47] text-[#EAECEF] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 cursor-pointer active:scale-[0.98]"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Withdraw</span>
            </button>

            <button
              onClick={() => {
                setTransferFeedback(null);
                setSelectedActionModal(selectedActionModal === 'TRANSFER' ? null : 'TRANSFER');
              }}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded bg-[#2B313A] hover:bg-[#363D47] text-[#EAECEF] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 cursor-pointer active:scale-[0.98]"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Transfer</span>
            </button>

            <button
              onClick={() => {
                setTransferFeedback(null);
                setSelectedActionModal(selectedActionModal === 'CONVERT' ? null : 'CONVERT');
              }}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded bg-[#2B313A] hover:bg-[#363D47] text-[#EAECEF] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 cursor-pointer active:scale-[0.98]"
            >
              <Repeat className="w-4 h-4" />
              <span>Convert</span>
            </button>
          </div>
        </div>

        {/* Informational Action Drawer */}
        {selectedActionModal && selectedActionModal !== 'TRANSFER' && (
          <div className="mt-4 pt-4 border-t border-[#2B313A] animate-fadeIn text-xs text-[#848E9C] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#F0B90B]"></span>
              <span>
                {selectedActionModal === 'DEPOSIT' && 'Direct on-chain crypto deposits automatically settle into your Primary Liquid Wallet.'}
                {selectedActionModal === 'WITHDRAW' && 'Withdrawals adhere to serializable isolation with instant confirmation.'}
                {selectedActionModal === 'CONVERT' && 'Zero-slippage conversion engine active. Instant liquidity between USDT, BTC, ETH.'}
              </span>
            </div>
            <button
              onClick={() => setSelectedActionModal(null)}
              className="text-[#848E9C] hover:text-[#EAECEF] cursor-pointer"
            >
              Close
            </button>
          </div>
        )}
      </div>

      {/* 2. ASSET DISTRIBUTION & LIST (Spot, Funding, Earn, Futures) */}
      <AssetDistribution
        usdBalance={Number(wallet.balance)}
        isBalanceHidden={isBalanceHidden}
        searchFilter={searchFilter}
        onSelectAssetForTransfer={() => setSelectedActionModal('TRANSFER')}
      />

      {/* 3. EXCHANGE CORE: INSTANT ASSET TRANSFER & LIVE ORDER BOOK */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Instant Peer Transfer Panel */}
        <div className="bg-[#1E2329] border border-[#2B313A] rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#2B313A] pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Send className="w-4 h-4 text-[#F0B90B]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#EAECEF]">
                  Instant Peer Transfer
                </span>
              </div>
              <span className="text-[11px] text-[#0ECB81] font-mono">0% Fee • Instant Settlement</span>
            </div>

            {transferFeedback && (
              <div
                className={`mb-4 p-3 rounded border text-xs flex items-center space-x-2.5 ${
                  transferFeedback.type === 'SUCCESS'
                    ? 'bg-[#0ECB81]/10 border-[#0ECB81]/40 text-[#0ECB81]'
                    : 'bg-[#F6465D]/10 border-[#F6465D]/40 text-[#F6465D]'
                }`}
              >
                {transferFeedback.type === 'SUCCESS' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-[#0ECB81]" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-[#F6465D]" />
                )}
                <span className="text-[12px] leading-tight break-all font-mono">{transferFeedback.msg}</span>
              </div>
            )}

            <form onSubmit={handleManualTransfer} className="space-y-4">
              {/* Asset / Token Selector Row */}
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#848E9C] mb-1.5 flex items-center justify-between">
                  <span>Transfer Asset</span>
                  <span className="text-[11px] text-[#848E9C] font-mono">
                    Available: ${Number(wallet.balance).toFixed(2)} USD
                  </span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['USD', 'USDT', 'BTC', 'ETH'] as const).map((tok) => (
                    <button
                      type="button"
                      key={tok}
                      onClick={() => setSelectedToken(tok)}
                      className={`py-2 px-2.5 rounded border text-xs font-semibold font-mono transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                        selectedToken === tok
                          ? 'border-[#F0B90B] text-[#F0B90B] bg-[#F0B90B]/10'
                          : 'border-[#2B313A] text-[#848E9C] bg-[#181A20] hover:border-[#848E9C] hover:text-[#EAECEF]'
                      }`}
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>{tok}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Clean Recipient Selector Dropdown / Search */}
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#848E9C] mb-1.5 flex items-center justify-between">
                  <span>Select Recipient Account</span>
                  <span className="text-[10px] text-[#F0B90B] font-mono">Internal Accounts</span>
                </label>

                <div className="relative mb-2">
                  <select
                    value={targetWalletId}
                    onChange={(e) => setTargetWalletId(e.target.value)}
                    className="w-full bg-[#181A20] border border-[#2B313A] rounded focus:border-[#F0B90B] focus:outline-none p-2.5 text-xs text-[#EAECEF] font-mono appearance-none transition-all cursor-pointer"
                  >
                    <option value="">-- Choose Recipient Client --</option>
                    {otherWallets.map((w, idx) => (
                      <option key={w.id} value={w.id}>
                        {w.name || `Client #${idx + 1}`} ({w.id})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#848E9C] absolute right-3 top-3 pointer-events-none" />
                </div>

                <div className="relative">
                  <User className="w-3.5 h-3.5 text-[#848E9C] absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={targetWalletId}
                    onChange={(e) => setTargetWalletId(e.target.value)}
                    placeholder="Or enter recipient wallet address / UUID..."
                    className="w-full bg-[#181A20] border border-[#2B313A] rounded focus:border-[#F0B90B] focus:outline-none py-2.5 pl-8 pr-3 text-xs text-[#EAECEF] font-mono placeholder:text-[#474D57] transition-all"
                  />
                </div>
              </div>

              {/* Polished Transfer Amount Input */}
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#848E9C] mb-1.5 flex items-center justify-between">
                  <span>Transfer Amount</span>
                  <button
                    type="button"
                    onClick={() => setTransferAmount(Number(wallet.balance).toFixed(2))}
                    className="text-[10px] text-[#F0B90B] hover:underline uppercase font-bold cursor-pointer"
                  >
                    Max
                  </button>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-[#848E9C] font-mono">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="w-full bg-[#181A20] border border-[#2B313A] rounded focus:border-[#F0B90B] focus:outline-none py-2.5 pl-7 pr-16 text-sm text-[#EAECEF] font-mono font-medium transition-all"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-[#848E9C] font-mono font-semibold">
                    {selectedToken}
                  </span>
                </div>
              </div>

              {/* High-End Trading CTA Execution Button */}
              <button
                type="submit"
                disabled={isTransferring}
                className="w-full py-3.5 rounded bg-[#F0B90B] hover:bg-[#FCD535] text-[#0B0E11] font-extrabold text-xs tracking-wider uppercase transition-all shadow-md shadow-[#F0B90B]/15 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 active:scale-[0.99] mt-2"
              >
                {isTransferring ? (
                  <span className="animate-pulse">Settling Transfer...</span>
                ) : (
                  <>
                    <span>Dispatch Peer Transfer</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Live Order Book / Asset Price Chart Canvas */}
        <div className="h-full">
          <LiveOrderBookChart />
        </div>
      </div>
    </div>
  );
};
