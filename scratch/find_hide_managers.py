with open(r"c:\Users\psbha\Music\EMRS-DORNALA-master\admin-dashboard.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "function hideAllManagers" in line:
        print(f"Line {idx+1}: {line.strip()}")
        for i in range(idx, idx + 40):
            print(f"  {i+1}: {lines[i].rstrip()}")
