import re

filepath = r"c:\Users\psbha\Music\EMRS-DORNALA-master\admin-dashboard.html"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# search for token and baseUrl
for line_idx, line in enumerate(content.split('\n')):
    if 'token' in line and ('const' in line or 'let' in line or 'localStorage' in line) and ('=' in line):
        print(f"Line {line_idx+1}: {line.strip()}")
    if 'baseUrl' in line and ('const' in line or 'let' in line) and ('=' in line):
        print(f"Line {line_idx+1}: {line.strip()}")
    if 'admin-login.html' in line:
        print(f"Line {line_idx+1}: {line.strip()}")
