import os
import re

matches = {}
for root, dirs, files in os.walk('.'):
    # skip build and vendor dirs
    if any(p in root for p in ['.next', 'node_modules', '.git', '.gemini', 'browser_sandbox', 'browser_evidence']):
        continue
    for f in files:
        if f.endswith(('.ts', '.tsx', '.js', '.jsx', '.json')):
            path = os.path.join(root, f)
            try:
                with open(path, 'r', encoding='utf-8') as file:
                    content = file.read()
                    found = re.findall(r'https?://[^\s\"\'\`]+unsplash[^\s\"\'\`]+', content)
                    if found:
                        matches[path] = len(found)
            except Exception as e:
                pass

print(f"Total files with unsplash images: {len(matches)}")
for k, v in sorted(matches.items(), key=lambda x: -x[1]):
    print(f"  {v} in {k}")
