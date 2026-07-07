from datetime import datetime
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ..config.database import db
from ..routes.auth import get_current_admin

router = APIRouter()

SETTINGS_KEY = "contact_page"


class ContactPagePayload(BaseModel):
    header_title: str
    header_subtitle: str
    cards: list[dict]


DEFAULT_CONTACT_PAGE = {
    "header_title": "Contact Us",
    "header_subtitle": "Official Communication & Institutional Correspondence",
    "cards": [
        {
            "title": "Institution Address",
            "lines": [
                "Name of School",
                "Village / Post / District",
                "State - PIN Code",
                "India",
            ],
        },
        {
            "title": "Contact Information",
            "lines": [
                "Phone: +91-XXXXXXXXXX",
                "Email: info@schoolname.gov.in",
                "Office Hours: 9:00 AM - 5:00 PM (Mon-Fri)",
            ],
        },
        {
            "title": "Administrative Office",
            "lines": [
                "Principal: Principal Name",
                "Vice Principal: Vice Principal Name",
                "Office Superintendent: Name",
            ],
        },
        {
            "title": "Admission Enquiry",
            "lines": [
                "For admission-related queries, kindly contact during working hours.",
                "Email: admission@schoolname.gov.in",
            ],
        },
    ],
}


@router.get("/contact-page")
async def get_contact_page():
    item = await db.site_settings.find_one({"key": SETTINGS_KEY})
    if not item:
        return DEFAULT_CONTACT_PAGE

    return {
        "header_title": item.get("header_title") or DEFAULT_CONTACT_PAGE["header_title"],
        "header_subtitle": item.get("header_subtitle") or DEFAULT_CONTACT_PAGE["header_subtitle"],
        "cards": item.get("cards") or DEFAULT_CONTACT_PAGE["cards"],
    }


@router.put("/contact-page")
async def save_contact_page(payload: ContactPagePayload, admin=Depends(get_current_admin)):
    now = datetime.utcnow()
    doc = {
        "key": SETTINGS_KEY,
        "header_title": payload.header_title,
        "header_subtitle": payload.header_subtitle,
        "cards": payload.cards,
        "updated_at": now,
        "updated_by": admin.get("username", "admin"),
    }

    await db.site_settings.update_one(
        {"key": SETTINGS_KEY},
        {
            "$set": doc,
            "$setOnInsert": {"created_at": now},
        },
        upsert=True,
    )

    return {"message": "Contact page updated"}


class ContactMessagePayload(BaseModel):
    name: str
    email: str
    subject: str
    phone: str
    message: str


@router.post("/contact-message")
async def send_contact_message(payload: ContactMessagePayload):
    from ..services.email_service import send_contact_message_email
    success = await send_contact_message_email(
        db,
        name=payload.name,
        email=payload.email,
        subject=payload.subject,
        phone=payload.phone,
        message=payload.message
    )
    if not success:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail="Failed to send contact message via email")
    return {"message": "Message sent successfully"}

