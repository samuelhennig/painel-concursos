import re

with open('/Users/samuelhennig/.gemini/antigravity/scratch/painel-concursos/app.js', 'r', encoding='utf-8') as f:
    app_text = f.read()

with open('/Users/samuelhennig/.gemini/antigravity/scratch/painel-concursos/index.html', 'r', encoding='utf-8') as f:
    html_text = f.read()

classes = set(re.findall(r'class=[\"\']([^\"\']+)[\"\']', app_text + html_text))
all_classes = set()
for c in classes:
    for part in c.split():
        part = part.strip()
        if part and not part.startswith('$') and not part.endswith('}'):
            all_classes.add(part)

print(f'Total unique CSS classes used: {len(all_classes)}')
print('Classes list:', sorted(list(all_classes)))
