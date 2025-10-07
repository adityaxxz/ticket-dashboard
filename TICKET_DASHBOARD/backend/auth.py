from fastapi import APIRouter, Depends, HTTPException, Security, BackgroundTasks
from fastapi.security import APIKeyHeader
import time
import secrets
from typing import Dict, Optional
import jwt
from .db import get_database, get_next_sequence, utc_now
from .config import Config
from .schemas import OTPRequest, OTPVerify
from .mail import send_otp_email


router = APIRouter(prefix="/auth", tags=["auth"])

# In-memory OTP store - key (email), value (tuple[otp, exp time])
otp_store: Dict[str, tuple[str, float]] = {}



@router.post("/request-otp")
async def request_otp(data: OTPRequest, bg_tasks: BackgroundTasks):
    email = data.email
    code = secrets.token_hex(3)
    otp_store[email] = (code, time.time() + 300)  # expiry in 5mins
    
    bg_tasks.add_task(send_otp_email, email, code)

    return {"message": "Login thru OTP, sent to email"}


@router.post("/verify-otp")
def verify_otp(data: OTPVerify, db = Depends(get_database)):
    email = data.email
    stored_otp = otp_store.get(email)
    
    if not stored_otp or stored_otp[1] < time.time() or stored_otp[0] != data.code:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        
    users = db["users"]
    user = users.find_one({"email": email})
    if not user:
        new_id = get_next_sequence(db, "users")
        users.insert_one({"id": new_id, "email": email, "created_at": utc_now()})
        user = users.find_one({"id": new_id})

    issued = int(time.time())
    expires = issued + Config.JWT_TTL_SECONDS
    payload = {"sub": str(int(user["id"])), "iat": issued, "exp": expires}
    token = jwt.encode(payload, Config.JWT_SECRET, algorithm=Config.JWT_ALG)
    
    # Log visit on login
    try:
        db["user_visits"].insert_one({
            "user_id": int(user["id"]),
            "project_id": None,
            "source": "auth_verify_otp",
            "visited_at": utc_now(),
        })
        
    except Exception:
        pass

    return {"token": token, "user_id": int(user["id"]) }



#dependencies for the endpoints

def get_current_user(authorization: Optional[str] = Security(APIKeyHeader(name="Authorization", auto_error=False)),db = Depends(get_database)):
    try:
        raw = (authorization or "").strip()
    # TODO no bearer jst token
        token = raw.split(" ", 1)[1] if raw.lower().startswith("bearer ") else raw
        user_id = int(jwt.decode(token, Config.JWT_SECRET, algorithms=[Config.JWT_ALG]).get("sub"))

    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db["users"].find_one({"id": user_id})

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user



@router.get("/me")
def me(user = Depends(get_current_user)):
    return {
        "id": int(user["id"]),
        "email": user["email"],
        "created_at": user.get("created_at"),
    }

