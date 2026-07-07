from pathlib import Path

path = Path("backend/app/main.py")
text = path.read_text(encoding="utf-8")
import_block = """from .routes import (
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
)
"""
new_import_block = """from .routes import (
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
)
"""
if import_block not in text:
    raise SystemExit("Import block not found in main.py")
text = text.replace(import_block, new_import_block, 1)
router_block = """app.include_router(calendar.router, prefix=\"/api/calendar\", tags=[\"calendar\"])
app.include_router(visitors.router, prefix=\"/api/visitors\", tags=[\"visitors\"])
app.include_router(files.router, prefix=\"/api/files\", tags=[\"files\"])
app.include_router(sports.router, prefix=\"/api/facilities\", tags=[\"facilities\"])
app.include_router(hostel.router, prefix=\"/api/hostel\", tags=[\"hostel\"])
app.include_router(campus.router, prefix=\"/api/campus\", tags=[\"campus\"])
"""
new_router_block = """app.include_router(calendar.router, prefix=\"/api/calendar\", tags=[\"calendar\"])
app.include_router(visitors.router, prefix=\"/api/visitors\", tags=[\"visitors\"])
app.include_router(files.router, prefix=\"/api/files\", tags=[\"files\"])
app.include_router(sports.router, prefix=\"/api/facilities\", tags=[\"facilities\"])
app.include_router(hostel.router, prefix=\"/api/hostel\", tags=[\"hostel\"])
app.include_router(campus.router, prefix=\"/api/campus\", tags=[\"campus\"])
app.include_router(mess.router, prefix=\"/api/mess\", tags=[\"mess\"])
app.include_router(school.router, prefix=\"/api/school\", tags=[\"school\"])
app.include_router(playground.router, prefix=\"/api/playground\", tags=[\"playground\"])
app.include_router(staff_quarters.router, prefix=\"/api/staff_quarters\", tags=[\"staff_quarters\"])
"""
if router_block not in text:
    raise SystemExit("Router block not found in main.py")
text = text.replace(router_block, new_router_block, 1)
path.write_text(text, encoding="utf-8")
print("main.py patched")
