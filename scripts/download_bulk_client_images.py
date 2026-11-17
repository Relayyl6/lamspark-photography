import urllib.request
import re
import os

folders = [
    ("events", "1Pzeiaal5sCKrWUfF5o1EbDlPrBw16L7Z", 12),
    ("weddings", "1wwT2xyEyNqbMI5ZiIA2tfx46u6KODTsJ", 12),
    ("corporate", "1GMTw7ZI1toPEF6arMC9tvLWwRPmQGwro", 12)
]

os.makedirs("public/images/client", exist_ok=True)
downloaded = []

for cat, fid, max_count in folders:
    url = f"https://drive.google.com/drive/folders/{fid}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            # Extract 28 to 35 length alphanumeric drive IDs
            # Specifically exclude the folder ID itself
            all_ids = [i for i in set(re.findall(r'\"(1[a-zA-Z0-9_\-]{32})\"', html)) if i != fid]
            print(f"Cat {cat}: {len(all_ids)} potential IDs")
            
            count = 0
            for file_id in all_ids:
                if count >= max_count:
                    break
                out_path = f"public/images/client/{cat}_{count+1}.jpg"
                # If already exists and is > 30KB, count it and continue
                if os.path.exists(out_path) and os.path.getsize(out_path) > 30000:
                    count += 1
                    downloaded.append(out_path)
                    continue
                
                # Download thumbnail w=1400 for high resolution and fast loading
                thumb_url = f"https://drive.google.com/thumbnail?id={file_id}&sz=w1400"
                try:
                    treq = urllib.request.Request(thumb_url, headers={"User-Agent": "Mozilla/5.0"})
                    with urllib.request.urlopen(treq, timeout=10) as tresp:
                        data = tresp.read()
                        if len(data) > 20000 and tresp.headers.get("Content-Type", "").startswith("image"):
                            with open(out_path, "wb") as f:
                                f.write(data)
                            print(f"  ✓ Downloaded {out_path} ({len(data)} bytes)")
                            downloaded.append(out_path)
                            count += 1
                except Exception as ex:
                    pass
    except Exception as e:
        print(f"Error {cat}: {e}")

print(f"\nTotal authentic client images available in public/images/client: {len(downloaded)}")
