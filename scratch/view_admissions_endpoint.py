with open(r"c:\Users\psbha\Music\EMRS-DORNALA-master\backend\app\routes\admissions.py", "r", encoding="utf-8") as f:
    content = f.read()

import re
m = re.search(r'@router\.get\("/admin/admissions"\)', content)
if m:
    start = m.start()
    def_m = re.search(r'async\s+def\s+[a-zA-Z0-9_]*\s*\(', content[start:])
    if def_m:
        def_start = start + def_m.start()
        print(content[def_start:def_start+2000])
