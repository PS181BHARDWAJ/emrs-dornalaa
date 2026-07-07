from datetime import datetime
from typing import List, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile

from ..config.database import db
from ..routes.auth import get_current_admin
from ..utils.storage import get_file_url, save_uploaded_file

router = APIRouter()


def _to_object_id(value: str, label: str = "id") -> ObjectId:
    if not ObjectId.is_valid(value):
        raise HTTPException(status_code=400, detail=f"Invalid {label}")
    return ObjectId(value)


def _parse_bool(value, default=False):
    if isinstance(value, bool):
        return value
    if value is None:
        return default
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


def serialize_alumni(item: dict) -> dict:
    return {
        "id": str(item.get("_id")),
        "name": item.get("name") or "",
        "batch_year": item.get("batch_year") or "",
        "current_role": item.get("current_role") or "",
        "company": item.get("company") or "",
        "location": item.get("location") or "",
        "email": item.get("email") or "",
        "linkedin_url": item.get("linkedin_url") or "",
        "success_story": item.get("success_story") or "",
        "photo_url": item.get("photo_url"),
        "is_featured": bool(item.get("is_featured", False)),
        "active": bool(item.get("active", True)),
        "created_at": item.get("created_at"),
    }


def serialize_alumni_event(item: dict) -> dict:
    image_urls = item.get("image_urls") or []
    primary = item.get("image_url") or (image_urls[0] if image_urls else None)
    return {
        "id": str(item.get("_id")),
        "title": item.get("title") or "",
        "date": item.get("date") or "",
        "location": item.get("location") or "",
        "description": item.get("description") or "",
        "image_url": primary,
        "images": [{"url": url} for url in image_urls],
        "is_featured": bool(item.get("is_featured", False)),
        "active": bool(item.get("active", True)),
        "participants_count": int(item.get("participants_count") or 0),
        "created_at": item.get("created_at"),
    }


def serialize_mentor(item: dict) -> dict:
    return {
        "id": str(item.get("_id")),
        "name": item.get("name") or "",
        "email": item.get("email") or "",
        "phone": item.get("phone") or "",
        "batch_year": item.get("batch_year") or "",
        "company": item.get("company") or "",
        "expertise": item.get("expertise") or "",
        "experience": int(item.get("experience") or 0),
        "availability": int(item.get("availability") or 0),
        "bio": item.get("bio") or "",
        "photo_url": item.get("photo_url"),
        "is_approved": bool(item.get("is_approved", False)),
        "status": item.get("status") or ("approved" if item.get("is_approved") else "pending"),
        "active": bool(item.get("active", True)),
        "created_at": item.get("created_at"),
    }


def serialize_request(item: dict) -> dict:
    return {
        "id": str(item.get("_id")),
        "mentor_id": item.get("mentor_id") or "",
        "student_name": item.get("student_name") or "",
        "student_email": item.get("student_email") or "",
        "student_phone": item.get("student_phone") or "",
        "request_reason": item.get("request_reason") or "",
        "status": item.get("status") or "pending",
        "created_at": item.get("created_at"),
    }


def serialize_testimonial(item: dict) -> dict:
    return {
        "id": str(item.get("_id")),
        "name": item.get("name") or "",
        "batch": item.get("batch") or "",
        "email": item.get("email") or "",
        "message": item.get("message") or "",
        "photo_url": item.get("photo_url"),
        "is_approved": bool(item.get("is_approved", False)),
        "status": item.get("status") or ("approved" if item.get("is_approved") else "pending"),
        "created_at": item.get("created_at"),
    }


@router.get("/alumni")
async def list_alumni():
    items = []
    async for doc in db.alumni.find({"active": {"$ne": False}}).sort([("is_featured", -1), ("created_at", -1)]):
        items.append(serialize_alumni(doc))
    return items


@router.get("/alumni/{alumni_id}")
async def get_alumni(alumni_id: str):
    doc = await db.alumni.find_one({"_id": _to_object_id(alumni_id, "alumni id")})
    if not doc:
        raise HTTPException(status_code=404, detail="Alumni not found")
    return serialize_alumni(doc)


