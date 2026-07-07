import uuid
import re
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Request, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from pymongo.errors import PyMongoError

from ..config.database import db
from ..utils.security import verify_password, create_access_token, decode_access_token
from ..models.admin import Token, TokenData

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def parse_user_agent(ua_str: str) -> dict:
    if not ua_str:
        return {"os": "Unknown OS", "browser": "Unknown Browser", "device": "Desktop"}
    ua = ua_str.lower()
    
    # OS matching
    if "windows" in ua:
        os_name = "Windows"
    elif "macintosh" in ua or "mac os" in ua:
        os_name = "macOS"
    elif "iphone" in ua or "ipad" in ua:
        os_name = "iOS"
    elif "android" in ua:
        os_name = "Android"
    elif "linux" in ua:
        os_name = "Linux"
    else:
        os_name = "Unknown OS"
        
    # Browser matching
    if "chrome" in ua or "crios" in ua:
        browser_name = "Chrome"
    elif "firefox" in ua or "fxios" in ua:
        browser_name = "Firefox"
    elif "safari" in ua and "chrome" not in ua:
        browser_name = "Safari"
    elif "edge" in ua or "edg" in ua:
        browser_name = "Edge"
    elif "trident" in ua or "msie" in ua:
        browser_name = "Internet Explorer"
    else:
        browser_name = "Unknown Browser"
        
    device = "Mobile" if any(x in ua for x in ["mobi", "iphone", "ipad", "android"]) else "Desktop"
    return {"os": os_name, "browser": browser_name, "device": device}

async def log_security_event(username: str, action: str, request: Request, details: str = ""):
    ip_address = request.client.host if request.client else "Unknown"
    ua_str = request.headers.get("user-agent", "")
    ua_info = parse_user_agent(ua_str)
    
    log_doc = {
        "log_id": str(uuid.uuid4()),
        "username": username,
        "action": action,
        "ip_address": ip_address,
        "device": ua_info["os"],
        "browser": ua_info["browser"],
        "details": details,
        "timestamp": datetime.utcnow()
    }
    try:
        await db.admin_security_logs.insert_one(log_doc)
    except Exception as e:
        print(f"Failed to log security event: {e}")

@router.post("/login", response_model=Token)
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
    username = form_data.username.strip()
    try:
        admin = await db.admins.find_one({"username": {"$regex": f"^{re.escape(username)}$", "$options": "i"}})
    except PyMongoError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Login service is temporarily unavailable. Please try again.",
        )

    if not admin:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")

    canonical_username = admin["username"]

    # Lockout check
    lockout_until = admin.get("lockout_until")
    if lockout_until:
        # Convert date to datetime if saved as string
        if isinstance(lockout_until, str):
            lockout_until = datetime.fromisoformat(lockout_until)
        if lockout_until > datetime.utcnow():
            diff = lockout_until - datetime.utcnow()
            mins = int(diff.total_seconds() // 60)
            secs = int(diff.total_seconds() % 60)
            time_str = f"{mins}m {secs}s" if mins > 0 else f"{secs}s"
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Account temporarily locked due to multiple failed login attempts. Try again in {time_str}."
            )

    # Password check
    if not verify_password(form_data.password, admin["password"]):
        failed_attempts = admin.get("failed_attempts", 0) + 1
        update_doc = {"failed_attempts": failed_attempts}
        
        if failed_attempts >= 5:
            lockout_time = datetime.utcnow() + timedelta(minutes=15)
            update_doc["lockout_until"] = lockout_time
            await db.admins.update_one({"username": canonical_username}, {"$set": update_doc})
            await log_security_event(canonical_username, "login_lockout", request, "Account locked out for 15 minutes due to 5 consecutive failures.")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account locked out for 15 minutes due to 5 consecutive failed login attempts."
            )
        else:
            await db.admins.update_one({"username": canonical_username}, {"$set": update_doc})
            await log_security_event(canonical_username, "login_failed", request, f"Failed password attempt. Count: {failed_attempts}")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")

    # Success: Reset failed attempt trackers
    await db.admins.update_one(
        {"username": canonical_username},
        {"$set": {"failed_attempts": 0, "lockout_until": None}}
    )

    # Parse details for session
    ip_address = request.client.host if request.client else "Unknown"
    ua_str = request.headers.get("user-agent", "")
    ua_info = parse_user_agent(ua_str)
    
    # Create active session
    session_id = str(uuid.uuid4())
    session_doc = {
        "session_id": session_id,
        "username": canonical_username,
        "ip_address": ip_address,
        "device": ua_info["os"],
        "browser": ua_info["browser"],
        "login_time": datetime.utcnow(),
        "last_activity": datetime.utcnow(),
        "is_active": True,
        "expires_at": datetime.utcnow() + timedelta(days=1)
    }
    
    try:
        await db.admin_sessions.insert_one(session_doc)
        await log_security_event(canonical_username, "login_success", request, f"Session created: {session_id}")
    except PyMongoError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Session registration failed. Please try again.",
        )

    access_token = create_access_token(data={
        "sub": username, 
        "role": admin.get("role", "admin"),
        "session_id": session_id
    })
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout")
async def logout(request: Request, token: str = Depends(oauth2_scheme)):
    payload = decode_access_token(token)
    if payload:
        session_id = payload.get("session_id")
        username = payload.get("sub")
        if session_id:
            await db.admin_sessions.update_one(
                {"session_id": session_id},
                {"$set": {"is_active": False}}
            )
            await log_security_event(username, "logout", request, f"Session invalidated: {session_id}")
    return {"message": "Logged out successfully."}

async def get_current_admin(token: str = Depends(oauth2_scheme)):
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")
    
    username: str = payload.get("sub")
    session_id: str = payload.get("session_id")
    
    if username is None or session_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")
    
    try:
        # Check if session is active
        session = await db.admin_sessions.find_one({"session_id": session_id, "is_active": True})
        if not session:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session is expired, revoked, or logged out.")
        
        admin = await db.admins.find_one({"username": username})
    except PyMongoError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service is temporarily unavailable.",
        )

    if admin is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        
    # Update last activity timestamp in background
    try:
        await db.admin_sessions.update_one(
            {"session_id": session_id},
            {"$set": {"last_activity": datetime.utcnow()}}
        )
    except Exception:
        pass # Non-blocking flow
        
    return admin


