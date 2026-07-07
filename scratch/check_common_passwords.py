import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend', '.env')
load_dotenv(env_path)

# List of common passwords to try
candidates = [
    "admin",
    "admin123",
    "Admin123",
    "admin@123",
    "Admin@123",
    "password",
    "password123",
    "Password123",
    "Password@123",
    "emrs_dornala",
    "dornala",
    "emrs",
    "EMRS@123",
    "emrs@123",
    "dornala@123",
    "Dornala@123",
    "LocalDevSecretKey_2026!"
]

async def check_password():
    uri = os.getenv("MONGODB_URI")
    db_name = os.getenv("MONGODB_DB", "emrs_dornala")
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    
    admin = await db.admins.find_one({"username": "admin"})
    if not admin:
        print("Admin user not found!")
        return
        
    hashed_password = admin.get("password")
    if not hashed_password:
        print("Admin user has no password field!")
        return
        
    print(f"Admin username: {admin.get('username')}")
    print(f"Hashed password: {hashed_password}")
    
    found = False
    for candidate in candidates:
        try:
            if verify_password(candidate, hashed_password):
                print(f"SUCCESS: The password is: {candidate}")
                found = True
                break
        except Exception as e:
            print(f"Error checking {candidate}: {e}")
            
    if not found:
        print("Did not match any of the common candidate passwords.")

if __name__ == "__main__":
    asyncio.run(check_password())
