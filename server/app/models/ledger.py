import enum
import uuid
from datetime import datetime
from decimal import Decimal
from sqlalchemy import (
    BigInteger,
    Integer,
    Column,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Numeric,
    String,
    Text,
    Index,
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.types import TypeDecorator, CHAR


# Custom cross-compatible UUID column type (stores standard UUID in PostgreSQL, CHAR(36) in SQLite)
class GUID(TypeDecorator):
    impl = CHAR(36)
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PGUUID(as_uuid=True))
        else:
            return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == "postgresql":
            return value if isinstance(value, uuid.UUID) else uuid.UUID(str(value))
        else:
            return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if isinstance(value, uuid.UUID):
            return value
        return uuid.UUID(str(value))


class Base(DeclarativeBase):
    pass


class TransactionStatus(str, enum.Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"


class LedgerEntryType(str, enum.Enum):
    CREDIT = "credit"
    DEBIT = "debit"


class Wallet(Base):
    __tablename__ = "wallets"

    # id (UUID primary key)
    id: Mapped[uuid.UUID] = mapped_column(
        GUID(), primary_key=True, default=uuid.uuid4
    )
    # user_id (UUID)
    user_id: Mapped[uuid.UUID] = mapped_column(GUID(), nullable=False, index=True)
    # currency (VARCHAR, e.g. 'KES', 'USD')
    currency: Mapped[str] = mapped_column(String(10), nullable=False, default="USD")
    # balance (NUMERIC(20, 4) to eliminate floating-point arithmetic errors)
    balance: Mapped[Decimal] = mapped_column(
        Numeric(precision=20, scale=4, asdecimal=True), nullable=False, default=Decimal("0.0000")
    )
    # created_at (TIMESTAMP)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )

    # Relationships
    ledger_entries: Mapped[list["LedgerEntry"]] = relationship("LedgerEntry", back_populates="wallet")

    def __repr__(self) -> str:
        return f"<Wallet id={self.id} currency={self.currency} balance={self.balance}>"


class Transaction(Base):
    __tablename__ = "transactions"

    # id (UUID primary key)
    id: Mapped[uuid.UUID] = mapped_column(
        GUID(), primary_key=True, default=uuid.uuid4
    )
    # idempotency_key (VARCHAR, unique constraint)
    idempotency_key: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    # source_wallet_id (UUID)
    source_wallet_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("wallets.id"), nullable=False, index=True
    )
    # destination_wallet_id (UUID)
    destination_wallet_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("wallets.id"), nullable=False, index=True
    )
    # amount (NUMERIC(20, 4))
    amount: Mapped[Decimal] = mapped_column(
        Numeric(precision=20, scale=4, asdecimal=True), nullable=False
    )
    # status (ENUM: pending, success, failed)
    status: Mapped[TransactionStatus] = mapped_column(
        SAEnum(TransactionStatus, native_enum=False, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=TransactionStatus.PENDING,
        index=True
    )
    # error_reason (TEXT, nullable)
    error_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # created_at
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )

    # Relationships
    entries: Mapped[list["LedgerEntry"]] = relationship("LedgerEntry", back_populates="transaction")


class LedgerEntry(Base):
    __tablename__ = "ledger_entries"

    # id (BigInt auto-increment)
    id: Mapped[int] = mapped_column(
        Integer().with_variant(BigInteger, "postgresql"), primary_key=True, autoincrement=True
    )
    # transaction_id (UUID foreign key)
    transaction_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("transactions.id"), nullable=False, index=True
    )
    # wallet_id (UUID foreign key)
    wallet_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("wallets.id"), nullable=False, index=True
    )
    # entry_type (ENUM: credit, debit)
    entry_type: Mapped[LedgerEntryType] = mapped_column(
        SAEnum(LedgerEntryType, native_enum=False, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    # amount (NUMERIC(20, 4))
    amount: Mapped[Decimal] = mapped_column(
        Numeric(precision=20, scale=4, asdecimal=True), nullable=False
    )
    # balance_after (NUMERIC(20, 4))
    balance_after: Mapped[Decimal] = mapped_column(
        Numeric(precision=20, scale=4, asdecimal=True), nullable=False
    )
    # created_at
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )

    # Relationships
    transaction: Mapped["Transaction"] = relationship("Transaction", back_populates="entries")
    wallet: Mapped["Wallet"] = relationship("Wallet", back_populates="ledger_entries")

    __table_args__ = (
        Index("idx_ledger_wallet_created", "wallet_id", "created_at"),
    )
