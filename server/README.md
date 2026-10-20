# Mutex Ledger Core Backend API

A high-concurrency, production-grade double-entry financial ledger service built with **Python 3**, **FastAPI (async/await)**, **SQLAlchemy 2.0**, **PostgreSQL / asyncpg**, and **Redis**.

---

## 🏛 Architecture & ACID Guarantees

1. **Deterministic Resource Ordering (Deadlock Prevention)**:
   - All source and destination wallet UUIDs are sorted in lexicographical order before acquiring locks. This prevents circular wait conditions and database deadlocks.

2. **Row-Level Pessimistic Locking**:
   - Executes `SELECT ... FOR UPDATE` sequentially on sorted wallet records to prevent race conditions and concurrent double-spending attempts.

3. **Elimination of Floating-Point Drift**:
   - High-precision `NUMERIC(20, 4)` is enforced across all tables and schemas (`wallets.balance`, `transactions.amount`, `ledger_entries.amount`, `ledger_entries.balance_after`).

4. **Redis Idempotency Layer**:
   - Requests require an `X-Idempotency-Key: UUIDv4` header.
   - Keys are checked against Redis and the `transactions` table.
   - If not found, leased atomically via `SETNX` with a 5-minute TTL (`300s`).
   - If the request is repeated, the previous transaction response is returned instantly without re-executing transactions.

5. **Immutable Double-Entry Append Log**:
   - For every transfer, matching `credit` and `debit` records are logged in `ledger_entries` recording `balance_after`.
   - Balanced accounting rule: $\sum(\text{debits}) = \sum(\text{credits})$.

6. **Real-Time WebSocket Event Stream**:
   - `/api/v1/ledger/stream` broadcasts execution metrics (Timestamp, Tx Hash, Idempotency Key, status, amount, execution time) immediately upon transaction completion or race condition rejection.

---

## 📂 Directory Structure

```
server/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── wallets.py          # /api/v1/wallets and /transfer endpoints
│   │       └── ledger.py           # /api/v1/ledger/stream WebSocket & query endpoints
│   ├── core/
│   │   ├── config.py               # Pydantic Settings, DB/Redis pooling parameters
│   │   ├── database.py             # SQLAlchemy 2.0 async engine & sessionmaker
│   │   ├── redis.py                # Redis client with in-memory lease fallback
│   │   ├── exceptions.py           # Custom ACID and domain exceptions
│   │   └── ws_manager.py           # WebSocket broadcasting framework
│   ├── models/
│   │   └── ledger.py               # Wallets, Transactions, and LedgerEntry ORM models
│   ├── schemas/
│   │   └── ledger.py               # Pydantic v2 schemas for transfers and events
│   └── main.py                     # FastAPI application, lifespan, CORS, seeding
├── tests/
│   ├── test_ledger.py              # Health check, transfer, and idempotency tests
│   └── test_concurrency.py         # Multi-worker concurrency stress test
├── docker-compose.yml              # PostgreSQL 16 + Redis 7 + API
├── Dockerfile                      # Production container image
└── requirements.txt                # Python dependencies
```

---

## 🚀 Running the Server

### Option A: Local Development
```powershell
cd server
py -3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Option B: Docker Compose (PostgreSQL 16 + Redis 7)
```bash
cd server
docker-compose up --build
```

---

## 🧪 Running Automated Tests
```powershell
cd server
py -3 -m pytest tests/
```
All 4 test suites pass with 100% success rate:
- Health check verification
- Atomic transfer and balance verification
- Idempotency lease duplicate detection
- High-concurrency race condition and zero-overdraft stress test
