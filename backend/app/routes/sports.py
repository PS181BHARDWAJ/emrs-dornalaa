from datetime import datetime
from typing import Optional, List, Any, Dict
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Query
from ..config.database import db
from ..routes.auth import get_current_admin
from bson import ObjectId
import uuid
from ..utils.storage import save_uploaded_file, get_file_url

router = APIRouter()


def serialize_sport(item: dict) -> dict:
    """Serialize a sport facility document."""
    return {
        "id": str(item.get("_id")),
        "name": item.get("name") or "Untitled Sport",
        "description": item.get("description") or "",
        "icon": item.get("icon") or "fas fa-dumbbell",
        "image_url": item.get("image_url"),
        "facility_details": item.get("facility_details") or "",
        "equipment": item.get("equipment") or [],
        "coaches": item.get("coaches") or [],
        "order": item.get("order", 0),
        "featured": bool(item.get("featured", False)),
        "active": bool(item.get("active", True)),
        "created_at": item.get("created_at").isoformat() if isinstance(item.get("created_at"), datetime) else None,
    }


def serialize_sports_event(item: dict) -> dict:
    """Serialize a sports event document."""
    event_date = item.get("event_date")
    return {
        "id": str(item.get("_id")),
        "title": item.get("title") or "Untitled Event",
        "description": item.get("description") or "",
        "banner_image": item.get("banner_image"),
        "event_date": event_date.isoformat() if isinstance(event_date, datetime) else None,
        "venue": item.get("venue") or "",
        "sport_type": item.get("sport_type") or "",
        "event_type": item.get("event_type") or "upcoming",
        "registration_details": item.get("registration_details") or "",
        "participants": item.get("participants") or [],
        "results": item.get("results") or "",
        "gallery_images": item.get("gallery_images") or [],
        "order": item.get("order", 0),
        "active": bool(item.get("active", True)),
        "created_at": item.get("created_at").isoformat() if isinstance(item.get("created_at"), datetime) else None,
    }


def serialize_achievement(item: dict) -> dict:
    """Serialize a sports achievement document."""
    achieved_at = item.get("achieved_at")
    return {
        "id": str(item.get("_id")),
        "title": item.get("title") or "Achievement",
        "student_name": item.get("student_name") or "",
        "student_class": item.get("student_class") or "",
        "competition": item.get("competition") or "",
        "achievement_type": item.get("achievement_type") or "medal",
        "position": item.get("position") or "",
        "sport_type": item.get("sport_type") or "",
        "image_url": item.get("image_url"),
        "gallery_images": item.get("gallery_images") or [],
        "details": item.get("details") or "",
        "achieved_at": achieved_at.isoformat() if isinstance(achieved_at, datetime) else None,
        "order": item.get("order", 0),
        "featured": bool(item.get("featured", False)),
        "active": bool(item.get("active", True)),
        "created_at": item.get("created_at").isoformat() if isinstance(item.get("created_at"), datetime) else None,
    }


# ==================== SPORTS FACILITIES ENDPOINTS ====================

@router.get("/sports")
async def get_sports():
    """Get all active sports facilities."""
    items = []
    async for item in db.sports_facilities.find({"active": True}).sort("order", 1):
        items.append(serialize_sport(item))
    return items


@router.get("/sports/all")
async def get_all_sports(admin=Depends(get_current_admin)):
    """Get all sports (admin - includes inactive)."""
    items = []
    async for item in db.sports_facilities.find().sort("order", 1):
        items.append(serialize_sport(item))
    return items


# ==================== SPORTS EVENTS ENDPOINTS ====================

@router.get("/sports/events")
async def get_sports_events(event_type: Optional[str] = None):
    """Get all active sports events."""
    query = {"active": True}
    if event_type:
        query["event_type"] = event_type.lower()
    
    items = []
    async for item in db.sports_events.find(query).sort("event_date", -1):
        items.append(serialize_sports_event(item))
    return items


@router.get("/sports/events/all")
async def get_all_sports_events(admin=Depends(get_current_admin)):
    """Get all sports events (admin - includes inactive)."""
    items = []
    async for item in db.sports_events.find().sort("event_date", -1):
        items.append(serialize_sports_event(item))
    return items


@router.get("/sports/events/{event_id}")
async def get_sports_event(event_id: str):
    """Get a specific sports event."""
    if not ObjectId.is_valid(event_id):
        raise HTTPException(status_code=400, detail="Invalid event id")
    item = await db.sports_events.find_one({"_id": ObjectId(event_id)})
    if not item:
        raise HTTPException(status_code=404, detail="Event not found")
    return serialize_sports_event(item)


