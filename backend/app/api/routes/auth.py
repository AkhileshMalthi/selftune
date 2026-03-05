from typing import Annotated

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.api.deps import CurrentUser, SessionDep
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.crud.user import authenticate_user, create_user, get_user_by_email
from app.schemas.user import RefreshRequest, Token, UserCreate, UserRead

router = APIRouter()


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, session: SessionDep) -> UserRead:
    """Create a new user account."""
    existing = get_user_by_email(session, user_in.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists.",
        )

    user = create_user(session, user_in)
    return UserRead.model_validate(user, from_attributes=True)


@router.post("/login", response_model=Token)
def login(
    session: SessionDep,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> Token:
    """OAuth2 password flow — returns access + refresh tokens."""
    user = authenticate_user(session, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_data = {"sub": user.email}

    return Token(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


@router.post("/refresh", response_model=Token)
def refresh_token(body: RefreshRequest, session: SessionDep) -> Token:
    """Exchange a valid refresh token for a new access + refresh token pair."""
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_token(body.refresh_token)
        if payload.get("type") != "refresh":
            raise credentials_exc

        email: str | None = payload.get("sub")
        if not email:
            raise credentials_exc

    except jwt.PyJWTError:
        raise credentials_exc from None

    user = get_user_by_email(session, email)
    if not user or not user.is_active:
        raise credentials_exc

    token_data = {"sub": user.email}

    return Token(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


@router.get("/me", response_model=UserRead)
def read_current_user(current_user: CurrentUser) -> UserRead:
    """Return the currently authenticated user."""
    return UserRead.model_validate(current_user, from_attributes=True)
