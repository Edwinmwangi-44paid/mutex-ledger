export type TransactionStatus = 
  | 'SUCCESS' 
  | 'REJECTED_RACE_CONDITION' 
  | 'REJECTED_INSUFFICIENT_FUNDS' 
  | 'MUTEX_LOCKED';

export interface Transaction {
  id: string;
  timestamp: string;
  hash: string;
  idempotencyKey: string;
  sourceWallet: string;
  destinationWallet: string;
  amount: number;
  status: TransactionStatus;
  executionTimeMs: number;
  threadId: number;
  blockHeight: number;
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
