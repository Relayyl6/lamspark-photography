import urllib.request
import re

url = "https://drive.google.com/drive/folders/1DfQPXjFBILM-LcXe6es8VLtEd8-aZMDv"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
try:
    with urllib.request.urlopen(req, timeout=15) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
        title = "Unknown"
        m = re.search(r'<title>([^<]+)</title>', html)
        if m:
            title = m.group(1).replace(" - Google Drive", "")
        
        fid = "1DfQPXjFBILM-LcXe6es8VLtEd8-aZMDv"
        all_ids = [i for i in set(re.findall(r'\"(1[a-zA-Z0-9_\-]{32})\"', html)) if i != fid]
        print(f"Title: {title}")
        print(f"Found {len(all_ids)} files: {all_ids[:15]}")
except Exception as e:
    print(f"Error: {e}")