@router.get("/alumni/admin/all")
async def list_all_alumni(admin=Depends(get_current_admin)):
    items = []
    async for doc in db.alumni.find().sort("created_at", -1):
        items.append(serialize_alumni(doc))
    return items


@router.post("/alumni", status_code=201)
async def create_alumni(
    name: str = Form(...),
    batch_year: str = Form(...),
    current_role: str = Form(...),
    company: str = Form(...),
    location: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    linkedin_url: Optional[str] = Form(None),
    success_story: Optional[str] = Form(None),
    is_featured: bool = Form(False),
    active: bool = Form(True),
    photo: Optional[UploadFile] = File(None),
    admin=Depends(get_current_admin),
):
    photo_url = None
    if photo:
        file_id = await save_uploaded_file(db, photo, category="alumni")
        photo_url = get_file_url(file_id)

    doc = {
        "name": name,
        "batch_year": batch_year,
        "current_role": current_role,
        "company": company,
        "location": location or "",
        "email": email or "",
        "linkedin_url": linkedin_url or "",
        "success_story": success_story or "",
        "photo_url": photo_url,
        "is_featured": _parse_bool(is_featured),
        "active": _parse_bool(active, True),
        "created_at": datetime.utcnow(),
    }
    result = await db.alumni.insert_one(doc)
    return {"id": str(result.inserted_id)}


@router.put("/alumni/{alumni_id}")
async def update_alumni(
    alumni_id: str,
    name: str = Form(...),
    batch_year: str = Form(...),
    current_role: str = Form(...),
    company: str = Form(...),
    location: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    linkedin_url: Optional[str] = Form(None),
    success_story: Optional[str] = Form(None),
    is_featured: bool = Form(False),
    active: bool = Form(True),
    photo: Optional[UploadFile] = File(None),
    admin=Depends(get_current_admin),
):
    oid = _to_object_id(alumni_id, "alumni id")
    doc = {
        "name": name,
        "batch_year": batch_year,
        "current_role": current_role,
        "company": company,
        "location": location or "",
        "email": email or "",
        "linkedin_url": linkedin_url or "",
        "success_story": success_story or "",
        "is_featured": _parse_bool(is_featured),
        "active": _parse_bool(active, True),
    }
    if photo:
        file_id = await save_uploaded_file(db, photo, category="alumni")
        doc["photo_url"] = get_file_url(file_id)

    result = await db.alumni.update_one({"_id": oid}, {"$set": doc})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Alumni not found")
    return {"message": "Updated"}


@router.delete("/alumni/{alumni_id}")
async def delete_alumni(alumni_id: str, admin=Depends(get_current_admin)):
    result = await db.alumni.delete_one({"_id": _to_object_id(alumni_id, "alumni id")})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Alumni not found")
    return {"message": "Deleted"}


@router.get("/alumni-events")
async def list_alumni_events():
    items = []
    async for doc in db.alumni_events.find({"active": {"$ne": False}}).sort("date", -1):
        items.append(serialize_alumni_event(doc))
    return items


@router.get("/alumni-events/{event_id}")
async def get_alumni_event(event_id: str):
    doc = await db.alumni_events.find_one({"_id": _to_object_id(event_id, "event id")})
    if not doc:
        raise HTTPException(status_code=404, detail="Event not found")
    return serialize_alumni_event(doc)


@router.get("/alumni-events/admin/all")
async def list_all_alumni_events(admin=Depends(get_current_admin)):
    items = []
    async for doc in db.alumni_events.find().sort("date", -1):
        items.append(serialize_alumni_event(doc))
    return items


@router.post("/alumni-events", status_code=201)
async def create_alumni_event(
    title: str = Form(...),
    date: str = Form(...),
    location: str = Form(...),
    description: str = Form(...),
    is_featured: bool = Form(False),
    active: bool = Form(True),
    participants_count: int = Form(0),
    images: Optional[List[UploadFile]] = File(None),
    admin=Depends(get_current_admin),
):
    image_urls = []
    for image in images or []:
        file_id = await save_uploaded_file(db, image, category="alumni-events")
        image_urls.append(get_file_url(file_id))

    doc = {
        "title": title,
        "date": date,
        "location": location,
        "description": description,
        "image_urls": image_urls,
        "image_url": image_urls[0] if image_urls else None,
        "is_featured": _parse_bool(is_featured),
        "active": _parse_bool(active, True),
        "participants_count": participants_count or 0,
        "created_at": datetime.utcnow(),
    }
    result = await db.alumni_events.insert_one(doc)
    return {"id": str(result.inserted_id)}


