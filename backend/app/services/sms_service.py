# EMRS Dornala Admissions SMS Service (Archived / Disabled)
# SWITCHED TO EMAIL-ONLY COMMUNICATION SYSTEM

import os
from datetime import datetime

async def log_notification(db, notification_type: str, recipient: str, status: str, provider: str, message_id: str = None, error_details: str = None):
    pass

async def send_sms(db, mobile: str, message: str) -> bool:
    print(f"[SMS BYPASS] To: {mobile}, Msg: {message}")
    return True

async def send_mobile_otp(db, mobile: str, otp: str) -> bool:
    return True

async def send_application_confirmation(db, mobile: str, app_no: str) -> bool:
    return True

async def send_approval_sms(db, mobile: str, app_no: str) -> bool:
    return True

async def send_rejection_sms(db, mobile: str, app_no: str) -> bool:
    return True

