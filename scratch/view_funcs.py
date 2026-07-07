import re

filepath = r"c:\Users\psbha\Music\EMRS-DORNALA-master\admin-dashboard.html"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

def print_function(func_name):
    print(f"=== FUNCTION {func_name} ===")
    pattern = r'(async\s+)?function\s+' + re.escape(func_name) + r'\b'
    m = re.search(pattern, content)
    if not m:
        print("Not found")
        return
    start = m.start()
    # Find matching closing bracket for function body
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
                return
        idx += 1
    print(content[start:start+1000] + "\n... UNCLOSED ...")

print_function("loadDashboardOverviewManager")
print_function("loadAdmissionsAnalytics")
print_function("loadAlumniGalleryManager")
