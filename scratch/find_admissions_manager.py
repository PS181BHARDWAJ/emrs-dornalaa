with open(r"c:\Users\psbha\Music\EMRS-DORNALA-master\admin-dashboard.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "admissionsManager" in line and ("const" in line or "let" in line or "var" in line):
        print(f"Line {idx+1}: {line.strip()}")
