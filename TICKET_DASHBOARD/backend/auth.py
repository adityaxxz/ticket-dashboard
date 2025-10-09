from fastapi import APIRouter, Depends, HTTPException, Security, BackgroundTasks
from fastapi.security import APIKeyHeader
import time
import secrets
import jwt
from .db import get_database, get_next_sequence, utc_now
from .config import Config
from .schemas import OTPRequest, OTPVerify
from .mail import send_otp_email

router = APIRouter(prefix="/auth", tags=["auth"])

otp_store = {}


@router.post("/request-otp")
async def request_otp(data: OTPRequest, bg_tasks: BackgroundTasks):
    code = str(secrets.randbelow(900000) + 100000)
    otp_store[data.email] = {
        'code': code, 
        'expires_at': time.time() + 300  # 5 minutes
    }
    
    bg_tasks.add_task(send_otp_email, data.email, code)
    return {"message": "Login thru OTP, sent to email"}


@router.post("/verify-otp")
def verify_otp(data: OTPVerify, db = Depends(get_database)):
    email = data.email
    stored_otp = otp_store.get(email)
    
    if not stored_otp or stored_otp['expires_at'] < time.time() or stored_otp['code'] != data.code:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    del otp_store[data.email]
        
    user = db["users"].find_one({"email": data.email})
    if not user:
        new_id = get_next_sequence(db, "users")
        db["users"].insert_one({"id": new_id, "email": data.email, "created_at": utc_now()})
        user = db["users"].find_one({"id": new_id})

    payload = {
        "sub": str(user["id"]), 
        "iat": int(time.time()), 
        "exp": int(time.time()) + Config.JWT_TTL_SECONDS
    }
    token = jwt.encode(payload, Config.JWT_SECRET, algorithm=Config.JWT_ALG)

    return {"token": token, "user_id": user["id"]}




# Authentication dependency

def get_current_user(authorization = Security(APIKeyHeader(name="Authorization")), db = Depends(get_database)):
    """Simple authentication - expects 'Bearer <token>' format"""
    try:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
        
        token = authorization.split(" ")[1]
        payload = jwt.decode(token, Config.JWT_SECRET, algorithms=[Config.JWT_ALG])
        user_id = int(payload.get("sub"))

    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    except Exception:
        raise HTTPException(status_code=401, detail="Authentication failed")

    user = db["users"].find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


@router.get("/me")
def get_current_user_info(user = Depends(get_current_user)):
    return {
        "id": user["id"],
        "email": user["email"],
        "created_at": user.get("created_at"),
    }