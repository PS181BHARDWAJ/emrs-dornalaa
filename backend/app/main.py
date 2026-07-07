
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError

from pathlib import Path
import os
import logging

from pymongo.errors import PyMongoError

load_dotenv()

from .routes import (
    auth,
    content,
    events,
    staff,
    announcements,
    calendar,
    visitors,
    files,
    alumni,
    contact_page,
    results,
    sports,
    hostel,
    campus,
    mess,
    school,
    playground,
    staff_quarters,
    admissions,
    otp,
    settings,
    home_content,
)

logger = logging.getLogger(__name__)

app = FastAPI(
    title="EMRS Dornala CMS",
    version="1.0.0"
)


# =====================================================
# EXCEPTION HANDLERS
# =====================================================

@app.exception_handler(PyMongoError)
async def mongodb_exception_handler(
    request: Request,
    exc: PyMongoError
):
    import traceback
    logger.error(f"Database Exception: {exc}\n{traceback.format_exc()}")
    print(f"Database Exception: {exc}", flush=True)
    traceback.print_exc()
    return JSONResponse(
        status_code=503,
        content={
            "detail":
            "Database service temporarily unavailable."
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
):
    logger.error(
        f"Validation Error: {exc.errors()}"
    )

    return JSONResponse(
        status_code=422,
        content={
            "detail":
            exc.errors()
        }
    )


# =====================================================
# CORS
# =====================================================

def _parse_cors_origins():

    defaults = [

        "http://127.0.0.1:3000",

        "http://127.0.0.1:5173",

        "http://127.0.0.1:5500",

        "http://127.0.0.1:8000",

        "https://emrsdornala.vercel.app",

        "null"
    ]


    raw = os.getenv(

        "CORS_ORIGINS",

        ""

    )


    if not raw:

        return defaults


    origins = [

        origin.strip()

        for origin in raw.split(",")

        if origin.strip()

    ]


    for item in defaults:

        if item not in origins:

            origins.append(item)


    return origins



app.add_middleware(

    CORSMiddleware,

    allow_origins=_parse_cors_origins(),

    allow_origin_regex=r"^https?://([a-z0-9-]+\.)?(vercel\.app|onrender\.com|localhost|127\.0\.0\.1)(:\d+)?$",

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],

)


# Rate-limiting middleware setup
import time
from collections import defaultdict

RATE_LIMIT_DURATION = 60  # seconds
RATE_LIMIT_MAX_REQUESTS = 300  # max requests per minute per IP
ip_request_history = defaultdict(list)

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host if request.client else "unknown"
    current_time = time.time()
    
    # clean old requests
    ip_request_history[client_ip] = [
        t for t in ip_request_history[client_ip]
        if current_time - t < RATE_LIMIT_DURATION
    ]
    
    if len(ip_request_history[client_ip]) >= RATE_LIMIT_MAX_REQUESTS:
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many requests. Please try again later."}
        )
        
    ip_request_history[client_ip].append(current_time)
    response = await call_next(request)
    return response


# =====================================================
# ROUTERS
# =====================================================

app.include_router(

    auth.router,

    prefix="/api/auth",

    tags=["auth"]

)


app.include_router(

    content.router,

    prefix="/api/content",

    tags=["content"]

)


app.include_router(

    events.router,

    prefix="/api/events",

    tags=["events"]

)


app.include_router(

    staff.router,

    prefix="/api/staff",

    tags=["staff"]

)


app.include_router(

    announcements.router,

    prefix="/api/announcements",

    tags=["announcements"]

)


app.include_router(

    calendar.router,

    prefix="/api/calendar",

    tags=["calendar"]

)


app.include_router(

    visitors.router,

    prefix="/api/visitors",

    tags=["visitors"]

)


app.include_router(

    files.router,

    prefix="/api/files",

    tags=["files"]

)



# SPORTS

