from datetime import datetime
from bson import ObjectId
from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile
)

from ..config.database import db
from ..routes.auth import get_current_admin
from ..utils.storage import (
    save_uploaded_file,
    get_file_url
)

router = APIRouter()

# =====================================================
# SERIALIZERS
# =====================================================

def serialize_funfact(item):
    return {
        "id": str(item["_id"]),
        "value": item.get("value"),
        "label": item.get("label"),
        "display_order": item.get("display_order", 0),
        "active": item.get("active", True)
    }

def serialize_gallery(item):
    return {
        "id": str(item["_id"]),
        "title": item.get("title"),
        "media_type": item.get("media_type", "image"),
        "image": item.get("image"),
        "youtube_url": item.get("youtube_url"),
        "display_order": item.get("display_order", 0),
        "active": item.get("active", True)
    }

# =====================================================
# FUN FACTS ENDPOINTS
# =====================================================

@router.get("/funfacts")
async def get_funfacts():
    items = []
    async for item in db.home_funfacts.find().sort("display_order", 1):
        items.append(serialize_funfact(item))
    return items

@router.post("/funfacts")
async def create_funfact(
    value: str = Form(...),
    label: str = Form(...),
    display_order: int = Form(0),
    active: bool = Form(True),
    admin=Depends(get_current_admin)
):
    doc = {
        "value": value,
        "label": label,
        "display_order": display_order,
        "active": active,
        "created_at": datetime.utcnow()
    }
    result = await db.home_funfacts.insert_one(doc)
    return {"id": str(result.inserted_id)}

@router.put("/funfacts/{fact_id}")
async def update_funfact(
    fact_id: str,
    value: str = Form(...),
    label: str = Form(...),
    display_order: int = Form(0),
    active: bool = Form(True),
    admin=Depends(get_current_admin)
):
    if not ObjectId.is_valid(fact_id):
        raise HTTPException(400, "Invalid ID")
    
    update_data = {
        "value": value,
        "label": label,
        "display_order": display_order,
        "active": active
    }
    
    await db.home_funfacts.update_one(
        {"_id": ObjectId(fact_id)},
        {"$set": update_data}
    )
    return {"message": "Updated"}

@router.delete("/funfacts/{fact_id}")
async def delete_funfact(
    fact_id: str,
    admin=Depends(get_current_admin)
):
    if not ObjectId.is_valid(fact_id):
        raise HTTPException(400, "Invalid ID")
        
    await db.home_funfacts.delete_one({"_id": ObjectId(fact_id)})
    return {"message": "Deleted"}

# =====================================================
# GALLERY ENDPOINTS
# =====================================================

@router.get("/gallery")
async def get_gallery():
    items = []
    async for item in db.home_gallery.find().sort("display_order", 1):
        items.append(serialize_gallery(item))
    return items

@router.post("/gallery")
async def create_gallery(
    title: str = Form(...),
    media_type: str = Form("image"), # "image" or "youtube"
    youtube_url: str = Form(None),
    display_order: int = Form(0),
    active: bool = Form(True),
    image: UploadFile | None = File(None),
    admin=Depends(get_current_admin)
):
    image_url = None
    if media_type == "image" and image:
        file_id = await save_uploaded_file(
            db,
            image,
            category="home_gallery"
        )
        image_url = get_file_url(file_id)

    doc = {
        "title": title,
        "media_type": media_type,
        "image": image_url,
        "youtube_url": youtube_url,
        "display_order": display_order,
        "active": active,
        "created_at": datetime.utcnow()
    }
    result = await db.home_gallery.insert_one(doc)
    return {"id": str(result.inserted_id)}

