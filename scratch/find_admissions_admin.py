with open(r"c:\Users\psbha\Music\EMRS-DORNALA-master\backend\app\routes\admissions.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "/admin/admissions" in line:
        print(f"Line {idx+1}: {line.strip()}")
        # print 15 lines before and after
        start = max(0, idx - 10)
        end = min(len(lines), idx + 20)
        for i in range(start, end):
            print(f"  {i+1}: {lines[i].rstrip()}")
        print("-" * 50)