@router.post("/sports/events", status_code=201)
async def create_sports_event(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    event_date: Optional[str] = Form(None),
    venue: Optional[str] = Form(None),
    sport_type: Optional[str] = Form(None),
    event_type: Optional[str] = Form("upcoming"),
    registration_details: Optional[str] = Form(None),
    participants: Optional[str] = Form(None),
    results: Optional[str] = Form(None),
    order: int = Form(0),
    active: bool = Form(True),
    banner_image: Optional[UploadFile] = File(None),
    admin=Depends(get_current_admin),
):
    """Create a new sports event."""
    banner_image_url = None
    if banner_image:
        file_id = await save_uploaded_file(db, banner_image, category="sports_events")
        banner_image_url = get_file_url(file_id)

    event_dt = None
    if event_date:
        try:
            event_dt = datetime.fromisoformat(event_date.replace("Z", "+00:00"))
        except:
            pass

    participants_list = [p.strip() for p in (participants or "").split(",") if p.strip()]

    doc = {
        "title": title,
        "description": description or "",
        "banner_image": banner_image_url,
        "event_date": event_dt or datetime.utcnow(),
        "venue": venue or "",
        "sport_type": sport_type or "",
        "event_type": (event_type or "upcoming").lower(),
        "registration_details": registration_details or "",
        "participants": participants_list,
        "results": results or "",
        "gallery_images": [],
        "order": order,
        "active": active,
        "created_at": datetime.utcnow(),
    }
    result = await db.sports_events.insert_one(doc)
    return {"id": str(result.inserted_id)}


@router.put("/sports/events/{event_id}")
async def update_sports_event(
    event_id: str,
    title: str = Form(...),
    description: Optional[str] = Form(None),
    event_date: Optional[str] = Form(None),
    venue: Optional[str] = Form(None),
    sport_type: Optional[str] = Form(None),
    event_type: Optional[str] = Form("upcoming"),
    registration_details: Optional[str] = Form(None),
    participants: Optional[str] = Form(None),
    results: Optional[str] = Form(None),
    order: int = Form(0),
    active: bool = Form(True),
    banner_image: Optional[UploadFile] = File(None),
    admin=Depends(get_current_admin),
):
    """Update a sports event."""
    if not ObjectId.is_valid(event_id):
        raise HTTPException(status_code=400, detail="Invalid event id")

    event_dt = None
    if event_date:
        try:
            event_dt = datetime.fromisoformat(event_date.replace("Z", "+00:00"))
        except:
            pass

    participants_list = [p.strip() for p in (participants or "").split(",") if p.strip()]

    update_data = {
        "title": title,
        "description": description or "",
        "event_date": event_dt or datetime.utcnow(),
        "venue": venue or "",
        "sport_type": sport_type or "",
        "event_type": (event_type or "upcoming").lower(),
        "registration_details": registration_details or "",
        "participants": participants_list,
        "results": results or "",
        "order": order,
        "active": active,
    }

    if banner_image:
        file_id = await save_uploaded_file(db, banner_image, category="sports_events")
        update_data["banner_image"] = get_file_url(file_id)

    result = await db.sports_events.update_one({"_id": ObjectId(event_id)}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"message": "Updated"}


@router.patch("/sports/events/{event_id}/toggle")
async def toggle_sports_event(event_id: str, admin=Depends(get_current_admin)):
    """Toggle sports event active status."""
    if not ObjectId.is_valid(event_id):
        raise HTTPException(status_code=400, detail="Invalid event id")
    item = await db.sports_events.find_one({"_id": ObjectId(event_id)})
    if not item:
        raise HTTPException(status_code=404, detail="Event not found")
    new_status = not item.get("active", True)
    await db.sports_events.update_one({"_id": ObjectId(event_id)}, {"$set": {"active": new_status}})
    return {"message": "Toggled", "active": new_status}


