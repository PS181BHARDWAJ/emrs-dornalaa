import os
import re
import uuid
import shutil
import json
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, Request, Form, File, UploadFile, status
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel, EmailStr
from bson import ObjectId

from ..config.database import db
from ..utils.security import get_password_hash, verify_password
from ..services.email_service import send_otp_email
from .auth import get_current_admin, log_security_event, parse_user_agent

router = APIRouter()

UPLOADS_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# Pydantic validation schemas
class PasswordChangeSchema(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

class UsernameChangeSchema(BaseModel):
    current_password: str
    new_username: str
    confirm_username: str

class EmailVerificationSendSchema(BaseModel):
    email: str

class EmailVerificationConfirmSchema(BaseModel):
    email: str
    otp: str

# Helper to validate password strength
def validate_password_strength(password: str):
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long.")
    if not re.search(r"[A-Z]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter.")
    if not re.search(r"[a-z]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one lowercase letter.")
    if not re.search(r"\d", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one digit.")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one special character.")

# =====================================================
# PROFILE SETTINGS
# =====================================================

@router.get("/profile")
async def get_profile(current_admin: dict = Depends(get_current_admin)):
    return {
        "full_name": current_admin.get("full_name", ""),
        "designation": current_admin.get("designation", ""),
        "email": current_admin.get("email", ""),
        "mobile_number": current_admin.get("mobile_number", ""),
        "bio": current_admin.get("bio", ""),
        "profile_picture": current_admin.get("profile_picture", "")
    }

@router.put("/profile")
async def update_profile(
    request: Request,
    full_name: str = Form(...),
    designation: str = Form(...),
    email: str = Form(...),
    mobile_number: str = Form(...),
    bio: str = Form(None),
    profile_picture: UploadFile = File(None),
    current_admin: dict = Depends(get_current_admin)
):
    update_data = {
        "full_name": full_name.strip(),
        "designation": designation.strip(),
        "email": email.strip().lower(),
        "mobile_number": mobile_number.strip(),
        "bio": bio.strip() if bio else ""
    }

    # Handle image upload if provided
    if profile_picture and profile_picture.filename:
        ext = os.path.splitext(profile_picture.filename)[1]
        if ext.lower() not in [".jpg", ".jpeg", ".png", ".webp"]:
            raise HTTPException(status_code=400, detail="Invalid image extension. Only JPG, PNG and WEBP allowed.")
        
        file_name = f"profile_{current_admin['username']}{ext}"
        target_path = UPLOADS_DIR / file_name
        
        with open(target_path, "wb") as buffer:
            shutil.copyfileobj(profile_picture.file, buffer)
            
        update_data["profile_picture"] = f"/uploads/{file_name}"

    await db.admins.update_one(
        {"username": current_admin["username"]},
        {"$set": update_data}
    )
    await log_security_event(current_admin["username"], "profile_update", request, "Profile info updated.")
    return {"message": "Profile updated successfully.", "profile_picture": update_data.get("profile_picture")}

# =====================================================
# ACCOUNT SETTINGS
# =====================================================

@router.get("/account")
async def get_account(current_admin: dict = Depends(get_current_admin)):
    return {
        "username": current_admin["username"],
        "recovery_email": current_admin.get("recovery_email", ""),
        "recovery_mobile": current_admin.get("recovery_mobile", ""),
        "email_verified": current_admin.get("email_verified", False)
    }

@router.put("/account")
async def update_account(
    request: Request,
    recovery_email: str = Form(...),
    recovery_mobile: str = Form(...),
    current_admin: dict = Depends(get_current_admin)
):
    update_data = {
        "recovery_email": recovery_email.strip().lower(),
        "recovery_mobile": recovery_mobile.strip()
    }
    await db.admins.update_one(
        {"username": current_admin["username"]},
        {"$set": update_data}
    )
    await log_security_event(current_admin["username"], "account_update", request, "Recovery options updated.")
    return {"message": "Account settings updated successfully."}

# =====================================================
# CHANGE USERNAME
# =====================================================

@router.post("/change-username")
async def change_username(
    request: Request,
    payload: UsernameChangeSchema,
    current_admin: dict = Depends(get_current_admin)
):
    new_username = payload.new_username.strip()
    if new_username == current_admin["username"]:
        raise HTTPException(status_code=400, detail="New username cannot be the same as current username.")
    if new_username != payload.confirm_username.strip():
        raise HTTPException(status_code=400, detail="Confirm username does not match.")
    
    # Verify password
    if not verify_password(payload.current_password, current_admin["password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Current password incorrect.")

    # Check unique username
    existing = await db.admins.find_one({"username": new_username})
    if existing:
        raise HTTPException(status_code=400, detail="Username is already taken.")

    # Update database
    await db.admins.update_one(
        {"username": current_admin["username"]},
        {"$set": {"username": new_username}}
    )
    
    # Invalidate all active sessions (Force logout)
    await db.admin_sessions.update_many(
        {"username": current_admin["username"]},
        {"$set": {"is_active": False}}
    )

    await log_security_event(current_admin["username"], "username_change", request, f"Username changed to {new_username}. All active sessions invalidated.")
    return {"message": "Username changed successfully. You will be logged out."}

# =====================================================
# CHANGE PASSWORD
# =====================================================

@router.post("/change-password")
async def change_password(
    request: Request,
    payload: PasswordChangeSchema,
    current_admin: dict = Depends(get_current_admin)
):
    if payload.new_password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Confirm password does not match.")
    
    # Verify current password
    if not verify_password(payload.current_password, current_admin["password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Current password incorrect.")

    validate_password_strength(payload.new_password)

    # Password history validation (exclude last 3 passwords)
    history = current_admin.get("password_history", [])
    new_hash = get_password_hash(payload.new_password)
    
    # Verify against current and history
    for item in history[-3:]:
        if verify_password(payload.new_password, item["password"]):
            raise HTTPException(status_code=400, detail="You cannot reuse any of your last 3 passwords.")
            
    # Record history
    history.append({
        "password": current_admin["password"],
        "changed_at": datetime.utcnow()
    })
    
    await db.admins.update_one(
        {"username": current_admin["username"]},
        {
            "$set": {
                "password": new_hash,
                "password_history": history
            }
        }
    )

    # Invalidate all active sessions (Force logout)
    await db.admin_sessions.update_many(
        {"username": current_admin["username"]},
        {"$set": {"is_active": False}}
    )

    await log_security_event(current_admin["username"], "password_change", request, "Password updated. All active sessions invalidated.")
    return {"message": "Password changed successfully. You will be logged out."}

# =====================================================
# EMAIL OTP VERIFICATION
# =====================================================

@router.post("/email-verification/send-otp")
async def send_verification_otp(
    payload: EmailVerificationSendSchema,
    current_admin: dict = Depends(get_current_admin)
):
    email = payload.email.strip().lower()
    otp = f"{uuid.uuid4().int}"[:6] # Simple random 6 digits
    
    # Update or insert OTP
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    await db.otp_verifications.update_one(
        {"email": email, "purpose": "admin_email_verify", "verified": False},
        {
            "$set": {
                "otp": otp,
                "expiresAt": expires_at,
                "attempts": 0,
                "createdAt": datetime.utcnow()
            }
        },
        upsert=True
    )
    
    # Dispatch Email via existing email service
    try:
        sent = await send_otp_email(db, email, otp)
        if not sent:
            raise HTTPException(status_code=500, detail="SMTP Delivery failed.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Email dispatch error: {e}")

    import os
    res_payload = {"message": "OTP verification email dispatched."}
    if (not os.getenv("EMAIL_USER", "ps702189@gmail.com") or not os.getenv("EMAIL_PASSWORD", "pzyq kjpl kwct nvqv")) and not os.getenv("RESEND_API_KEY"):
        res_payload["mock_otp"] = otp
    return res_payload

@router.post("/email-verification/verify-otp")
async def verify_verification_otp(
    request: Request,
    payload: EmailVerificationConfirmSchema,
    current_admin: dict = Depends(get_current_admin)
):
    email = payload.email.strip().lower()
    otp = payload.otp.strip()

    record = await db.otp_verifications.find_one({
        "email": email,
        "purpose": "admin_email_verify",
        "verified": False,
        "expiresAt": {"$gt": datetime.utcnow()}
    })

    if not record:
        raise HTTPException(status_code=400, detail="OTP is invalid or expired. Please request a new one.")

    if record["otp"] != otp:
        attempts = record.get("attempts", 0) + 1
        await db.otp_verifications.update_one({"_id": record["_id"]}, {"$set": {"attempts": attempts}})
        if attempts >= 5:
            await db.otp_verifications.delete_one({"_id": record["_id"]})
            raise HTTPException(status_code=400, detail="Too many invalid OTP attempts. OTP revoked.")
        raise HTTPException(status_code=400, detail=f"Incorrect OTP. Attempts remaining: {5 - attempts}")

    # Set as verified
    await db.otp_verifications.update_one({"_id": record["_id"]}, {"$set": {"verified": True}})
    await db.admins.update_one({"username": current_admin["username"]}, {"$set": {"email_verified": True, "email": email}})
    
    await log_security_event(current_admin["username"], "email_verify_success", request, f"Verified email: {email}")
    return {"message": "Email verification succeeded."}

# =====================================================
# SESSION MANAGEMENT
# =====================================================

@router.get("/sessions")
async def get_sessions(current_admin: dict = Depends(get_current_admin)):
    cursor = db.admin_sessions.find({"username": current_admin["username"], "is_active": True})
    sessions = []
    async for s in cursor:
        sessions.append({
            "session_id": s["session_id"],
            "ip_address": s["ip_address"],
            "device": s["device"],
            "browser": s["browser"],
            "login_time": s["login_time"].isoformat() if isinstance(s["login_time"], datetime) else s["login_time"]
        })
    return sessions

@router.delete("/sessions/{session_id}")
async def terminate_session(
    session_id: str,
    request: Request,
    current_admin: dict = Depends(get_current_admin)
):
    res = await db.admin_sessions.update_one(
        {"username": current_admin["username"], "session_id": session_id},
        {"$set": {"is_active": False}}
    )
    if res.modified_count == 0:
        raise HTTPException(status_code=404, detail="Session not found.")
    await log_security_event(current_admin["username"], "session_terminated", request, f"Terminated session: {session_id}")
    return {"message": "Session terminated successfully."}

@router.post("/sessions/logout-others")
async def logout_others(
    request: Request,
    payload: dict, # expect current session_id
    current_admin: dict = Depends(get_current_admin)
):
    current_sid = payload.get("session_id")
    if not current_sid:
        raise HTTPException(status_code=400, detail="Missing current session_id.")
    
    await db.admin_sessions.update_many(
        {"username": current_admin["username"], "session_id": {"$ne": current_sid}},
        {"$set": {"is_active": False}}
    )
    await log_security_event(current_admin["username"], "logout_others", request, "Terminated all other active sessions.")
    return {"message": "All other sessions logged out."}

@router.post("/sessions/logout-all")
async def logout_all_sessions(
    request: Request,
    current_admin: dict = Depends(get_current_admin)
):
    await db.admin_sessions.update_many(
        {"username": current_admin["username"]},
        {"$set": {"is_active": False}}
    )
    await log_security_event(current_admin["username"], "logout_all", request, "Terminated all active sessions.")
    return {"message": "All sessions terminated."}

# =====================================================
# AUDIT / SECURITY LOGS
# =====================================================

@router.get("/security-logs")
async def get_security_logs(current_admin: dict = Depends(get_current_admin)):
    cursor = db.admin_security_logs.find({"username": current_admin["username"]}).sort("timestamp", -1).limit(100)
    logs = []
    async for log in cursor:
        logs.append({
            "action": log["action"],
            "ip_address": log.get("ip_address", ""),
            "device": log.get("device", ""),
            "browser": log.get("browser", ""),
            "details": log.get("details", ""),
            "timestamp": log["timestamp"].isoformat() if isinstance(log["timestamp"], datetime) else log["timestamp"]
        })
    return logs

# =====================================================
# PREFERENCES (THEME/LAYOUT/NOTIFICATIONS)
# =====================================================

@router.get("/preferences")
async def get_preferences(current_admin: dict = Depends(get_current_admin)):
    prefs = await db.admin_preferences.find_one({"username": current_admin["username"]})
    notifs = await db.admin_notifications.find_one({"username": current_admin["username"]})

    # Default settings if none found
    if not prefs:
        prefs = {"theme": "dark", "layout": "expanded"}
    if not notifs:
        notifs = {
            "email_notifications": True,
            "application_alerts": True,
            "result_alerts": True,
            "system_alerts": True,
            "security_alerts": True
        }

    return {
        "theme": prefs.get("theme", "dark"),
        "layout": prefs.get("layout", "expanded"),
        "notifications": {
            "email_notifications": notifs.get("email_notifications", True),
            "application_alerts": notifs.get("application_alerts", True),
            "result_alerts": notifs.get("result_alerts", True),
            "system_alerts": notifs.get("system_alerts", True),
            "security_alerts": notifs.get("security_alerts", True)
        }
    }

@router.put("/preferences")
async def update_preferences(
    request: Request,
    payload: dict,
    current_admin: dict = Depends(get_current_admin)
):
    username = current_admin["username"]
    
    # Save preferences
    theme = payload.get("theme", "dark")
    layout = payload.get("layout", "expanded")
    
    await db.admin_preferences.update_one(
        {"username": username},
        {"$set": {"theme": theme, "layout": layout, "updated_at": datetime.utcnow()}},
        upsert=True
    )

    # Save notifications
    notifs = payload.get("notifications", {})
    await db.admin_notifications.update_one(
        {"username": username},
        {
            "$set": {
                "email_notifications": notifs.get("email_notifications", True),
                "application_alerts": notifs.get("application_alerts", True),
                "result_alerts": notifs.get("result_alerts", True),
                "system_alerts": notifs.get("system_alerts", True),
                "security_alerts": notifs.get("security_alerts", True),
                "updated_at": datetime.utcnow()
            }
        },
        upsert=True
    )

    await log_security_event(username, "preference_update", request, "Preferences and notification choices updated.")
    return {"message": "Preferences saved successfully."}

# =====================================================
# BACKUP & RESTORE
# =====================================================

@router.get("/backup")
async def download_backup(current_admin: dict = Depends(get_current_admin)):
    collections = await db.list_collection_names()
    backup_data = {}
    
    for col in collections:
        # Avoid backing up system indexes or temporary collections
        if col.startswith("system."):
            continue
        docs = []
        async for doc in db[col].find({}):
            if "_id" in doc:
                doc["_id"] = str(doc["_id"])
            for k, v in doc.items():
                if isinstance(v, datetime):
                    doc[k] = v.isoformat()
            docs.append(doc)
        backup_data[col] = docs

    # Write backup payload into a JSON file
    backup_filename = f"backup_emrs_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
    backup_path = UPLOADS_DIR / backup_filename
    
    with open(backup_path, "w", encoding="utf-8") as f:
        json.dump(backup_data, f, ensure_ascii=False, indent=2)

    return FileResponse(
        path=backup_path,
        filename=backup_filename,
        media_type="application/json"
    )

@router.post("/restore")
async def restore_backup(
    request: Request,
    backup_file: UploadFile = File(...),
    current_admin: dict = Depends(get_current_admin)
):
    if not backup_file.filename.endswith(".json"):
        raise HTTPException(status_code=400, detail="Backup file must be a JSON file.")

    try:
        content = await backup_file.read()
        backup_data = json.loads(content.decode("utf-8"))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse JSON file: {e}")

    # Basic layout verification of backup structure
    if not isinstance(backup_data, dict):
        raise HTTPException(status_code=400, detail="Invalid backup file layout.")

    # Restoring each collection
    for col_name, docs in backup_data.items():
        if not isinstance(docs, list):
            continue
        
        # Exclude clearing settings sessions during restore
        # to prevent logging out current admin
        if col_name == "admin_sessions":
            continue

        await db[col_name].delete_many({})
        if not docs:
            continue

        # Restore data format formatting
        for doc in docs:
            if "_id" in doc:
                try:
                    doc["_id"] = ObjectId(doc["_id"])
                except Exception:
                    pass # keep string id if not valid ObjectId hex
            for k, v in doc.items():
                if isinstance(v, str) and re.match(r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}', v):
                    try:
                        doc[k] = datetime.fromisoformat(v)
                    except Exception:
                        pass
        await db[col_name].insert_many(docs)

    await log_security_event(current_admin["username"], "database_restore", request, f"Database restored using backup file: {backup_file.filename}")
    return {"message": "Database restore completed successfully."}
