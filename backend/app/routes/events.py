from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Query
from ..config.database import db
from ..routes.auth import get_current_admin
from bson import ObjectId
import uuid
from ..utils.storage import save_uploaded_file, get_file_url

router = APIRouter()


def _parse_bool(value, default=False):
    if isinstance(value, bool):
        return value
    if value is None:
        return default
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


def _normalize_status(value: Optional[str], active: bool = True) -> str:
    status = str(value or "").strip().lower()
    if status not in {"published", "draft"}:
        return "published" if active else "draft"
    return status


def _parse_event_date(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    raw = str(value).strip()
    if not raw:
        return None
    try:
        return datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except Exception:
        return None


def serialize_event(item: dict) -> dict:
    created_at = item.get("created_at")
    category = str(item.get("category") or "event").lower()
    if category not in {"event", "achievement", "home_slider"}:
        category = "event"

    gallery_images = item.get("gallery_images") or item.get("image_urls") or []
    if not isinstance(gallery_images, list):
        gallery_images = []
    if item.get("image_url") and item.get("image_url") not in gallery_images:
        gallery_images = [item.get("image_url")] + gallery_images

    return {
        "id": str(item.get("_id")),
        "title": item.get("title") or "Untitled",
        "short_description": item.get("short_description") or item.get("summary") or "",
        "full_description": item.get("full_description") or item.get("details") or item.get("description") or "",
        "category": category,
        "event_category": item.get("event_category") or "General",
        "location": item.get("location") or "",
        "status": _normalize_status(item.get("status"), bool(item.get("active", True))),
        "is_featured": bool(item.get("is_featured", False)),
        "is_highlighted": bool(item.get("is_highlighted", False)),
        "active": bool(item.get("active", True)),
        "event_date": item.get("event_date") or "",
        "image_url": item.get("image_url"),
        "gallery_images": gallery_images,
        "image_urls": gallery_images,
        "brochure_url": item.get("brochure_url"),
        "created_at": created_at.isoformat() if isinstance(created_at, datetime) else None,
    }


@router.get("")
async def list_events(
    category: Optional[str] = Query(None, description="Single category or comma-separated categories"),
    event_category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None, ge=1, le=12),
    featured_only: bool = Query(False),
    include_inactive: bool = Query(False),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    items = []
    async for ev in db.events.find().sort("created_at", -1):
        item = serialize_event(ev)
        if not include_inactive and (not item.get("active", True) or item.get("status") != "published"):
            continue
        items.append(item)

    if category:
        categories = {c.strip().lower() for c in category.split(",") if c.strip()}
        if categories:
            items = [item for item in items if item.get("category") in categories]

    if event_category:
        target = str(event_category).strip().lower()
        items = [item for item in items if str(item.get("event_category") or "").strip().lower() == target]

    if status:
        target_status = _normalize_status(status)
        items = [item for item in items if item.get("status") == target_status]

    if featured_only:
        items = [item for item in items if item.get("is_featured") or item.get("is_highlighted")]

    if search:
        term = str(search).strip().lower()
        items = [item for item in items if term in str(item.get("title") or "").lower()]

    if year or month:
        filtered = []
        for item in items:
            date_obj = _parse_event_date(item.get("event_date"))
            if not date_obj:
                continue
            if year and date_obj.year != year:
                continue
            if month and date_obj.month != month:
                continue
            filtered.append(item)
        items = filtered

    def sort_key(entry):
        event_dt = _parse_event_date(entry.get("event_date"))
        if event_dt:
            return event_dt
        created_dt = _parse_event_date(entry.get("created_at"))
        return created_dt or datetime.min

    items.sort(key=sort_key, reverse=True)
    return items[skip:skip + limit]


@router.get("/all")
async def list_all_events(admin=Depends(get_current_admin)):
    items = []
    async for ev in db.events.find().sort("created_at", -1):
        items.append(serialize_event(ev))
    return items


@router.get("/{event_id}")
async def get_event(event_id: str, include_inactive: bool = Query(False)):
    if not ObjectId.is_valid(event_id):
        raise HTTPException(status_code=400, detail="Invalid event id")

    ev = await db.events.find_one({"_id": ObjectId(event_id)})
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")

    item = serialize_event(ev)
    if not include_inactive and (not item.get("active", True) or item.get("status") != "published"):
        raise HTTPException(status_code=404, detail="Event not found")

    return item


@router.post("", status_code=201)
async def create_event(
    title: str = Form(...),
    short_description: str = Form(...),
    full_description: Optional[str] = Form(None),
    category: str = Form("event"),
    categories: Optional[str] = Form(None),
    event_category: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    status: Optional[str] = Form(None),
    is_featured: bool = Form(False),
    is_highlighted: bool = Form(False),
    active: bool = Form(True),
    event_date: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    images: Optional[List[UploadFile]] = File(None),
    brochure: Optional[UploadFile] = File(None),
    admin=Depends(get_current_admin),
):
    valid_categories = {"event", "achievement", "home_slider"}
    target_categories = []

    if categories:
        for raw in categories.split(","):
            value = str(raw or "").strip().lower()
            if value in valid_categories and value not in target_categories:
                target_categories.append(value)

    if not target_categories:
        normalized_category = str(category or "event").lower()
        if normalized_category not in valid_categories:
            normalized_category = "event"
        target_categories = [normalized_category]

    active_value = _parse_bool(active, True)
    featured_value = _parse_bool(is_featured, False)
    highlighted_value = _parse_bool(is_highlighted, False)
    status_value = _normalize_status(status, active_value)

    image_url = None
    if image:
        file_id = await save_uploaded_file(db, image, category="events")
        image_url = get_file_url(file_id)

    gallery_images = []
    for image_item in images or []:
        file_id = await save_uploaded_file(db, image_item, category="events")
        gallery_images.append(get_file_url(file_id))

    if image_url and image_url not in gallery_images:
        gallery_images.insert(0, image_url)

    brochure_url = None
    if brochure:
        brochure_id = await save_uploaded_file(db, brochure, category="events")
        brochure_url = get_file_url(brochure_id)

    group_id = uuid.uuid4().hex if len(target_categories) > 1 else None

    docs = []
    created_at = datetime.utcnow()
    for target_category in target_categories:
        docs.append({
            "title": title,
            "short_description": short_description,
            "full_description": full_description,
            "category": target_category,
            "event_category": (event_category or "General").strip() or "General",
            "location": (location or "").strip(),
            "status": status_value,
            "is_featured": featured_value,
            "is_highlighted": highlighted_value,
            "group_id": group_id,
            "active": active_value,
            "event_date": event_date,
            "image_url": image_url,
            "gallery_images": gallery_images,
            "image_urls": gallery_images,
            "brochure_url": brochure_url,
            "created_at": created_at,
        })

    result = await db.events.insert_many(docs)
    inserted_ids = [str(inserted_id) for inserted_id in result.inserted_ids]
    return {"id": inserted_ids[0], "ids": inserted_ids, "count": len(inserted_ids)}


@router.put("/{event_id}")
async def update_event(
    event_id: str,
    title: str = Form(...),
    short_description: str = Form(...),
    full_description: Optional[str] = Form(None),
    category: str = Form("event"),
    categories: Optional[str] = Form(None),
    event_category: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    status: Optional[str] = Form(None),
    is_featured: bool = Form(False),
    is_highlighted: bool = Form(False),
    active: bool = Form(True),
    event_date: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    images: Optional[List[UploadFile]] = File(None),
    brochure: Optional[UploadFile] = File(None),
    admin=Depends(get_current_admin),
):
    if not ObjectId.is_valid(event_id):
        raise HTTPException(status_code=400, detail="Invalid event id")

    current = await db.events.find_one({"_id": ObjectId(event_id)})
    if not current:
        raise HTTPException(status_code=404, detail="Event not found")

    valid_categories = {"event", "achievement", "home_slider"}
    target_categories = []

    if categories:
        for raw in categories.split(","):
            value = str(raw or "").strip().lower()
            if value in valid_categories and value not in target_categories:
                target_categories.append(value)

    normalized_category = str(category or "event").lower()
    if normalized_category not in valid_categories:
        normalized_category = "event"

    active_value = _parse_bool(active, True)
    featured_value = _parse_bool(is_featured, False)
    highlighted_value = _parse_bool(is_highlighted, False)
    status_value = _normalize_status(status, active_value)

    doc = {
        "title": title,
        "short_description": short_description,
        "full_description": full_description,
        "event_category": (event_category or "General").strip() or "General",
        "location": (location or "").strip(),
        "status": status_value,
        "is_featured": featured_value,
        "is_highlighted": highlighted_value,
        "category": normalized_category,
        "active": active_value,
        "event_date": event_date,
    }

    if image:
        file_id = await save_uploaded_file(db, image, category="events")
        doc["image_url"] = get_file_url(file_id)

    if images is not None:
        gallery_images = []
        for image_item in images:
            file_id = await save_uploaded_file(db, image_item, category="events")
            gallery_images.append(get_file_url(file_id))
        featured_image = doc.get("image_url") or current.get("image_url")
        if featured_image and featured_image not in gallery_images:
            gallery_images.insert(0, featured_image)
        doc["gallery_images"] = gallery_images
        doc["image_urls"] = gallery_images
    elif current.get("gallery_images"):
        doc["gallery_images"] = current.get("gallery_images")
        doc["image_urls"] = current.get("gallery_images")

    if brochure:
        brochure_id = await save_uploaded_file(db, brochure, category="events")
        doc["brochure_url"] = get_file_url(brochure_id)

    if target_categories:
        group_id = current.get("group_id") or uuid.uuid4().hex
        common_doc = {
            "title": title,
            "short_description": short_description,
            "full_description": full_description,
            "event_category": doc.get("event_category"),
            "location": doc.get("location"),
            "status": doc.get("status"),
            "is_featured": doc.get("is_featured"),
            "is_highlighted": doc.get("is_highlighted"),
            "active": active_value,
            "event_date": event_date,
            "group_id": group_id,
        }
        if "image_url" in doc:
            common_doc["image_url"] = doc["image_url"]
        elif current.get("image_url"):
            common_doc["image_url"] = current.get("image_url")
        if "gallery_images" in doc:
            common_doc["gallery_images"] = doc["gallery_images"]
            common_doc["image_urls"] = doc["gallery_images"]
        elif current.get("gallery_images"):
            common_doc["gallery_images"] = current.get("gallery_images")
            common_doc["image_urls"] = current.get("gallery_images")
        if "brochure_url" in doc:
            common_doc["brochure_url"] = doc["brochure_url"]
        elif current.get("brochure_url"):
            common_doc["brochure_url"] = current.get("brochure_url")

        updates = []
        for target_category in target_categories:
            target_doc = dict(common_doc)
            target_doc["category"] = target_category
            existing = await db.events.find_one({"group_id": group_id, "category": target_category})
            if existing:
                await db.events.update_one({"_id": existing["_id"]}, {"$set": target_doc})
                updates.append(str(existing["_id"]))
            else:
                target_doc["created_at"] = datetime.utcnow()
                inserted = await db.events.insert_one(target_doc)
                updates.append(str(inserted.inserted_id))

        if str(current["_id"]) not in updates:
            current_target = target_categories[0]
            await db.events.update_one(
                {"_id": ObjectId(event_id)},
                {"$set": {**common_doc, "category": current_target}},
            )
            updates.append(event_id)

        return {"message": "Updated", "ids": updates, "count": len(updates)}

    result = await db.events.update_one({"_id": ObjectId(event_id)}, {"$set": doc})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"message": "Updated"}


@router.delete("/{event_id}")
async def delete_event(event_id: str, admin=Depends(get_current_admin)):
    if not ObjectId.is_valid(event_id):
        raise HTTPException(status_code=400, detail="Invalid event id")
    result = await db.events.delete_one({"_id": ObjectId(event_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"message": "Deleted"}
