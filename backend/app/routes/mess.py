from datetime import datetime
from typing import Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from ..config.database import db
from ..routes.auth import get_current_admin
from ..utils.storage import get_file_url, save_uploaded_file

router = APIRouter()


# =====================================================
# SERIALIZERS
# =====================================================

def serialize_hero(item: dict) -> dict:
    return {
        "title": item.get("title") or "Mess Facilities",
        "subtitle": item.get("subtitle") or "Nutritious and hygienic dining for every student.",
        "banner_image": item.get("banner_image"),
        "overlay_opacity": float(item.get("overlay_opacity", 0.35)),
    }


def serialize_stats(item: dict) -> dict:
    return {
        "students": int(item.get("students", 500)),
        "meals": int(item.get("meals", 4)),
        "staff": int(item.get("staff", 12)),
        "quality": int(item.get("quality", 100)),
    }


def serialize_gallery(item: dict) -> dict:
    return {
        "id": str(item.get("_id")),
        "title": item.get("title") or "Mess Image",
        "caption": item.get("caption") or "",
        "image": item.get("image"),
        "media_type": item.get("media_type", "image"),
        "featured": bool(item.get("featured", False)),
        "display_order": int(item.get("display_order", 0)),
        "active": bool(item.get("active", True)),
    }


# =====================================================
# HERO
# =====================================================

@router.get("/hero")
async def get_hero():
    hero = await db.mess_hero.find_one()
    if not hero:
        return serialize_hero({})
    return serialize_hero(hero)


@router.put("/hero")
async def update_hero(
    title: str = Form(...),
    subtitle: str = Form(...),
    overlay_opacity: float = Form(0.35),
    banner: UploadFile | None = File(None),
    admin=Depends(get_current_admin),
):
    update_data = {
        "title": title,
        "subtitle": subtitle,
        "overlay_opacity": overlay_opacity,
    }
    if banner:
        file_id = await save_uploaded_file(db, banner, category="mess_hero")
        update_data["banner_image"] = get_file_url(file_id)

    await db.mess_hero.update_one({}, {"$set": update_data}, upsert=True)
    return {"message": "Mess hero updated"}


# =====================================================
# STATS
# =====================================================

@router.get("/stats")
async def get_stats():
    stats = await db.mess_stats.find_one()
    if not stats:
        return serialize_stats({})
    return serialize_stats(stats)


@router.put("/stats")
async def update_stats(
    students: int = Form(...),
    meals: int = Form(...),
    staff: int = Form(...),
    quality: int = Form(...),
    admin=Depends(get_current_admin),
):
    await db.mess_stats.update_one(
        {},
        {"$set": {
            "students": students,
            "meals": meals,
            "staff": staff,
            "quality": quality,
        }},
        upsert=True,
    )
    return {"message": "Mess stats updated"}


# =====================================================
# GALLERY
# =====================================================

@router.get("/gallery")
async def get_gallery():
    items = []
    async for item in db.mess_gallery.find({"active": True}).sort("display_order", 1):
        items.append(serialize_gallery(item))
    return items


@router.get("/gallery/{gallery_id}")
async def get_gallery_item(gallery_id: str):
    if not ObjectId.is_valid(gallery_id):
        raise HTTPException(status_code=400, detail="Invalid gallery id")
    item = await db.mess_gallery.find_one({"_id": ObjectId(gallery_id)})
    if not item:
        raise HTTPException(status_code=404, detail="Gallery item not found")
    return serialize_gallery(item)


@router.post("/gallery")
async def create_gallery(
    title: str = Form(...),
    caption: str = Form(""),
    media_type: str = Form("image"),
    featured: bool = Form(False),
    display_order: int = Form(0),
    active: bool = Form(True),
    image: UploadFile = File(...),
    admin=Depends(get_current_admin),
):
    file_id = await save_uploaded_file(db, image, category="mess_gallery")
    result = await db.mess_gallery.insert_one({
        "title": title,
        "caption": caption,
        "image": get_file_url(file_id),
        "media_type": media_type,
        "featured": featured,
        "display_order": display_order,
        "active": active,
        "created_at": datetime.utcnow(),
    })
    return {"id": str(result.inserted_id)}


@router.put("/gallery/{gallery_id}")
async def update_gallery(
    gallery_id: str,
    title: str = Form(...),
    caption: str = Form(""),
    media_type: str = Form("image"),
    featured: bool = Form(False),
    display_order: int = Form(0),
    active: bool = Form(True),
    image: UploadFile | None = File(None),
    admin=Depends(get_current_admin),
):
    if not ObjectId.is_valid(gallery_id):
        raise HTTPException(status_code=400, detail="Invalid gallery id")
    update_data = {
        "title": title,
        "caption": caption,
        "media_type": media_type,
        "featured": featured,
        "display_order": display_order,
        "active": active,
    }
    if image:
        file_id = await save_uploaded_file(db, image, category="mess_gallery")
        update_data["image"] = get_file_url(file_id)
    result = await db.mess_gallery.update_one({"_id": ObjectId(gallery_id)}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Gallery item not found")
    return {"message": "Gallery item updated"}


@router.delete("/gallery/{gallery_id}")
async def delete_gallery(gallery_id: str, admin=Depends(get_current_admin)):
    if not ObjectId.is_valid(gallery_id):
        raise HTTPException(status_code=400, detail="Invalid gallery id")
    result = await db.mess_gallery.delete_one({"_id": ObjectId(gallery_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Gallery item not found")
    return {"message": "Gallery item deleted"}


# =====================================================
# MESS WEEKLY MENU
# =====================================================

@router.get("/menu")
async def get_mess_menu():
    menu = await db.mess_menu.find_one({"type": "weekly"})
    if not menu:
        return {
            "monday": {"breakfast": "", "lunch": "", "tea": "", "dinner": ""},
            "tuesday": {"breakfast": "", "lunch": "", "tea": "", "dinner": ""},
            "wednesday": {"breakfast": "", "lunch": "", "tea": "", "dinner": ""},
            "thursday": {"breakfast": "", "lunch": "", "tea": "", "dinner": ""},
            "friday": {"breakfast": "", "lunch": "", "tea": "", "dinner": ""},
            "saturday": {"breakfast": "", "lunch": "", "tea": "", "dinner": ""},
            "sunday": {"breakfast": "", "lunch": "", "tea": "", "dinner": ""},
        }
    if "_id" in menu:
        menu["_id"] = str(menu["_id"])
    return menu

@router.put("/menu")
async def update_mess_menu(payload: dict, admin=Depends(get_current_admin)):
    update_doc = {
        "monday": payload.get("monday", {}),
        "tuesday": payload.get("tuesday", {}),
        "wednesday": payload.get("wednesday", {}),
        "thursday": payload.get("thursday", {}),
        "friday": payload.get("friday", {}),
        "saturday": payload.get("saturday", {}),
        "sunday": payload.get("sunday", {}),
        "updated_at": datetime.utcnow()
    }
    await db.mess_menu.update_one(
        {"type": "weekly"},
        {"$set": update_doc},
        upsert=True
    )
    return {"message": "Mess menu updated successfully"}
