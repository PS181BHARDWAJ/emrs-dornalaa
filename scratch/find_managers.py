with open(r"c:\Users\psbha\Music\EMRS-DORNALA-master\admin-dashboard.html", "r", encoding="utf-8") as f:
    content = f.read()

import re
matches = re.finditer(r'id="[a-zA-Z0-9_]*Manager"', content)
for m in matches:
    print(m.group(0))
