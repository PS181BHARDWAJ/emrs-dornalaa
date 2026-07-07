import re

with open(r"c:\Users\psbha\Music\EMRS-DORNALA-master\backend\app\routes\admissions.py", "r", encoding="utf-8") as f:
    content = f.read()

matches = re.finditer(r'@router\.(get|post|put|delete|patch)\("([^"]+)"', content)
for m in matches:
    print(f"HTTP {m.group(1).upper()} {m.group(2)}")
