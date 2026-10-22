import uuid
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db_session
from app.core.auth import hash_password, verify_password, create_access_token, get_current_user
from app.models.ledger import User, Wallet
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    AuthTokenResponse,
    UserProfileResponse,
)
from app.schemas.ledger import WalletResponse

router = APIRouter(prefix="/auth", tags=["Authentication Gateway"])


@router.post(
    "/register",
    response_model=AuthTokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user and initialize a default wallet with $1,000.00",
)
async def register(
    payload: UserRegisterRequest,
    session: AsyncSession = Depends(get_db_session),
):
    """
    Accepts email and password.
    Hashes the password securely using bcrypt.
    Inserts user record AND automatically instantiates a default wallet for them with initial seed balance of $1,000.00.
    Returns access token and newly initialized wallet.
    """
    clean_email = payload.email.lower().strip()

    # Check if email already registered
    stmt = select(User).where(User.email == clean_email)
    existing_user = (await session.execute(stmt)).scalars().first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )

    user_id = uuid.uuid4()
    wallet_id = uuid.uuid4()
    hashed = hash_password(payload.password)

    new_user = User(
        id=user_id,
        email=clean_email,
        password_hash=hashed,
    )
    session.add(new_user)
    await session.flush()

    # Automatically instantiate default wallet with seed balance of $1,000.00
    new_wallet = Wallet(
        id=wallet_id,
        user_id=user_id,
        currency="USD",
        balance=Decimal("1000.0000"),
    )
    session.add(new_wallet)
    await session.commit()
    await session.refresh(new_wallet)

    token = create_access_token(user_id=user_id, email=clean_email)

    return AuthTokenResponse(
        access_token=token,
        token_type="Bearer",
        expires_in=3600,
        user_id=user_id,
        email=clean_email,
        wallet=WalletResponse(
            id=new_wallet.id,
            user_id=new_wallet.user_id,
            currency=new_wallet.currency,
            balance=new_wallet.balance,
            created_at=new_wallet.created_at,
        ),
    )


@router.post(
    "/login",
    response_model=AuthTokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate credentials and return 1-hour JWT token",
)
async def login(
    payload: UserLoginRequest,
    session: AsyncSession = Depends(get_db_session),
):
    """
    Validates password credentials and returns a secure JSON Web Token (JWT)
    containing user_id payload, expiring in 1 hour.
    """
    clean_email = payload.email.lower().strip()

    stmt = select(User).where(User.email == clean_email).options(selectinload(User.wallets))
    res = await session.execute(stmt)
    user = res.scalars().first()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(user_id=user.id, email=user.email)

    primary_wallet = user.wallets[0] if user.wallets else None
    wallet_resp = None
    if primary_wallet:
        wallet_resp = WalletResponse(
            id=primary_wallet.id,
            user_id=primary_wallet.user_id,
            currency=primary_wallet.currency,
            balance=primary_wallet.balance,
            created_at=primary_wallet.created_at,
        )

    return AuthTokenResponse(
        access_token=token,
        token_type="Bearer",
        expires_in=3600,
        user_id=user.id,
        email=user.email,
        wallet=wallet_resp,
    )


@router.get(
    "/me",
    response_model=UserProfileResponse,
    summary="Get currently authenticated user profile and wallet",
)
async def get_me(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    stmt = select(Wallet).where(Wallet.user_id == current_user.id).order_by(Wallet.created_at.asc())
    res = await session.execute(stmt)
    wallet = res.scalars().first()

    wallet_resp = None
    if wallet:
        wallet_resp = WalletResponse(
            id=wallet.id,
            user_id=wallet.user_id,
            currency=wallet.currency,
            balance=wallet.balance,
            created_at=wallet.created_at,
        )

    return UserProfileResponse(
        id=current_user.id,
        email=current_user.email,
        created_at=current_user.created_at,
        wallet=wallet_resp,
    )
