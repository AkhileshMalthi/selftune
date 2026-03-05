from datetime import datetime
from typing import Annotated

from pydantic import EmailStr, Field
from sqlmodel import SQLModel

# ---- Annotated type aliases ------------------------------------------------

EmailField = Annotated[EmailStr, Field(description="User email address")]
PasswordField = Annotated[str, Field(min_length=8, description="Plain-text password")]
TokenField = Annotated[str, Field(description="JWT token string")]

# ---- Request schemas -------------------------------------------------------


class UserCreate(SQLModel):
    email: EmailField
    password: PasswordField


class UserLogin(SQLModel):
    email: EmailField
    password: PasswordField


# ---- Response schemas -------------------------------------------------------


class UserRead(SQLModel):
    id: Annotated[int, Field(description="Unique user ID")]
    email: Annotated[str, Field(description="User email address")]
    is_active: Annotated[bool, Field(description="Whether the account is active")]
    created_at: Annotated[datetime, Field(description="Account creation timestamp")]


# ---- Token schemas ----------------------------------------------------------


class Token(SQLModel):
    access_token: TokenField
    refresh_token: TokenField
    token_type: Annotated[str, Field(default="bearer")]


class TokenData(SQLModel):
    email: Annotated[
        str | None, Field(default=None, description="Subject email from token")
    ]


class RefreshRequest(SQLModel):
    refresh_token: TokenField
