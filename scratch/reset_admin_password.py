import asyncio
import os
import sys

# Ensure the backend directory is in python path
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend'))

from dotenv import load_dotenv
# Load env variables from backend/.env
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend', '.env')
load_dotenv(env_path)

from app.config.database import db
from app.utils.security import get_password_hash

async def reset_password():
    new_password = "Admin@123"
    hashed_password = get_password_hash(new_password)
    
    # Update the admin user
    result = await db.admins.update_one(
        {"username": "admin"},
        {
            "$set": {
                "password": hashed_password,
                "failed_attempts": 0,
                "lockout_until": None
            }
        }
    )
    
    if result.matched_count > 0:
        print(f"SUCCESS: Admin password reset successfully to: {new_password}")
    else:
        # Create a new admin user if not exists
        await db.admins.insert_one({
            "username": "admin",
            "password": hashed_password,
            "role": "admin",
            "failed_attempts": 0,
            "lockout_until": None
        })
        print(f"SUCCESS: Created new admin user with username: admin and password: {new_password}")

if __name__ == "__main__":
    asyncio.run(reset_password())