@router.delete("/sports/events/{event_id}")
async def delete_sports_event(event_id: str, admin=Depends(get_current_admin)):
    """Delete a sports event."""
    if not ObjectId.is_valid(event_id):
        raise HTTPException(status_code=400, detail="Invalid event id")
    result = await db.sports_events.delete_one({"_id": ObjectId(event_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"message": "Deleted"}


# ==================== ACHIEVEMENTS ENDPOINTS ====================

@router.get("/sports/achievements")
async def get_achievements(sport_type: Optional[str] = None, year: Optional[int] = None):
    """Get all active sports achievements."""
    query = {"active": True}
    if sport_type:
        query["sport_type"] = sport_type
    
    items = []
    async for item in db.sports_achievements.find(query).sort("achieved_at", -1):
        items.append(serialize_achievement(item))
    return items


@router.get("/sports/achievements/all")
async def get_all_achievements(admin=Depends(get_current_admin)):
    """Get all achievements (admin - includes inactive)."""
    items = []
    async for item in db.sports_achievements.find().sort("achieved_at", -1):
        items.append(serialize_achievement(item))
    return items


@router.get("/sports/achievements/{achievement_id}")
async def get_achievement(achievement_id: str):
    """Get a specific achievement."""
    if not ObjectId.is_valid(achievement_id):
        raise HTTPException(status_code=400, detail="Invalid achievement id")
    item = await db.sports_achievements.find_one({"_id": ObjectId(achievement_id)})
    if not item:
        raise HTTPException(status_code=404, detail="Achievement not found")
    return serialize_achievement(item)


@router.post("/sports/achievements", status_code=201)
async def create_achievement(
    title: str = Form(...),
    student_name: Optional[str] = Form(None),
    student_class: Optional[str] = Form(None),
    competition: Optional[str] = Form(None),
    achievement_type: Optional[str] = Form("medal"),
    position: Optional[str] = Form(None),
    sport_type: Optional[str] = Form(None),
    details: Optional[str] = Form(None),
    achieved_at: Optional[str] = Form(None),
    order: int = Form(0),
    featured: bool = Form(False),
    active: bool = Form(True),
    image: Optional[UploadFile] = File(None),
    admin=Depends(get_current_admin),
):
    """Create a new achievement."""
    image_url = None
    if image:
        file_id = await save_uploaded_file(db, image, category="sports_achievements")
        image_url = get_file_url(file_id)

    achieved_dt = None
    if achieved_at:
        try:
            achieved_dt = datetime.fromisoformat(achieved_at.replace("Z", "+00:00"))
        except:
            achieved_dt = datetime.utcnow()
    else:
        achieved_dt = datetime.utcnow()

    doc = {
        "title": title,
        "student_name": student_name or "",
        "student_class": student_class or "",
        "competition": competition or "",
        "achievement_type": (achievement_type or "medal").lower(),
        "position": position or "",
        "sport_type": sport_type or "",
        "image_url": image_url,
        "gallery_images": [],
        "details": details or "",
        "achieved_at": achieved_dt,
        "order": order,
        "featured": featured,
        "active": active,
        "created_at": datetime.utcnow(),
    }
    result = await db.sports_achievements.insert_one(doc)
    return {"id": str(result.inserted_id)}


@router.put("/sports/achievements/{achievement_id}")
async def update_achievement(
    achievement_id: str,
    title: str = Form(...),
    student_name: Optional[str] = Form(None),
    student_class: Optional[str] = Form(None),
    competition: Optional[str] = Form(None),
    achievement_type: Optional[str] = Form("medal"),
    position: Optional[str] = Form(None),
    sport_type: Optional[str] = Form(None),
    details: Optional[str] = Form(None),
    achieved_at: Optional[str] = Form(None),
    order: int = Form(0),
    featured: bool = Form(False),
    active: bool = Form(True),
    image: Optional[UploadFile] = File(None),
    admin=Depends(get_current_admin),
):
    """Update an achievement."""
    if not ObjectId.is_valid(achievement_id):
        raise HTTPException(status_code=400, detail="Invalid achievement id")

    achieved_dt = None
    if achieved_at:
        try:
            achieved_dt = datetime.fromisoformat(achieved_at.replace("Z", "+00:00"))
        except:
            achieved_dt = datetime.utcnow()
    else:
        achieved_dt = datetime.utcnow()

    update_data = {
        "title": title,
        "student_name": student_name or "",
        "student_class": student_class or "",
        "competition": competition or "",
        "achievement_type": (achievement_type or "medal").lower(),
        "position": position or "",
        "sport_type": sport_type or "",
        "details": details or "",
        "achieved_at": achieved_dt,
        "order": order,
        "featured": featured,
        "active": active,
    }

    if image:
        file_id = await save_uploaded_file(db, image, category="sports_achievements")
        update_data["image_url"] = get_file_url(file_id)

    result = await db.sports_achievements.update_one({"_id": ObjectId(achievement_id)}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Achievement not found")
    return {"message": "Updated"}


@router.patch("/sports/achievements/{achievement_id}/toggle")
async def toggle_achievement(achievement_id: str, admin=Depends(get_current_admin)):
    """Toggle achievement active status."""
    if not ObjectId.is_valid(achievement_id):
        raise HTTPException(status_code=400, detail="Invalid achievement id")
    item = await db.sports_achievements.find_one({"_id": ObjectId(achievement_id)})
    if not item:
        raise HTTPException(status_code=404, detail="Achievement not found")
    new_status = not item.get("active", True)
    await db.sports_achievements.update_one({"_id": ObjectId(achievement_id)}, {"$set": {"active": new_status}})
    return {"message": "Toggled", "active": new_status}


@router.delete("/sports/achievements/{achievement_id}")
async def delete_achievement(achievement_id: str, admin=Depends(get_current_admin)):
    """Delete an achievement."""
    if not ObjectId.is_valid(achievement_id):
        raise HTTPException(status_code=400, detail="Invalid achievement id")
    result = await db.sports_achievements.delete_one({"_id": ObjectId(achievement_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Achievement not found")
    return {"message": "Deleted"}


# ==================== SPORTS FACILITY DETAIL ROUTES (MUST BE LAST) ====================

@router.get("/sports/{sport_id}")
async def get_sport(sport_id: str):
    """Get a specific sport facility."""
    if not ObjectId.is_valid(sport_id):
        raise HTTPException(status_code=400, detail="Invalid sport id")
    item = await db.sports_facilities.find_one({"_id": ObjectId(sport_id)})
    if not item:
        raise HTTPException(status_code=404, detail="Sport not found")
    return serialize_sport(item)


@router.post("/sports", status_code=201)
async def create_sport(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    icon: Optional[str] = Form("fas fa-dumbbell"),
    facility_details: Optional[str] = Form(None),
    equipment: Optional[str] = Form(None),
    coaches: Optional[str] = Form(None),
    order: int = Form(0),
    featured: bool = Form(False),
    active: bool = Form(True),
    image: Optional[UploadFile] = File(None),
    admin=Depends(get_current_admin),
):
    """Create a new sport facility."""
    image_url = None
    if image:
        file_id = await save_uploaded_file(db, image, category="sports")
        image_url = get_file_url(file_id)

    equipment_list = [e.strip() for e in (equipment or "").split(",") if e.strip()]
    coaches_list = [c.strip() for c in (coaches or "").split(",") if c.strip()]

    doc = {
        "name": name,
        "description": description or "",
        "icon": icon or "fas fa-dumbbell",
        "image_url": image_url,
        "facility_details": facility_details or "",
        "equipment": equipment_list,
        "coaches": coaches_list,
        "order": order,
        "featured": featured,
        "active": active,
        "created_at": datetime.utcnow(),
    }
    result = await db.sports_facilities.insert_one(doc)
    return {"id": str(result.inserted_id)}


@router.put("/sports/{sport_id}")
async def update_sport(
    sport_id: str,
    name: str = Form(...),
    description: Optional[str] = Form(None),
    icon: Optional[str] = Form("fas fa-dumbbell"),
    facility_details: Optional[str] = Form(None),
    equipment: Optional[str] = Form(None),
    coaches: Optional[str] = Form(None),
    order: int = Form(0),
    featured: bool = Form(False),
    active: bool = Form(True),
    image: Optional[UploadFile] = File(None),
    admin=Depends(get_current_admin),
):
    """Update a sport facility."""
    if not ObjectId.is_valid(sport_id):
        raise HTTPException(status_code=400, detail="Invalid sport id")

    equipment_list = [e.strip() for e in (equipment or "").split(",") if e.strip()]
    coaches_list = [c.strip() for c in (coaches or "").split(",") if c.strip()]

    update_data = {
        "name": name,
        "description": description or "",
        "icon": icon or "fas fa-dumbbell",
        "facility_details": facility_details or "",
        "equipment": equipment_list,
        "coaches": coaches_list,
        "order": order,
        "featured": featured,
        "active": active,
    }

    if image:
        file_id = await save_uploaded_file(db, image, category="sports")
        update_data["image_url"] = get_file_url(file_id)

    result = await db.sports_facilities.update_one({"_id": ObjectId(sport_id)}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Sport not found")
    return {"message": "Updated"}


@router.patch("/sports/{sport_id}/toggle")
async def toggle_sport(sport_id: str, admin=Depends(get_current_admin)):
    """Toggle sport active status."""
    if not ObjectId.is_valid(sport_id):
        raise HTTPException(status_code=400, detail="Invalid sport id")
    item = await db.sports_facilities.find_one({"_id": ObjectId(sport_id)})
    if not item:
        raise HTTPException(status_code=404, detail="Sport not found")
    new_status = not item.get("active", True)
    await db.sports_facilities.update_one({"_id": ObjectId(sport_id)}, {"$set": {"active": new_status}})
    return {"message": "Toggled", "active": new_status}


@router.delete("/sports/{sport_id}")
async def delete_sport(sport_id: str, admin=Depends(get_current_admin)):
    """Delete a sport facility."""
    if not ObjectId.is_valid(sport_id):
        raise HTTPException(status_code=400, detail="Invalid sport id")
    result = await db.sports_facilities.delete_one({"_id": ObjectId(sport_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Sport not found")
    return {"message": "Deleted"}
