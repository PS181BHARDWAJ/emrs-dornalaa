import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load env variables from backend/.env
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend', '.env')
load_dotenv(env_path)

async def check_admins():
    uri = os.getenv("MONGODB_URI")
    db_name = os.getenv("MONGODB_DB", "emrs_dornala")
    print(f"Connecting to: {uri}")
    print(f"Database: {db_name}")
    
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    
    # List collections
    collections = await db.list_collection_names()
    print(f"Collections: {collections}")
    
    if "admins" in collections:
        admins = await db.admins.find().to_list(length=100)
        print(f"Found {len(admins)} admin(s):")
        for admin in admins:
            # Print keys except password hash for security, or check if password hash is empty/etc
            safe_admin = {k: v for k, v in admin.items() if k != "password" and k != "password_history"}
            print(safe_admin)
    else:
        print("admins collection not found!")

if __name__ == "__main__":
    asyncio.run(check_admins())
