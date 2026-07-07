with open(r"c:\Users\psbha\Music\EMRS-DORNALA-master\admin-dashboard.html", "r", encoding="utf-8") as f:
    content = f.read()

import re
m = re.search(r'async\s+function\s+fetchAdmissionsData\b', content)
if m:
    start = m.start()
    open_brackets = 0
    started = False
    idx = start
    while idx < len(content):
        char = content[idx]
        if char == '{':
            open_brackets += 1
            started = True
        elif char == '}':
            open_brackets -= 1
            if started and open_brackets == 0:
                print(content[start:idx+1])
                break
        idx += 1
