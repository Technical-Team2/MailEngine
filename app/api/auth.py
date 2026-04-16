from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..schemas.auth import LoginRequest, Token
from ..utils.security import verify_password, create_access_token, get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    print(f"\n🔐 LOGIN ATTEMPT: {payload.email}")
    logger.info(f"Login attempt for: {payload.email}")
    
    user = db.query(User).filter(User.email == payload.email).first()
    
    if not user:
        print(f"❌ User not found: {payload.email}")
        logger.warning(f"User not found: {payload.email}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    print(f"✅ User found: {user.name} ({user.email})")
    print(f"   Active: {user.is_active}")
    print(f"   Role: {user.role}")
    
    if not verify_password(payload.password, user.hashed_password):
        print(f"❌ Password verification failed for: {payload.email}")
        logger.warning(f"Password verification failed for: {payload.email}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    print(f"✅ Password verified for: {payload.email}")
    
    if not user.is_active:
        print(f"❌ Account disabled: {payload.email}")
        raise HTTPException(status_code=400, detail="Account disabled")

    token = create_access_token({"sub": str(user.id)})
    print(f"✅ Token generated for: {payload.email}\n")
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": str(user.id), "name": user.name, "email": user.email, "role": user.role}
    }

@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {"id": str(current_user.id), "name": current_user.name, "email": current_user.email, "role": current_user.role}
