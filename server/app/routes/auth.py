from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, Token
from app.services.auth_service import hash_password, verify_password, create_access_token
from app.middleware.auth import get_current_user

router = APIRouter()


@router.post("/register", response_model=Token)
def register(body: UserCreate, db: Session = Depends(get_db)):

    existing_user = db.query(User).filter(User.email == body.email).first()

    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Email already registered")
    hashed_password = hash_password(body.password)
    user = User(email=body.email, name=body.name, password=hashed_password)
    db.add(user)
    db.commit()
    db.refresh(user)

    return Token(access_token=create_access_token(str(user.id)))


@router.post("/login", response_model=Token)
def login(body: UserCreate, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.email == body.email).first()

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid email or password")
    if not verify_password(body.password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid email or password")

    return Token(access_token=create_access_token(str(user.id)))


@router.get("/get_user", response_model=UserResponse)
def get_user(user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return user
