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

from fastapi import APIRouter

router = APIRouter()


# =====================================================
# SERIALIZERS
# =====================================================

def serialize_hero(data):

    return {

        "title": data.get("title"),

        "subtitle": data.get("subtitle"),

        "banner_image": data.get("banner_image"),

        "overlay_opacity": data.get("overlay_opacity", 0.35)

    }



def serialize_stats(data):

    return {

        "students": data.get("students", 0),

        "security": data.get("security", 0),

        "residential": data.get("residential", 0),

        "sports": data.get("sports", 0)

    }



def serialize_gallery(item):

    return {

        "id": str(item["_id"]),

        "title": item.get("title"),

        "caption": item.get("caption"),

        "image": item.get("image"),

        "featured": item.get("featured", False),

        "display_order": item.get("display_order", 0),

        "active": item.get("active", True)

    }


# =====================================================
# HERO SECTION
# =====================================================

@router.get("/hero")

async def get_hero():

    hero = await db.campus_hero.find_one()

    if not hero:

        return {

            "title":

            "Experience Life Beyond The Classroom",

            "subtitle":

            "EMRS Dornala provides a vibrant residential environment.",

            "banner_image": None,

            "overlay_opacity": 0.35

        }

    return serialize_hero(hero)



@router.put("/hero")

async def update_hero(

    title: str = Form(...),

    subtitle: str = Form(...),

    overlay_opacity: float = Form(0.35),

    banner: UploadFile | None = File(None),

    admin=Depends(get_current_admin)

):

    update_data = {

        "title": title,

        "subtitle": subtitle,

        "overlay_opacity": overlay_opacity

    }


    if banner:

        file_id = await save_uploaded_file(

            db,

            banner,

            category="campus_hero"

        )

        update_data["banner_image"] = get_file_url(file_id)


    await db.campus_hero.update_one(

        {},

        {"$set": update_data},

        upsert=True

    )


    return {

        "message": "Hero Updated"

    }



# =====================================================
# STATS
# =====================================================


@router.get("/stats")

async def get_stats():

    stats = await db.campus_stats.find_one()

    if not stats:

        return {

            "students": 500,

            "security": 24,

            "residential": 100,

            "sports": 10

        }


    return serialize_stats(stats)




@router.put("/stats")

async def update_stats(

    students: int = Form(...),

    security: int = Form(...),

    residential: int = Form(...),

    sports: int = Form(...),

    admin=Depends(get_current_admin)

):


    await db.campus_stats.update_one(

        {},

        {

            "$set": {

                "students": students,

                "security": security,

                "residential": residential,

                "sports": sports

            }

        },

        upsert=True

    )


    return {

        "message":

        "Stats Updated"

    }



# =====================================================
# GALLERY
# =====================================================


@router.get("/gallery")

async def get_gallery():

    items=[]

    async for item in db.campus_gallery.find(

        {"active":True}

    ).sort(

        "display_order",1

    ):

        items.append(

            serialize_gallery(item)

        )


    return items


@router.get("/gallery/{gallery_id}")
async def get_gallery_item(gallery_id: str):
    if not ObjectId.is_valid(gallery_id):
        raise HTTPException(status_code=400, detail="Invalid gallery id")
    item = await db.campus_gallery.find_one({"_id": ObjectId(gallery_id)})
    if not item:
        raise HTTPException(status_code=404, detail="Gallery item not found")
    return serialize_gallery(item)


@router.post("/gallery")

async def create_gallery(

    title:str=Form(...),

    caption:str=Form(""),

    featured:bool=Form(False),

    display_order:int=Form(0),

    active:bool=Form(True),

    image:UploadFile=File(...),

    admin=Depends(get_current_admin)

):


    file_id=await save_uploaded_file(

        db,

        image,

        category="campus_gallery"

    )


    doc={

        "title":title,

        "caption":caption,

        "image":get_file_url(file_id),

        "featured":featured,

        "display_order":display_order,

        "active":active,

        "created_at":datetime.utcnow()

    }


    result=await db.campus_gallery.insert_one(doc)


    return {

        "id":

        str(result.inserted_id)

    }




@router.put("/gallery/{gallery_id}")

async def update_gallery(

    gallery_id:str,

    title:str=Form(...),

    caption:str=Form(""),

    featured:bool=Form(False),

    display_order:int=Form(0),

    active:bool=Form(True),

    image:UploadFile|None=File(None),

    admin=Depends(get_current_admin)

):


    if not ObjectId.is_valid(gallery_id):

        raise HTTPException(

            400,

            "Invalid ID"

        )


    update_data={

        "title":title,

        "caption":caption,

        "featured":featured,

        "display_order":display_order,

        "active":active

    }


    if image:

        file_id=await save_uploaded_file(

            db,

            image,

            category="campus_gallery"

        )

        update_data["image"]=get_file_url(file_id)



    await db.campus_gallery.update_one(

        {

            "_id":

            ObjectId(gallery_id)

        },

        {

            "$set":

            update_data

        }

    )


    return {

        "message":

        "Updated"

    }



@router.delete("/gallery/{gallery_id}")

async def delete_gallery(

    gallery_id:str,

    admin=Depends(get_current_admin)

):


    await db.campus_gallery.delete_one(

        {

            "_id":

            ObjectId(gallery_id)

        }

    )


    return {

        "message":

        "Deleted"

    }