import re

filepath = r"c:\Users\psbha\Music\EMRS-DORNALA-master\admin-dashboard.html"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# find all async function load... or function load...
matches = re.finditer(r'(async\s+)?function\s+load[A-Za-z0-9_]*\s*\(', content)
for m in matches:
    start_pos = m.start()
    # print about 200 chars from start_pos
    print(content[start_pos:start_pos+150].replace('\n', ' '))
