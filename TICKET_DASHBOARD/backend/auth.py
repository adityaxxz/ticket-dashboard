from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security import APIKeyHeader
import time
import secrets
from typing import Dict, Optional
from sqlmodel import Session, select
import jwt
from .db import get_session
from .models import User
from .config import Config
from .schemas import OTPRequest, OTPVerify
from .mail import send_otp_email


router = APIRouter(prefix="/auth", tags=["auth"])

# In-memory OTP store
otp_store: Dict[str, tuple[str, float]] = {}



@router.post("/request-otp")
async def request_otp(data: OTPRequest):
    email = data.email
    code = secrets.token_hex(3)
    otp_store[email] = (code, time.time() + 300)  # expiry in 5mins

    try:
        await send_otp_email(email, code)
        
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Failed to send OTP email") from exc

    return {"detail": "OTP sent to email"}


@router.post("/verify-otp")
def verify_otp(data: OTPVerify, session: Session = Depends(get_session)):
    email = data.email
    stored_otp = otp_store.get(email)
    
    if not stored_otp or stored_otp[1] < time.time() or stored_otp[0] != data.code:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    user = session.exec(select(User).where(User.email == email)).first()
    if not user:
        user = User(email=email)
        session.add(user)
        session.commit()
        session.refresh(user)

    issued = int(time.time())
    expires = issued + Config.JWT_TTL_SECONDS
    payload = {"sub": str(user.id), "iat": issued, "exp": expires}
    token = jwt.encode(payload, Config.JWT_SECRET, algorithm=Config.JWT_ALG)
    
    return {"token": token, "user_id": user.id}



#dependencies for the endpoints

def get_current_user(
    authorization: Optional[str] = Security(APIKeyHeader(name="Authorization", auto_error=False)),
    session: Session = Depends(get_session),
):
    try:
        raw = (authorization or "").strip()
        token = raw.split(" ", 1)[1] if raw.lower().startswith("bearer ") else raw
        user_id = int(jwt.decode(token, Config.JWT_SECRET, algorithms=[Config.JWT_ALG]).get("sub"))

    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = session.get(User, user_id)

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user



@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "email": user.email,
        "created_at": user.created_at.isoformat(),
    }

