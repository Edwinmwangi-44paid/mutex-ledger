export type FlatStatusTag = 'SUCCESS' | 'BLOCKED_BY_MUTEX';

export interface UserProfile {
  id: string;
  email: string;
  created_at: string;
}

export interface AuthSession {
  token: string;
  user: UserProfile;
  wallet: WalletNode;
}

export interface Transaction {
  id: string;
  timestamp: string;
  hash: string;
  idempotencyKey: string;
  sourceWallet: string;
  destinationWallet: string;
  amount: number;
  status: FlatStatusTag;
  executionTimeMs?: number;
  errorReason?: string;
  threadId?: number;
  blockHeight?: number;
}

export interface LedgerEntryRecord {
  id: number;
  transaction_id: string;
  wallet_id: string;
  entry_type: 'credit' | 'debit';
  amount: number;
  balance_after: number;
  created_at: string;
}

export interface WalletNode {
  id: string;
  user_id?: string;
  name?: string;
  currency: string;
  balance: number;
  created_at?: string;
}

export interface LedgerMetrics {
  totalVolume: number;
  totalTransactions: number;
  successfulTxCount: number;
  rejectedRaceCount: number;
  activeLedgerBalance: number;
  currentTps: number;
  activeLocks: number;
}

export interface ConcurrencyBlastResult {
  requestIndex: number;
  idempotencyKey: string;
  status: 'SUCCESS' | 'BLOCKED_BY_MUTEX';
  httpStatus: number;
  elapsedMs: number;
  message: string;
  txHash?: string;
}