app.include_router(

    sports.router,

    prefix="/api/facilities",

    tags=["facilities"]

)



# HOSTEL

app.include_router(

    hostel.router,

    prefix="/api/hostel",

    tags=["hostel"]

)



# CAMPUS LIFE

app.include_router(

    campus.router,

    prefix="/api/campus",

    tags=["campus"]

)


# MESS

app.include_router(

    mess.router,

    prefix="/api/mess",

    tags=["mess"]

)


# SCHOOL

app.include_router(

    school.router,

    prefix="/api/school",

    tags=["school"]

)


# PLAYGROUND

app.include_router(

    playground.router,

    prefix="/api/playground",

    tags=["playground"]

)


# STAFF QUARTERS

app.include_router(

    staff_quarters.router,

    prefix="/api/staff_quarters",

    tags=["staff_quarters"]

)


# OTHER MODULES

app.include_router(

    alumni.router,

    prefix="/api",

    tags=["alumni"]

)


app.include_router(

    contact_page.router,

    prefix="/api",

    tags=["contact-page"]

)


app.include_router(

    results.router,

    prefix="/api",

    tags=["results"]

)




app.include_router(

    admissions.router,

    prefix="/api",

    tags=["admissions"]

)


app.include_router(

    otp.router,

    prefix="/api",

    tags=["otp"]

)

app.include_router(

    settings.router,

    prefix="/api/settings",

    tags=["settings"]

)

app.include_router(

    home_content.router,

    prefix="/api/home",

    tags=["home_content"]

)




# =====================================================
# PATHS
# =====================================================

BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent.parent

UPLOADS_DIR = BASE_DIR / "uploads"
WRITEREADDATA_DIR = ROOT_DIR / "WriteReadData"
IMAGES_DIR = ROOT_DIR / "images"
ASSETS_DIR = ROOT_DIR / "assets"



UPLOADS_DIR.mkdir(

    parents=True,

    exist_ok=True

)



@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    favicon_path = ROOT_DIR / "favicon.ico"
    if favicon_path.exists():
        return FileResponse(favicon_path)
    # fallback to logo_emrs.ico inside images
    fallback_path = ROOT_DIR / "images" / "logo_emrs.ico"
    if fallback_path.exists():
        return FileResponse(fallback_path)
    return JSONResponse(status_code=404, content={"detail": "Favicon not found"})


# =====================================================
# STATIC FILES
# =====================================================

app.mount(

    "/uploads",

    StaticFiles(

        directory=str(UPLOADS_DIR)

    ),

    name="uploads"

)



if WRITEREADDATA_DIR.exists():

    app.mount(

        "/WriteReadData",

        StaticFiles(

            directory=str(

                WRITEREADDATA_DIR

            )

        ),

        name="writereaddata"

    )




if IMAGES_DIR.exists():

    app.mount(

        "/images",

        StaticFiles(

            directory=str(IMAGES_DIR)

        ),

        name="images"

    )




if ASSETS_DIR.exists():

    app.mount(

        "/assets",

        StaticFiles(

            directory=str(ASSETS_DIR)

        ),

        name="assets"

    )




# =====================================================
# STARTUP
@app.on_event("startup")
async def startup_event():
    from .config.database import db, create_indexes
    await create_indexes()


    bootstrap_password = os.getenv(

        "ADMIN_BOOTSTRAP_PASSWORD",

        ""

    ).strip()



    if not bootstrap_password:

        return



    admin = await db.admins.find_one(

        {

            "username":

            "admin"

        }

    )



    if not admin:


        from .utils.security import (

            get_password_hash

        )


        await db.admins.insert_one(

            {

                "username":

                "admin",

                "password":

                get_password_hash(

                    bootstrap_password

                ),

                "role":

                "admin"

            }

        )




# =====================================================
# ROOT
# =====================================================

@app.get("/")

async def root():

    return {

        "message":

        "EMRS Dornala API Running Successfully"

    }