@router.put("/alumni-events/{event_id}")
async def update_alumni_event(
    event_id: str,
    title: str = Form(...),
    date: str = Form(...),
    location: str = Form(...),
    description: str = Form(...),
    is_featured: bool = Form(False),
    active: bool = Form(True),
    participants_count: int = Form(0),
    images: Optional[List[UploadFile]] = File(None),
    admin=Depends(get_current_admin),
):
    oid = _to_object_id(event_id, "event id")
    doc = {
        "title": title,
        "date": date,
        "location": location,
        "description": description,
        "is_featured": _parse_bool(is_featured),
        "active": _parse_bool(active, True),
        "participants_count": participants_count or 0,
    }

    if images:
        image_urls = []
        for image in images:
            file_id = await save_uploaded_file(db, image, category="alumni-events")
            image_urls.append(get_file_url(file_id))
        doc["image_urls"] = image_urls
        doc["image_url"] = image_urls[0] if image_urls else None

    result = await db.alumni_events.update_one({"_id": oid}, {"$set": doc})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"message": "Updated"}


@router.delete("/alumni-events/{event_id}")
async def delete_alumni_event(event_id: str, admin=Depends(get_current_admin)):
    result = await db.alumni_events.delete_one({"_id": _to_object_id(event_id, "event id")})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"message": "Deleted"}


@router.get("/mentors")
async def list_approved_mentors():
    items = []
    async for doc in db.mentors.find({"is_approved": True, "active": {"$ne": False}}).sort([("created_at", -1)]):
        items.append(serialize_mentor(doc))
    return items


@router.get("/mentors/all")
async def list_all_mentors(admin=Depends(get_current_admin)):
    items = []
    async for doc in db.mentors.find().sort("created_at", -1):
        items.append(serialize_mentor(doc))
    return items


@router.get("/mentors/{mentor_id}")
async def get_mentor(mentor_id: str):
    doc = await db.mentors.find_one({"_id": _to_object_id(mentor_id, "mentor id")})
    if not doc:
        raise HTTPException(status_code=404, detail="Mentor not found")
    return serialize_mentor(doc)


@router.post("/mentors", status_code=201)
async def register_mentor(
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    batch_year: str = Form(...),
    company: str = Form(...),
    expertise: str = Form(...),
    experience: int = Form(0),
    availability: int = Form(0),
    bio: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None),
):
    photo_url = None
    if photo:
        file_id = await save_uploaded_file(db, photo, category="mentors")
        photo_url = get_file_url(file_id)

    doc = {
        "name": name,
        "email": email,
        "phone": phone,
        "batch_year": batch_year,
        "company": company,
        "expertise": expertise,
        "experience": int(experience or 0),
        "availability": int(availability or 0),
        "bio": bio or "",
        "photo_url": photo_url,
        "is_approved": False,
        "status": "pending",
        "active": True,
        "created_at": datetime.utcnow(),
    }
    result = await db.mentors.insert_one(doc)
    return {"id": str(result.inserted_id), "message": "Registration submitted"}


@router.put("/mentors/{mentor_id}")
async def update_mentor(
    mentor_id: str,
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    batch_year: str = Form(...),
    company: str = Form(...),
    expertise: str = Form(...),
    experience: int = Form(0),
    availability: int = Form(0),
    bio: Optional[str] = Form(None),
    is_approved: bool = Form(False),
    active: bool = Form(True),
    photo: Optional[UploadFile] = File(None),
    admin=Depends(get_current_admin),
):
    oid = _to_object_id(mentor_id, "mentor id")
    approved = _parse_bool(is_approved)
    doc = {
        "name": name,
        "email": email,
        "phone": phone,
        "batch_year": batch_year,
        "company": company,
        "expertise": expertise,
        "experience": int(experience or 0),
        "availability": int(availability or 0),
        "bio": bio or "",
        "is_approved": approved,
        "status": "approved" if approved else "pending",
        "active": _parse_bool(active, True),
    }
    if photo:
        file_id = await save_uploaded_file(db, photo, category="mentors")
        doc["photo_url"] = get_file_url(file_id)

    result = await db.mentors.update_one({"_id": oid}, {"$set": doc})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Mentor not found")
    return {"message": "Updated"}


