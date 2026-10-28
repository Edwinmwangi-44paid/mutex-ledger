import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
from app.models.ledger import TransactionStatus, LedgerEntryType


class TransferRequest(BaseModel):
    source_wallet_id: uuid.UUID = Field(..., description="UUID of source wallet")
    destination_wallet_id: uuid.UUID = Field(..., description="UUID of destination wallet")
    amount: Decimal = Field(..., gt=Decimal("0.0000"), max_digits=20, decimal_places=4, description="Amount to transfer")

    @field_validator("amount")
    @classmethod
    def validate_amount_precision(cls, v: Decimal) -> Decimal:
        if v <= Decimal("0"):
            raise ValueError("Amount must be strictly positive")
        # Ensure 4 decimal places rounding/representation
        return v.quantize(Decimal("0.0001"))

    @field_validator("destination_wallet_id")
    @classmethod
    def prevent_self_transfer(cls, v: uuid.UUID, info) -> uuid.UUID:
        if "source_wallet_id" in info.data and v == info.data["source_wallet_id"]:
            raise ValueError("Source wallet and destination wallet cannot be identical")
        return v


class LedgerEntryResponse(BaseModel):
    id: int
    transaction_id: uuid.UUID
    wallet_id: uuid.UUID
    entry_type: LedgerEntryType
    amount: Decimal
    balance_after: Decimal
    created_at: datetime

    model_config = {"from_attributes": True}


class TransferResponse(BaseModel):
    id: uuid.UUID
    idempotency_key: str
    source_wallet_id: uuid.UUID
    destination_wallet_id: uuid.UUID
    amount: Decimal
    status: TransactionStatus
    error_reason: Optional[str] = None
    created_at: datetime
    execution_time_ms: Optional[float] = None
    tx_hash: Optional[str] = None
    ledger_entries: Optional[List[LedgerEntryResponse]] = []

    model_config = {"from_attributes": True}


class WalletResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    currency: str
    balance: Decimal
    created_at: datetime

    model_config = {"from_attributes": True}


class WalletCreateRequest(BaseModel):
    user_id: Optional[uuid.UUID] = None
    currency: str = Field(default="USD", max_length=10)
    initial_balance: Decimal = Field(default=Decimal("0.0000"), ge=Decimal("0.0000"))


class StreamMetricEvent(BaseModel):
    timestamp: str
    tx_hash: str
    idempotency_key: str
    status: str
    amount: float
    source_wallet_id: Optional[str] = None
    destination_wallet_id: Optional[str] = None
    execution_time_ms: Optional[float] = None
    error_reason: Optional[str] = None


class DepositRequest(BaseModel):
    wallet_id: uuid.UUID = Field(..., description="Target wallet UUID to credit")
    amount: Decimal = Field(..., gt=Decimal("0.0000"), max_digits=20, decimal_places=4, description="Deposit amount")
    currency: Optional[str] = Field("USD", description="Currency (USD, USDT, BTC, ETH)")

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: Decimal) -> Decimal:
        if v <= Decimal("0"):
            raise ValueError("Deposit amount must be strictly positive")
        return v.quantize(Decimal("0.0001"))


class WithdrawRequest(BaseModel):
    wallet_id: uuid.UUID = Field(..., description="Source wallet UUID to debit")
    destination_address: str = Field(..., min_length=6, description="Destination crypto address or bank tag")
    amount: Decimal = Field(..., gt=Decimal("0.0000"), max_digits=20, decimal_places=4, description="Withdrawal amount")
    currency: Optional[str] = Field("USD", description="Currency (USD, USDT, BTC, ETH)")

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: Decimal) -> Decimal:
        if v <= Decimal("0"):
            raise ValueError("Withdrawal amount must be strictly positive")
        return v.quantize(Decimal("0.0001"))

