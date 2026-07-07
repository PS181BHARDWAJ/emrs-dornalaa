from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from ..config.database import db
from ..routes.auth import get_current_admin
from bson import ObjectId
from ..utils.storage import save_uploaded_file, get_file_url

router = APIRouter()


# ==================== SERIALIZATION FUNCTIONS ====================

def serialize_hostel_info(item: dict) -> dict:
    """Serialize hostel info document."""
    return {
        "id": str(item.get("_id")),
        "title": item.get("title") or "Hostel Facilities",
        "subtitle": item.get("subtitle") or "",
        "description": item.get("description") or "",
        "banner_image": item.get("banner_image"),
        "overlay_opacity": item.get("overlay_opacity", 0.3),
        "cta_button_text": item.get("cta_button_text") or "Explore",
        "cta_button_link": item.get("cta_button_link") or "#features",
        "active": bool(item.get("active", True)),
        "created_at": item.get("created_at").isoformat() if isinstance(item.get("created_at"), datetime) else None,
    }


def serialize_hostel_schedule(item: dict) -> dict:
    """Serialize hostel schedule document."""
    return {
        "id": str(item.get("_id")),
        "title": item.get("title") or "",
        "time": item.get("time") or "",
        "description": item.get("description") or "",
        "icon": item.get("icon") or "fas fa-clock",
        "order": item.get("order", 0),
        "active": bool(item.get("active", True)),
        "created_at": item.get("created_at").isoformat() if isinstance(item.get("created_at"), datetime) else None,
    }


def serialize_hostel_notice(item: dict) -> dict:
    """Serialize hostel notice document."""
    return {
        "id": str(item.get("_id")),
        "title": item.get("title") or "",
        "content": item.get("content") or "",
        "category": item.get("category") or "notice",  # notice, rule, circular
        "attachment_url": item.get("attachment_url"),
        "pinned": bool(item.get("pinned", False)),
        "order": item.get("order", 0),
        "active": bool(item.get("active", True)),
        "created_at": item.get("created_at").isoformat() if isinstance(item.get("created_at"), datetime) else None,
    }


def serialize_hostel_gallery(item: dict) -> dict:
    """Serialize hostel gallery document."""
    return {
        "id": str(item.get("_id")),
        "title": item.get("title") or "",
        "caption": item.get("caption") or "",
        "media_url": item.get("media_url"),
        "media_type": item.get("media_type") or "image",  # image, video
        "category": item.get("category") or "hostel-life",
        "featured": bool(item.get("featured", False)),
        "order": item.get("order", 0),
        "active": bool(item.get("active", True)),
        "created_at": item.get("created_at").isoformat() if isinstance(item.get("created_at"), datetime) else None,
    }


# ==================== HOSTEL INFO ENDPOINTS (HERO SECTION) ====================

@router.get("")
async def get_hostel_info():
    """Get hostel info for public page."""
    item = await db.hostel_info.find_one({"active": True})
    if not item:
        # Return default empty structure if none exists
        return {
            "id": None,
            "title": "Hostel Facilities",
            "subtitle": "Premium Residential Excellence",
            "description": "Experience comfort and community in our world-class hostel facilities.",
            "banner_image": None,
            "overlay_opacity": 0.3,
            "cta_button_text": "Explore",
            "cta_button_link": "#features",
            "active": True,
        }
    return serialize_hostel_info(item)


@router.get("/admin")
async def get_hostel_info_admin(admin=Depends(get_current_admin)):
    """Get hostel info for admin (all, including inactive)."""
    item = await db.hostel_info.find_one()
    if not item:
        return None
    return serialize_hostel_info(item)


