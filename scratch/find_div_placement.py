with open(r"c:\Users\psbha\Music\EMRS-DORNALA-master\admin-dashboard.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'id="dashboardOverviewManager"' in line:
        print(f"Line {idx+1}: {line.strip()}")
        for i in range(max(0, idx - 5), min(len(lines), idx + 25)):
            print(f"  {i+1}: {lines[i].rstrip()}")