@router.put("/mentors/{mentor_id}/approve")
async def approve_mentor(mentor_id: str, admin=Depends(get_current_admin)):
    result = await db.mentors.update_one(
        {"_id": _to_object_id(mentor_id, "mentor id")},
        {"$set": {"is_approved": True, "status": "approved"}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Mentor not found")
    return {"message": "Approved"}


@router.put("/mentors/{mentor_id}/reject")
async def reject_mentor(mentor_id: str, admin=Depends(get_current_admin)):
    result = await db.mentors.update_one(
        {"_id": _to_object_id(mentor_id, "mentor id")},
        {"$set": {"is_approved": False, "status": "rejected"}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Mentor not found")
    return {"message": "Rejected"}


@router.post("/mentorship-requests", status_code=201)
async def create_mentorship_request(
    mentor_id: str = Form(...),
    student_name: str = Form(...),
    student_email: str = Form(...),
    student_phone: str = Form(...),
    request_reason: str = Form(...),
):
    mentor = await db.mentors.find_one({"_id": _to_object_id(mentor_id, "mentor id")})
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor not found")

    doc = {
        "mentor_id": mentor_id,
        "student_name": student_name,
        "student_email": student_email,
        "student_phone": student_phone,
        "request_reason": request_reason,
        "status": "pending",
        "created_at": datetime.utcnow(),
    }
    result = await db.mentorship_requests.insert_one(doc)
    return {"id": str(result.inserted_id), "message": "Request submitted"}


@router.get("/mentorship-requests")
async def list_mentorship_requests(admin=Depends(get_current_admin)):
    items = []
    async for doc in db.mentorship_requests.find().sort("created_at", -1):
        items.append(serialize_request(doc))
    return items


@router.put("/mentorship-requests/{request_id}/status")
async def update_mentorship_request_status(
    request_id: str,
    status: str = Form(...),
    admin=Depends(get_current_admin),
):
    normalized = str(status or "").strip().lower()
    if normalized not in {"pending", "approved", "rejected"}:
        raise HTTPException(status_code=400, detail="Invalid status")

    result = await db.mentorship_requests.update_one(
        {"_id": _to_object_id(request_id, "request id")},
        {"$set": {"status": normalized}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Request not found")
    return {"message": "Updated"}


@router.get("/testimonials")
async def list_testimonials(approved: Optional[bool] = Query(None)):
    filters = {}
    if approved is None:
        filters["is_approved"] = True
    else:
        filters["is_approved"] = bool(approved)

    items = []
    async for doc in db.testimonials.find(filters).sort("created_at", -1):
        items.append(serialize_testimonial(doc))
    return items


@router.get("/testimonials/all")
async def list_all_testimonials(admin=Depends(get_current_admin)):
    items = []
    async for doc in db.testimonials.find().sort("created_at", -1):
        items.append(serialize_testimonial(doc))
    return items


@router.get("/testimonials/{testimonial_id}")
async def get_testimonial(testimonial_id: str):
    doc = await db.testimonials.find_one({"_id": _to_object_id(testimonial_id, "testimonial id")})
    if not doc:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    return serialize_testimonial(doc)


@router.post("/testimonials", status_code=201)
async def create_testimonial(
    name: str = Form(...),
    batch: str = Form(...),
    email: str = Form(...),
    message: str = Form(...),
    photo: Optional[UploadFile] = File(None),
):
    photo_url = None
    if photo:
        file_id = await save_uploaded_file(db, photo, category="testimonials")
        photo_url = get_file_url(file_id)

    doc = {
        "name": name,
        "batch": batch,
        "email": email,
        "message": message,
        "photo_url": photo_url,
        "is_approved": False,
        "status": "pending",
        "created_at": datetime.utcnow(),
    }
    result = await db.testimonials.insert_one(doc)
    return {"id": str(result.inserted_id), "message": "Submitted"}


@router.put("/testimonials/{testimonial_id}")
async def update_testimonial(
    testimonial_id: str,
    name: str = Form(...),
    batch: str = Form(...),
    email: str = Form(...),
    message: str = Form(...),
    is_approved: bool = Form(False),
    photo: Optional[UploadFile] = File(None),
    admin=Depends(get_current_admin),
):
    oid = _to_object_id(testimonial_id, "testimonial id")
    approved = _parse_bool(is_approved)
    doc = {
        "name": name,
        "batch": batch,
        "email": email,
        "message": message,
        "is_approved": approved,
        "status": "approved" if approved else "pending",
    }
    if photo:
        file_id = await save_uploaded_file(db, photo, category="testimonials")
        doc["photo_url"] = get_file_url(file_id)

    result = await db.testimonials.update_one({"_id": oid}, {"$set": doc})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    return {"message": "Updated"}


@router.put("/testimonials/{testimonial_id}/approve")
async def approve_testimonial(testimonial_id: str, admin=Depends(get_current_admin)):
    result = await db.testimonials.update_one(
        {"_id": _to_object_id(testimonial_id, "testimonial id")},
        {"$set": {"is_approved": True, "status": "approved"}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    return {"message": "Approved"}


@router.put("/testimonials/{testimonial_id}/reject")
async def reject_testimonial(testimonial_id: str, admin=Depends(get_current_admin)):
    result = await db.testimonials.update_one(
        {"_id": _to_object_id(testimonial_id, "testimonial id")},
        {"$set": {"is_approved": False, "status": "rejected"}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    return {"message": "Rejected"}


@router.delete("/testimonials/{testimonial_id}")
async def delete_testimonial(testimonial_id: str, admin=Depends(get_current_admin)):
    result = await db.testimonials.delete_one({"_id": _to_object_id(testimonial_id, "testimonial id")})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    return {"message": "Deleted"}


# =====================================================
# ALUMNI GALLERY
# =====================================================

@router.get("/alumni-gallery")
async def get_alumni_gallery():
    cursor = db.alumni_gallery.find({}).sort("created_at", -1)
    gallery = []
    async for item in cursor:
        if "_id" in item:
            item["_id"] = str(item["_id"])
        gallery.append(item)
    return gallery

@router.post("/alumni-gallery")
async def create_alumni_gallery(
    title: str = Form(...),
    caption: str = Form(""),
    active: bool = Form(True),
    image: UploadFile = File(...),
    admin = Depends(get_current_admin)
):
    file_id = await save_uploaded_file(db, image, category="alumni_gallery")
    doc = {
        "title": title,
        "caption": caption,
        "image": get_file_url(file_id),
        "active": active,
        "created_at": datetime.utcnow()
    }
    result = await db.alumni_gallery.insert_one(doc)
    return {"id": str(result.inserted_id), "message": "Gallery item added successfully"}

@router.put("/alumni-gallery/{gallery_id}")
async def update_alumni_gallery(
    gallery_id: str,
    title: str = Form(...),
    caption: str = Form(""),
    active: bool = Form(True),
    image: UploadFile = File(None),
    admin = Depends(get_current_admin)
):
    update_data = {
        "title": title,
        "caption": caption,
        "active": active
    }
    if image:
        file_id = await save_uploaded_file(db, image, category="alumni_gallery")
        update_data["image"] = get_file_url(file_id)
        
    result = await db.alumni_gallery.update_one(
        {"_id": _to_object_id(gallery_id, "gallery_id")},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Gallery item not found")
    return {"message": "Gallery item updated"}

@router.delete("/alumni-gallery/{gallery_id}")
async def delete_alumni_gallery(
    gallery_id: str,
    admin = Depends(get_current_admin)
):
    result = await db.alumni_gallery.delete_one({"_id": _to_object_id(gallery_id, "gallery_id")})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Gallery item not found")
    return {"message": "Gallery item deleted"}