@router.put("/gallery/{gallery_id}")
async def update_gallery(
    gallery_id: str,
    title: str = Form(...),
    media_type: str = Form("image"),
    youtube_url: str = Form(None),
    display_order: int = Form(0),
    active: bool = Form(True),
    image: UploadFile | None = File(None),
    admin=Depends(get_current_admin)
):
    if not ObjectId.is_valid(gallery_id):
        raise HTTPException(400, "Invalid ID")

    # Get original doc to preserve image if not uploaded again
    existing = await db.home_gallery.find_one({"_id": ObjectId(gallery_id)})
    if not existing:
        raise HTTPException(404, "Not Found")
        
    image_url = existing.get("image")

    if media_type == "image":
        if image:
            file_id = await save_uploaded_file(
                db,
                image,
                category="home_gallery"
            )
            image_url = get_file_url(file_id)
        # Preserve youtube_url as null
        youtube_url = None
    else:
        # For youtube, set image to null
        image_url = None

    update_data = {
        "title": title,
        "media_type": media_type,
        "image": image_url,
        "youtube_url": youtube_url,
        "display_order": display_order,
        "active": active
    }

    await db.home_gallery.update_one(
        {"_id": ObjectId(gallery_id)},
        {"$set": update_data}
    )
    return {"message": "Updated"}

@router.delete("/gallery/{gallery_id}")
async def delete_gallery(
    gallery_id: str,
    admin=Depends(get_current_admin)
):
    if not ObjectId.is_valid(gallery_id):
        raise HTTPException(400, "Invalid ID")

    await db.home_gallery.delete_one({"_id": ObjectId(gallery_id)})
    return {"message": "Deleted"}


# =====================================================
# POSITIONS ENDPOINTS
# =====================================================

def serialize_position(item):
    return {
        "id": str(item["_id"]),
        "name": item.get("name"),
        "position": item.get("position"),
        "image": item.get("image"),
        "display_order": item.get("display_order", 0),
        "active": item.get("active", True)
    }

@router.get("/positions")
async def get_positions():
    items = []
    async for item in db.home_positions.find().sort("display_order", 1):
        items.append(serialize_position(item))
    return items

@router.post("/positions")
async def create_position(
    name: str = Form(...),
    position: str = Form(...),
    display_order: int = Form(0),
    active: bool = Form(True),
    image: UploadFile | None = File(None),
    admin=Depends(get_current_admin)
):
    image_url = None
    if image:
        file_id = await save_uploaded_file(
            db,
            image,
            category="home_gallery"
        )
        image_url = get_file_url(file_id)

    doc = {
        "name": name,
        "position": position,
        "image": image_url,
        "display_order": display_order,
        "active": active,
        "created_at": datetime.utcnow()
    }
    result = await db.home_positions.insert_one(doc)
    return {"id": str(result.inserted_id)}

@router.put("/positions/{pos_id}")
async def update_position(
    pos_id: str,
    name: str = Form(...),
    position: str = Form(...),
    display_order: int = Form(0),
    active: bool = Form(True),
    image: UploadFile | None = File(None),
    admin=Depends(get_current_admin)
):
    if not ObjectId.is_valid(pos_id):
        raise HTTPException(400, "Invalid ID")

    existing = await db.home_positions.find_one({"_id": ObjectId(pos_id)})
    if not existing:
        raise HTTPException(404, "Not Found")

    image_url = existing.get("image")
    if image:
        file_id = await save_uploaded_file(
            db,
            image,
            category="home_gallery"
        )
        image_url = get_file_url(file_id)

    update_data = {
        "name": name,
        "position": position,
        "image": image_url,
        "display_order": display_order,
        "active": active
    }

    await db.home_positions.update_one(
        {"_id": ObjectId(pos_id)},
        {"$set": update_data}
    )
    return {"message": "Updated"}

@router.delete("/positions/{pos_id}")
async def delete_position(
    pos_id: str,
    admin=Depends(get_current_admin)
):
    if not ObjectId.is_valid(pos_id):
        raise HTTPException(400, "Invalid ID")

    await db.home_positions.delete_one({"_id": ObjectId(pos_id)})
    return {"message": "Deleted"}

