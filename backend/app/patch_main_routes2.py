from pathlib import Path

path = Path('backend/app/main.py')
text = path.read_text(encoding='utf-8')
search = 'app.include_router(campus.router, prefix="/api/campus", tags=["campus"])\n\napp.include_router(alumni.router, prefix="/api", tags=["alumni"])'
insert = 'app.include_router(campus.router, prefix="/api/campus", tags=["campus"])\napp.include_router(mess.router, prefix="/api/mess", tags=["mess"])\napp.include_router(school.router, prefix="/api/school", tags=["school"])\napp.include_router(playground.router, prefix="/api/playground", tags=["playground"])\napp.include_router(staff_quarters.router, prefix="/api/staff_quarters", tags=["staff_quarters"])\n\napp.include_router(alumni.router, prefix="/api", tags=["alumni"])'
if search not in text:
    raise SystemExit('expected router block not found')
text = text.replace(search, insert, 1)
path.write_text(text, encoding='utf-8')
print('applied router patch')