@router.post("", status_code=201)
async def create_hostel_info(
    title: str = Form(...),
    subtitle: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    overlay_opacity: float = Form(0.3),
    cta_button_text: Optional[str] = Form("Explore"),
    cta_button_link: Optional[str] = Form("#features"),
    active: bool = Form(True),
    banner_image: Optional[UploadFile] = File(None),
    admin=Depends(get_current_admin),
):
    """Create hostel info."""
    # Delete existing if any
    await db.hostel_info.delete_many({})
    
    banner_image_url = None
    if banner_image:
        file_id = await save_uploaded_file(db, banner_image, category="hostel")
        banner_image_url = get_file_url(file_id)

    doc = {
        "title": title,
        "subtitle": subtitle or "",
        "description": description or "",
        "banner_image": banner_image_url,
        "overlay_opacity": float(overlay_opacity),
        "cta_button_text": cta_button_text or "Explore",
        "cta_button_link": cta_button_link or "#features",
        "active": active,
        "created_at": datetime.utcnow(),
    }
    result = await db.hostel_info.insert_one(doc)
    return {"id": str(result.inserted_id)}


@router.put("/{hostel_id}")
async def update_hostel_info(
    hostel_id: str,
    title: str = Form(...),
    subtitle: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    overlay_opacity: float = Form(0.3),
    cta_button_text: Optional[str] = Form("Explore"),
    cta_button_link: Optional[str] = Form("#features"),
    active: bool = Form(True),
    banner_image: Optional[UploadFile] = File(None),
    admin=Depends(get_current_admin),
):
    """Update hostel info."""
    if not ObjectId.is_valid(hostel_id):
        raise HTTPException(status_code=400, detail="Invalid hostel id")

    update_data = {
        "title": title,
        "subtitle": subtitle or "",
        "description": description or "",
        "overlay_opacity": float(overlay_opacity),
        "cta_button_text": cta_button_text or "Explore",
        "cta_button_link": cta_button_link or "#features",
        "active": active,
    }

    if banner_image:
        file_id = await save_uploaded_file(db, banner_image, category="hostel")
        update_data["banner_image"] = get_file_url(file_id)

    result = await db.hostel_info.update_one({"_id": ObjectId(hostel_id)}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Hostel info not found")
    return {"message": "Updated"}


# ==================== HOSTEL SCHEDULES ENDPOINTS ====================

@router.get("/schedules")
async def get_hostel_schedules():
    """Get all active hostel schedules."""
    items = []
    async for item in db.hostel_schedules.find({"active": True}).sort("order", 1):
        items.append(serialize_hostel_schedule(item))
    return items


@router.get("/schedules/all")
async def get_all_hostel_schedules(admin=Depends(get_current_admin)):
    """Get all hostel schedules (admin)."""
    items = []
    async for item in db.hostel_schedules.find().sort("order", 1):
        items.append(serialize_hostel_schedule(item))
    return items


@router.get("/schedules/{schedule_id}")
async def get_hostel_schedule(schedule_id: str):
    """Get a specific hostel schedule."""
    if not ObjectId.is_valid(schedule_id):
        raise HTTPException(status_code=400, detail="Invalid schedule id")
    item = await db.hostel_schedules.find_one({"_id": ObjectId(schedule_id)})
    if not item:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return serialize_hostel_schedule(item)


@router.post("/schedules", status_code=201)
async def create_hostel_schedule(
    title: str = Form(...),
    time: str = Form(...),
    description: Optional[str] = Form(None),
    icon: Optional[str] = Form("fas fa-clock"),
    order: int = Form(0),
    active: bool = Form(True),
    admin=Depends(get_current_admin),
):
    """Create a hostel schedule."""
    doc = {
        "title": title,
        "time": time,
        "description": description or "",
        "icon": icon or "fas fa-clock",
        "order": order,
        "active": active,
        "created_at": datetime.utcnow(),
    }
    result = await db.hostel_schedules.insert_one(doc)
    return {"id": str(result.inserted_id)}


@router.put("/schedules/{schedule_id}")
async def update_hostel_schedule(
    schedule_id: str,
    title: str = Form(...),
    time: str = Form(...),
    description: Optional[str] = Form(None),
    icon: Optional[str] = Form("fas fa-clock"),
    order: int = Form(0),
    active: bool = Form(True),
    admin=Depends(get_current_admin),
):
    """Update a hostel schedule."""
    if not ObjectId.is_valid(schedule_id):
        raise HTTPException(status_code=400, detail="Invalid schedule id")

    update_data = {
        "title": title,
        "time": time,
        "description": description or "",
        "icon": icon or "fas fa-clock",
        "order": order,
        "active": active,
    }
    result = await db.hostel_schedules.update_one({"_id": ObjectId(schedule_id)}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return {"message": "Updated"}


@router.delete("/schedules/{schedule_id}")
async def delete_hostel_schedule(schedule_id: str, admin=Depends(get_current_admin)):
    """Delete a hostel schedule."""
    if not ObjectId.is_valid(schedule_id):
        raise HTTPException(status_code=400, detail="Invalid schedule id")
    result = await db.hostel_schedules.delete_one({"_id": ObjectId(schedule_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return {"message": "Deleted"}


# ==================== HOSTEL NOTICES ENDPOINTS ====================

@router.get("/notices")
async def get_hostel_notices(category: Optional[str] = None):
    """Get all active hostel notices."""
    query = {"active": True}
    if category:
        query["category"] = category
    
    items = []
    async for item in db.hostel_notices.find(query).sort([("pinned", -1), ("order", 1)]):
        items.append(serialize_hostel_notice(item))
    return items


@router.get("/notices/all")
async def get_all_hostel_notices(admin=Depends(get_current_admin)):
    """Get all hostel notices (admin)."""
    items = []
    async for item in db.hostel_notices.find().sort([("pinned", -1), ("order", 1)]):
        items.append(serialize_hostel_notice(item))
    return items


@router.get("/notices/{notice_id}")
async def get_hostel_notice(notice_id: str):
    """Get a specific hostel notice."""
    if not ObjectId.is_valid(notice_id):
        raise HTTPException(status_code=400, detail="Invalid notice id")
    item = await db.hostel_notices.find_one({"_id": ObjectId(notice_id)})
    if not item:
        raise HTTPException(status_code=404, detail="Notice not found")
    return serialize_hostel_notice(item)


@router.post("/notices", status_code=201)
async def create_hostel_notice(
    title: str = Form(...),
    content: str = Form(...),
    category: Optional[str] = Form("notice"),
    pinned: bool = Form(False),
    order: int = Form(0),
    active: bool = Form(True),
    attachment: Optional[UploadFile] = File(None),
    admin=Depends(get_current_admin),
):
    """Create a hostel notice."""
    attachment_url = None
    if attachment:
        file_id = await save_uploaded_file(db, attachment, category="hostel_notices")
        attachment_url = get_file_url(file_id)

    doc = {
        "title": title,
        "content": content,
        "category": (category or "notice").lower(),
        "attachment_url": attachment_url,
        "pinned": pinned,
        "order": order,
        "active": active,
        "created_at": datetime.utcnow(),
    }
    result = await db.hostel_notices.insert_one(doc)
    return {"id": str(result.inserted_id)}


@router.put("/notices/{notice_id}")
async def update_hostel_notice(
    notice_id: str,
    title: str = Form(...),
    content: str = Form(...),
    category: Optional[str] = Form("notice"),
    pinned: bool = Form(False),
    order: int = Form(0),
    active: bool = Form(True),
    attachment: Optional[UploadFile] = File(None),
    admin=Depends(get_current_admin),
):
    """Update a hostel notice."""
    if not ObjectId.is_valid(notice_id):
        raise HTTPException(status_code=400, detail="Invalid notice id")

    update_data = {
        "title": title,
        "content": content,
        "category": (category or "notice").lower(),
        "pinned": pinned,
        "order": order,
        "active": active,
    }

    if attachment:
        file_id = await save_uploaded_file(db, attachment, category="hostel_notices")
        update_data["attachment_url"] = get_file_url(file_id)

    result = await db.hostel_notices.update_one({"_id": ObjectId(notice_id)}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notice not found")
    return {"message": "Updated"}


@router.delete("/notices/{notice_id}")
async def delete_hostel_notice(notice_id: str, admin=Depends(get_current_admin)):
    """Delete a hostel notice."""
    if not ObjectId.is_valid(notice_id):
        raise HTTPException(status_code=400, detail="Invalid notice id")
    result = await db.hostel_notices.delete_one({"_id": ObjectId(notice_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notice not found")
    return {"message": "Deleted"}


# ==================== HOSTEL GALLERY ENDPOINTS ====================

@router.get("/gallery")
async def get_hostel_gallery(category: Optional[str] = None):
    """Get all active hostel gallery items."""
    query = {"active": True}
    if category:
        query["category"] = category
    
    items = []
    async for item in db.hostel_gallery.find(query).sort([("featured", -1), ("order", 1)]):
        items.append(serialize_hostel_gallery(item))
    return items


@router.get("/gallery/all")
async def get_all_hostel_gallery(admin=Depends(get_current_admin)):
    """Get all hostel gallery items (admin)."""
    items = []
    async for item in db.hostel_gallery.find().sort([("featured", -1), ("order", 1)]):
        items.append(serialize_hostel_gallery(item))
    return items


@router.get("/gallery/{gallery_id}")
async def get_hostel_gallery_item(gallery_id: str):
    """Get a specific hostel gallery item."""
    if not ObjectId.is_valid(gallery_id):
        raise HTTPException(status_code=400, detail="Invalid gallery id")
    item = await db.hostel_gallery.find_one({"_id": ObjectId(gallery_id)})
    if not item:
        raise HTTPException(status_code=404, detail="Gallery item not found")
    return serialize_hostel_gallery(item)


@router.post("/gallery", status_code=201)
async def create_hostel_gallery(
    title: str = Form(...),
    caption: Optional[str] = Form(None),
    category: Optional[str] = Form("hostel-life"),
    media_type: Optional[str] = Form("image"),
    featured: bool = Form(False),
    order: int = Form(0),
    active: bool = Form(True),
    media: Optional[UploadFile] = File(None),
    admin=Depends(get_current_admin),
):
    """Create a hostel gallery item."""
    media_url = None
    if media:
        file_id = await save_uploaded_file(db, media, category="hostel_gallery")
        media_url = get_file_url(file_id)

    doc = {
        "title": title,
        "caption": caption or "",
        "media_url": media_url,
        "media_type": (media_type or "image").lower(),
        "category": (category or "hostel-life").lower(),
        "featured": featured,
        "order": order,
        "active": active,
        "created_at": datetime.utcnow(),
    }
    result = await db.hostel_gallery.insert_one(doc)
    return {"id": str(result.inserted_id)}


@router.put("/gallery/{gallery_id}")
async def update_hostel_gallery(
    gallery_id: str,
    title: str = Form(...),
    caption: Optional[str] = Form(None),
    category: Optional[str] = Form("hostel-life"),
    media_type: Optional[str] = Form("image"),
    featured: bool = Form(False),
    order: int = Form(0),
    active: bool = Form(True),
    media: Optional[UploadFile] = File(None),
    admin=Depends(get_current_admin),
):
    """Update a hostel gallery item."""
    if not ObjectId.is_valid(gallery_id):
        raise HTTPException(status_code=400, detail="Invalid gallery id")

    update_data = {
        "title": title,
        "caption": caption or "",
        "media_type": (media_type or "image").lower(),
        "category": (category or "hostel-life").lower(),
        "featured": featured,
        "order": order,
        "active": active,
    }

    if media:
        file_id = await save_uploaded_file(db, media, category="hostel_gallery")
        update_data["media_url"] = get_file_url(file_id)

    result = await db.hostel_gallery.update_one({"_id": ObjectId(gallery_id)}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Gallery item not found")
    return {"message": "Updated"}


@router.delete("/gallery/{gallery_id}")
async def delete_hostel_gallery(gallery_id: str, admin=Depends(get_current_admin)):
    """Delete a hostel gallery item."""
    if not ObjectId.is_valid(gallery_id):
        raise HTTPException(status_code=400, detail="Invalid gallery id")
    result = await db.hostel_gallery.delete_one({"_id": ObjectId(gallery_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Gallery item not found")
    return {"message": "Deleted"}
