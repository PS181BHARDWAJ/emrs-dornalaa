import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017").strip()

DB_NAME = os.getenv("MONGODB_DB", "emrs_dornala")

allow_invalid_certs = os.getenv("MONGODB_TLS_ALLOW_INVALID_CERTS", "false").strip().lower() == "true"
tls_mode = os.getenv("MONGODB_TLS", "auto").strip().lower()

is_local_uri = "localhost" in MONGODB_URI or "127.0.0.1" in MONGODB_URI
if tls_mode == "true":
    use_tls = True
elif tls_mode == "false":
    use_tls = False
else:
    use_tls = not is_local_uri

client_kwargs = {
    "serverSelectionTimeoutMS": 60000,
    "connectTimeoutMS": 60000,
    "socketTimeoutMS": 60000,
}

if use_tls:
    client_kwargs["tls"] = True
    client_kwargs["tlsAllowInvalidCertificates"] = allow_invalid_certs

client = AsyncIOMotorClient(MONGODB_URI, **client_kwargs)

db = client[DB_NAME]


async def create_indexes():
    # Setup background indexes for optimized query performance
    try:
        await db.admissions.create_index([("email", 1)], unique=True, background=True)
        await db.events.create_index([("date", -1)], background=True)
        await db.alumni.create_index([("graduation_year", -1)], background=True)
    except Exception as e:
        print(f"Error creating indexes: {e}")

