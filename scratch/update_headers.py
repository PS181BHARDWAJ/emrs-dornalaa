import os
import glob
import re

# Search for all HTML files in root directory
html_files = glob.glob("*.html")

# Flexible regex pattern to match the right-side header section with loogo.png
pattern = re.compile(
    r'<div class="col-md-3 emblemb text-center dis_none">\s*<img src="images/loogo.png"[^>]*>.*?Tribal Transformation Through Education</span>\s*</div>',
    re.DOTALL
)

replacement_content = """<div class="col-md-3 emblemb text-center dis_none d-flex align-items-center justify-content-center gap-3">
                            <div>
                                <img src="images/loogo.png" style="height: 70px!important;" alt="EMRS logo">
                                <br>
                                <span class="pt-2 d-block" style="font-size:14px; font-weight:bold; color:#000000; line-height: 1.2;">Tribal Transformation Through Education</span>
                            </div>
                            <div class="header-placeholder-box" style="width: 80px; height: 80px; border: 2px dashed #5a0f61; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: rgba(90,15,97,0.05); flex-shrink: 0;">
                                <span style="font-size: 10px; color: #5a0f61; font-weight: bold; text-align: center; padding: 4px;">Logo Placeholder</span>
                            </div>
                        </div>"""

for filepath in html_files:
    if not os.path.isfile(filepath):
        continue
    # Skip dashboard and admin files
    if "admin" in filepath or "dashboard" in filepath or "login" in filepath:
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    if pattern.search(content):
        new_content = pattern.sub(replacement_content, content)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"SUCCESS: Updated header in: {filepath}")
    else:
        if "Tribal Transformation Through Education" in content:
            print(f"WARNING: Found tagline but regex match failed for: {filepath}")
        else:
            print(f"INFO: No header match needed for: {filepath}")
