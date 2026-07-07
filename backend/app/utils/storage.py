"""
MongoDB file storage for persistent uploads.
Uses a simple collection-based approach compatible with Motor (async).
Prevents data loss from ephemeral filesystems.
"""

import uuid
from datetime import datetime
import os
from fastapi import UploadFile
from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId


MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

ALLOWED_CONTENT_TYPES_BY_CATEGORY = {
    "events": {"image/jpeg", "image/png", "image/webp", "application/pdf"},
    "announcements": {"image/jpeg", "image/png", "image/webp", "application/pdf"},
    "staff": {"image/jpeg", "image/png", "image/webp"},
    "alumni": {"image/jpeg", "image/png", "image/webp"},
    "alumni-events": {"image/jpeg", "image/png", "image/webp"},
    "mentors": {"image/jpeg", "image/png", "image/webp"},
    "testimonials": {"image/jpeg", "image/png", "image/webp"},
    "campus_hero": {"image/jpeg", "image/png", "image/webp"},
    "campus_gallery": {"image/jpeg", "image/png", "image/webp"},
    "home_gallery": {"image/jpeg", "image/png", "image/webp"},
    "hostel_notices": {"application/pdf", "image/jpeg", "image/png", "image/webp"},
    "hostel_gallery": {"image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"},
    "mess_hero": {"image/jpeg", "image/png", "image/webp"},
    "mess_gallery": {"image/jpeg", "image/png", "image/webp"},
    "school_hero": {"image/jpeg", "image/png", "image/webp"},
    "school_gallery": {"image/jpeg", "image/png", "image/webp"},
    "playground_hero": {"image/jpeg", "image/png", "image/webp"},
    "playground_gallery": {"image/jpeg", "image/png", "image/webp"},
    "staff_quarters_hero": {"image/jpeg", "image/png", "image/webp"},
    "staff_quarters_gallery": {"image/jpeg", "image/png", "image/webp"},
    "sports_events": {"image/jpeg", "image/png", "image/webp"},
    "sports_achievements": {"image/jpeg", "image/png", "image/webp"},
    "results": {"application/pdf", "image/jpeg", "image/png", "image/webp"},
    "uploads": {"image/jpeg", "image/png", "image/webp", "application/pdf"},
}


def _validate_upload(file: UploadFile, content: bytes, category: str) -> None:
    content_type = (file.content_type or "").lower().strip()
    allowed = ALLOWED_CONTENT_TYPES_BY_CATEGORY.get(category, ALLOWED_CONTENT_TYPES_BY_CATEGORY["uploads"])

    if content_type not in allowed:
        raise HTTPException(status_code=400, detail="Unsupported file type for this upload category")

    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    if len(content) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 10MB")

    filename = (file.filename or "").strip()
    if not filename:
        raise HTTPException(status_code=400, detail="Filename is required")
    if os.path.basename(filename) != filename:
        raise HTTPException(status_code=400, detail="Invalid filename")


async def save_uploaded_file(db: AsyncIOMotorDatabase, file: UploadFile, category: str = "uploads") -> str:
    """
    Save uploaded file to MongoDB.
    Returns the file_id that can be used to retrieve the file later.
    """
    try:
        # Read file content
        content = await file.read()

        _validate_upload(file, content, category)
        
        # Create file document
        file_doc = {
            "filename": file.filename,
            "content_type": file.content_type or "application/octet-stream",
            "category": category,
            "size": len(content),
            "data": content,  # Binary data stored in MongoDB
            "uploaded_at": datetime.utcnow(),
        }
        
        # Insert into files collection
        result = await db.files.insert_one(file_doc)
        return str(result.inserted_id)
    except HTTPException:
        raise
    except Exception as e:
        raise Exception(f"Failed to save file: {str(e)}")


async def get_file(db: AsyncIOMotorDatabase, file_id: str) -> dict:
    """
    Retrieve file from MongoDB.
    Returns dict with 'content' (bytes) and 'metadata'.
    """
    try:
        from bson import ObjectId
        
        # Convert string to ObjectId if needed
        try:
            oid = ObjectId(file_id)
        except:
            oid = file_id
        
        file_doc = await db.files.find_one({"_id": oid})
        if not file_doc:
            raise Exception("File not found")
        
        return {
            "content": file_doc.get("data"),
            "metadata": {
                "filename": file_doc.get("filename"),
                "content_type": file_doc.get("content_type"),
                "category": file_doc.get("category"),
                "size": file_doc.get("size"),
                "uploaded_at": file_doc.get("uploaded_at"),
            },
            "filename": file_doc.get("filename"),
        }
    except Exception as e:
        raise Exception(f"File not found: {str(e)}")


async def delete_file(db: AsyncIOMotorDatabase, file_id: str) -> bool:
    """Delete a file from MongoDB."""
    try:
        from bson import ObjectId
        
        try:
            oid = ObjectId(file_id)
        except:
            oid = file_id
        
        result = await db.files.delete_one({"_id": oid})
        return result.deleted_count > 0
    except Exception as e:
        raise Exception(f"Failed to delete file: {str(e)}")


def get_file_url(file_id: str) -> str:
    """Generate the URL to retrieve a file from the API."""
    return f"/api/files/{file_id}"
