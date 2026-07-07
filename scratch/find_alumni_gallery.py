with open(r"c:\Users\psbha\Music\EMRS-DORNALA-master\admin-dashboard.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "alumniGallery" in line or "loadAlumniGallery" in line or "AlumniGallery" in line:
        print(f"Line {idx+1}: {line.strip()}")
