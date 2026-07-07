import random
import re
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, status, BackgroundTasks
from pydantic import BaseModel

from ..config.database import db
from ..services.email_service import send_otp_email
from ..services.sms_service import send_mobile_otp

router = APIRouter()

# Regular Expressions
EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
MOBILE_REGEX = re.compile(r"^[6-9]\d{9}$")
OTP_REGEX = re.compile(r"^\d{6}$")

# Pydantic Schemas
class EmailSendSchema(BaseModel):
    email: str

class EmailVerifySchema(BaseModel):
    email: str
    otp: str

class MobileSendSchema(BaseModel):
    mobile: str

class MobileVerifySchema(BaseModel):
    mobile: str
    otp: str

def generate_6_digit_otp() -> str:
    return f"{random.randint(100000, 999999)}"

# =====================================================
# EMAIL OTP ROUTES
# =====================================================

@router.post("/otp/send-email", status_code=status.HTTP_200_OK)
async def send_otp_to_email(payload: EmailSendSchema, background_tasks: BackgroundTasks):
    email = payload.email.strip().lower()
    
    if not EMAIL_REGEX.match(email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid email address."
        )
    
    # Resend cooldown check (60 seconds)
    recent_otp = await db.otp_verifications.find_one({
        "email": email,
        "purpose": "email_verification",
        "createdAt": {"$gt": datetime.utcnow() - timedelta(seconds=60)}
    })
    if recent_otp:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Please wait 60 seconds before requesting another verification code."
        )
        
    # Generate OTP and Expiry (10 minutes)
    otp = generate_6_digit_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    
    # Save/Update in DB (upsert for fresh request)
    await db.otp_verifications.update_one(
        {"email": email, "purpose": "email_verification", "verified": False},
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
    
    # Queue transmission in background
    background_tasks.add_task(send_otp_email, db, email, otp)
        
    import os
    res_payload = {"message": "Verification OTP sent successfully to your email."}
    if not os.getenv("EMAIL_USER") or not os.getenv("EMAIL_PASSWORD"):
        res_payload["mock_otp"] = otp
    return res_payload


@router.post("/otp/verify-email", status_code=status.HTTP_200_OK)
async def verify_otp_email(payload: EmailVerifySchema):
    email = payload.email.strip().lower()
    otp_code = payload.otp.strip()
    
    if not EMAIL_REGEX.match(email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid email address."
        )
    
    if not OTP_REGEX.match(otp_code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP must be exactly 6 numerical digits."
        )
        
    # Find matching unverified OTP record
    record = await db.otp_verifications.find_one({
        "email": email,
        "purpose": "email_verification",
        "verified": False,
        "expiresAt": {"$gt": datetime.utcnow()}
    })
    
    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP. Please click resend to request a new code."
        )
        
    attempts = record.get("attempts", 0)
    if attempts >= 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum verification attempts exceeded. Please request a new OTP code."
        )
        
    new_attempts = attempts + 1
    
    # Compare OTP
    if record["otp"] == otp_code:
        # Mark as verified
        await db.otp_verifications.update_one(
            {"_id": record["_id"]},
            {
                "$set": {
                    "verified": True,
                    "attempts": new_attempts,
                    "verifiedAt": datetime.utcnow()
                }
            }
        )
        return {"message": "Email address verified successfully."}
    else:
        # Increment attempt count
        await db.otp_verifications.update_one(
            {"_id": record["_id"]},
            {"$set": {"attempts": new_attempts}}
        )
        remaining = 5 - new_attempts
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Incorrect OTP. You have {remaining} remaining validation attempts."
        )

# =====================================================
# MOBILE OTP ROUTES (DISABLED - EMAIL ONLY WORKFLOW)
# =====================================================

@router.post("/otp/send-mobile", status_code=status.HTTP_200_OK)
async def send_otp_to_mobile(payload: MobileSendSchema):
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="SMS OTP services are disabled. EMRS Dornala Admissions has switched to an Email-Only verification workflow."
    )


@router.post("/otp/verify-mobile", status_code=status.HTTP_200_OK)
async def verify_otp_mobile(payload: MobileVerifySchema):
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="SMS OTP services are disabled. EMRS Dornala Admissions has switched to an Email-Only verification workflow."
    )

