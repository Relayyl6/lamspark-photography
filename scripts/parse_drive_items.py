import urllib.request
import re
import json

fid = "1Pzeiaal5sCKrWUfF5o1EbDlPrBw16L7Z"
url = f"https://drive.google.com/drive/folders/{fid}"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"})
with urllib.request.urlopen(req, timeout=15) as resp:
    html = resp.read().decode('utf-8', errors='ignore')

# In Google Drive folder pages, file objects are serialized inside window['_DRIVE_BOOTSTRAP_DATA'] or JSON arrays
# Let's search for patterns like [\"FILE_ID\",\"FILENAME\"
# e.g. [\"1...\", \"LSP_...jpg\"
matches = re.findall(r'\[\"([a-zA-Z0-9_-]{25,45})\",\[\"(.*?\.jpe?g|.*?\.png)\"', html, re.IGNORECASE)
print(f"Pattern 1 matches: {len(matches)}")
for m in matches[:10]:
    print(m)

# Or search for: \"(1[a-zA-Z0-9_-]{28,35})\" followed nearby by .jpg
matches2 = re.findall(r'\"([a-zA-Z0-9_-]{28,35})\".{1,100}?([\w\-]+\.(?:jpe?g|png))', html, re.IGNORECASE)
print(f"Pattern 2 matches: {len(matches2)}")
for m in matches2[:10]:
    print(m)
