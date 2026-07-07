from pathlib import Path
path = Path('backend/app/main.py')
text = path.read_text(encoding='utf-8')
for i, line in enumerate(text.splitlines(), start=1):
    if i <= 40 or 100 <= i <= 140:
        print(f'{i:03}: {line!r}')
print('contains mess import', 'mess,' in text)
print('contains prefix /api/mess', '/api/mess' in text)
