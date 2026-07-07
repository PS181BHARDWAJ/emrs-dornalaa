import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

async def seed():
    load_dotenv()
    uri = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017").strip()
    db_name = os.getenv("MONGODB_DB", "emrs_dornala")
    
    print(f"Connecting to MongoDB URI: {uri[:30]}...")
    client = AsyncIOMotorClient(uri)
    db = client[db_name]

    print("Seeding home_funfacts...")
    # Clear existing
    await db.home_funfacts.delete_many({})
    
    funfacts = [
        {"value": "500", "label": "Students", "display_order": 1, "active": True},
        {"value": "45", "label": "Teachers", "display_order": 2, "active": True},
        {"value": "2010", "label": "Established Year", "display_order": 3, "active": True}
    ]
    await db.home_funfacts.insert_many(funfacts)
    print("Seeded home_funfacts successfully.")

    print("Seeding home_gallery...")
    # Clear existing
    await db.home_gallery.delete_many({})

    gallery_items = [
        {"title": "Flag Hoisting", "media_type": "image", "image": "WriteReadData/MD32145/flag hosting.jpg", "display_order": 1, "active": True},
        {"title": "Events", "media_type": "image", "image": "WriteReadData/MD32145/events.jpg", "display_order": 2, "active": True},
        {"title": "Cultural Event", "media_type": "image", "image": "WriteReadData/MD32145/cultural.jpg", "display_order": 3, "active": True},
        {"title": "Achievement", "media_type": "image", "image": "WriteReadData/MD32145/acheivement 1.jpg", "display_order": 4, "active": True},
        {"title": "Sports", "media_type": "image", "image": "WriteReadData/MD32145/sports.jpg", "display_order": 5, "active": True},
        {"title": "Plantation", "media_type": "image", "image": "WriteReadData/MD32145/Plantation.jpg", "display_order": 6, "active": True},
        {"title": "Yoga Event", "media_type": "image", "image": "WriteReadData/MD32145/yoga event.jpg", "display_order": 7, "active": True},
        {"title": "Cultural Dance", "media_type": "image", "image": "WriteReadData/MD32145/cultural dance.jpg", "display_order": 8, "active": True},
        {"title": "NESTS Progress Video", "media_type": "youtube", "youtube_url": "https://www.youtube.com/embed/h6cS6GWVRPw?", "display_order": 9, "active": True}
    ]
    await db.home_gallery.insert_many(gallery_items)
    print("Seeded home_gallery successfully.")

    print("Seeding home_positions...")
    await db.home_positions.delete_many({})
    positions = [
        {"name": "Shri Ishwar Singh", "position": "Principal", "image": "WriteReadData/IC1425/principal.jpeg", "display_order": 1, "active": True},
        {"name": "Shri Durga Das Uikey", "position": "Honble Minister of State", "image": "WriteReadData/IC1425/1718104075.jpg", "display_order": 2, "active": True}
    ]
    await db.home_positions.insert_many(positions)
    print("Seeded home_positions successfully.")

if __name__ == "__main__":
    asyncio.run(seed())
