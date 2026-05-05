from passlib.context import CryptContext
from jose import jwt
from app.config import settings
from datetime import datetime, timedelta, timezone

pwd_context = CryptContext(schemes=["bcrypt"])


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:

    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(user_id: str) -> str:

    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    }

    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")
