class LedgerException(Exception):
    """Base exception for ledger operations."""
    def __init__(self, message: str, error_code: str = "LEDGER_ERROR"):
        super().__init__(message)
        self.message = message
        self.error_code = error_code


class WalletNotFoundError(LedgerException):
    """Raised when one or both wallets do not exist."""
    def __init__(self, wallet_id: str):
        super().__init__(f"Wallet with ID '{wallet_id}' not found.", error_code="WALLET_NOT_FOUND")


class InsufficientFundsError(LedgerException):
    """Raised when source wallet has insufficient funds."""
    def __init__(self, required: str, available: str):
        super().__init__(
            f"Insufficient funds: Required {required}, Available {available}.",
            error_code="INSUFFICIENT_FUNDS"
        )


class CurrencyMismatchError(LedgerException):
    """Raised when source and destination currencies differ."""
    def __init__(self, src_currency: str, dst_currency: str):
        super().__init__(
            f"Currency mismatch: Source is {src_currency}, Destination is {dst_currency}.",
            error_code="CURRENCY_MISMATCH"
        )


class ConcurrencyLockError(LedgerException):
    """Raised when row-level pessimistic lock or mutex lease cannot be acquired."""
    def __init__(self, detail: str = "Row lock contention rejected race condition"):
        super().__init__(detail, error_code="REJECTED_RACE_CONDITION")


class IdempotencyInProgressError(LedgerException):
    """Raised when an identical idempotency key is actively being processed."""
    def __init__(self, key: str):
        super().__init__(
            f"An identical request with idempotency key '{key}' is currently being executed.",
            error_code="IDEMPOTENCY_IN_PROGRESS"
        )
