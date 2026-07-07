from datetime import datetime
from typing import Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from ..config.database import db
from ..routes.auth import get_current_admin
from ..utils.storage import get_file_url, save_uploaded_file

router = APIRouter()


def serialize_hero(item: dict) -> dict:
    return {
        "title": item.get("title") or "Staff Quarters",
        "subtitle": item.get("subtitle") or "Secure, comfortable housing for faculty and staff.",
        "banner_image": item.get("banner_image"),
        "overlay_opacity": float(item.get("overlay_opacity", 0.35)),
    }


def serialize_stats(item: dict) -> dict:
    return {
        "units": int(item.get("units", 72)),
        "faculty": int(item.get("faculty", 42)),
        "security": int(item.get("security", 24)),
        "occupancy": int(item.get("occupancy", 98)),
    }


def serialize_gallery(item: dict) -> dict:
    return {
        "id": str(item.get("_id")),
        "title": item.get("title") or "Staff Quarters Image",
        "caption": item.get("caption") or "",
        "image": item.get("image"),
        "media_type": item.get("media_type", "image"),
        "featured": bool(item.get("featured", False)),
        "display_order": int(item.get("display_order", 0)),
        "active": bool(item.get("active", True)),
    }


@router.get("/hero")
async def get_hero():
    hero = await db.staff_quarters_hero.find_one()
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
        file_id = await save_uploaded_file(db, banner, category="staff_quarters_hero")
        update_data["banner_image"] = get_file_url(file_id)
    await db.staff_quarters_hero.update_one({}, {"$set": update_data}, upsert=True)
    return {"message": "Staff quarters hero updated"}


@router.get("/stats")
async def get_stats():
    stats = await db.staff_quarters_stats.find_one()
    if not stats:
        return serialize_stats({})
    return serialize_stats(stats)


@router.put("/stats")
async def update_stats(
    units: int = Form(...),
    faculty: int = Form(...),
    security: int = Form(...),
    occupancy: int = Form(...),
    admin=Depends(get_current_admin),
):
    await db.staff_quarters_stats.update_one(
        {},
        {"$set": {
            "units": units,
            "faculty": faculty,
            "security": security,
            "occupancy": occupancy,
        }},
        upsert=True,
    )
    return {"message": "Staff quarters stats updated"}


@router.get("/gallery")
async def get_gallery():
    items = []
    async for item in db.staff_quarters_gallery.find({"active": True}).sort("display_order", 1):
        items.append(serialize_gallery(item))
    return items


@router.get("/gallery/{gallery_id}")
async def get_gallery_item(gallery_id: str):
    if not ObjectId.is_valid(gallery_id):
        raise HTTPException(status_code=400, detail="Invalid gallery id")
    item = await db.staff_quarters_gallery.find_one({"_id": ObjectId(gallery_id)})
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
    file_id = await save_uploaded_file(db, image, category="staff_quarters_gallery")
    result = await db.staff_quarters_gallery.insert_one({
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
        file_id = await save_uploaded_file(db, image, category="staff_quarters_gallery")
        update_data["image"] = get_file_url(file_id)
    result = await db.staff_quarters_gallery.update_one({"_id": ObjectId(gallery_id)}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Gallery item not found")
    return {"message": "Gallery item updated"}


@router.delete("/gallery/{gallery_id}")
async def delete_gallery(gallery_id: str, admin=Depends(get_current_admin)):
    if not ObjectId.is_valid(gallery_id):
        raise HTTPException(status_code=400, detail="Invalid gallery id")
    result = await db.staff_quarters_gallery.delete_one({"_id": ObjectId(gallery_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Gallery item not found")
    return {"message": "Gallery item deleted"}
