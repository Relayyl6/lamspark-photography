import urllib.request
import re
import os
import json

folders = [
    ("1Pzeiaal5sCKrWUfF5o1EbDlPrBw16L7Z", "events"),
    ("1wwT2xyEyNqbMI5ZiIA2tfx46u6KODTsJ", "weddings"),
    ("1GMTw7ZI1toPEF6arMC9tvLWwRPmQGwro", "corporate"),
    ("1t9MO9kqH8zMCgp58qHklUf92Sc9CywAM", "graduation"),
    ("1dVDyoPq_if4o8zuq5CcVTOsITU1PaWAM", "gala"),
    ("1thPZpCSCC6yKOYLVaWEh7tcMmo9IcSb0", "wedding_jt"),
    ("1sv_4IWv1aq2OSiLCWyAcrPBS6KZ3P46X", "commercial"),
    ("1zVPGRFPRvnqHf_Mjv4Df-4w0VEpHHIvl", "memorial")
]

os.makedirs("public/images/client", exist_ok=True)
downloaded_manifest = {}

for fid, cat in folders:
    url = f"https://drive.google.com/drive/folders/{fid}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            # Extract file IDs
            # Pattern: 28-35 alphanumeric chars associated with image extensions or in JSON arrays
            file_ids = list(set(re.findall(r'\"(1[a-zA-Z0-9_-]{28,35})\"', html)))
            print(f"\nCategory: {cat} (Folder {fid}) -> Found {len(file_ids)} candidate IDs")
            
            cat_downloads = []
            count = 0
            for file_id in file_ids:
                if count >= 4:  # Get top 4 best images per category
                    break
                # Try downloading thumbnail w=1400
                img_url = f"https://drive.google.com/thumbnail?id={file_id}&sz=w1400"
                out_path = f"public/images/client/{cat}_{count+1}.jpg"
                try:
                    img_req = urllib.request.Request(img_url, headers={"User-Agent": "Mozilla/5.0"})
                    with urllib.request.urlopen(img_req, timeout=12) as img_resp:
                        data = img_resp.read()
                        if len(data) > 15000 and img_resp.headers.get("Content-Type", "").startswith("image"):
                            with open(out_path, "wb") as f:
                                f.write(data)
                            print(f"  Downloaded: {out_path} ({len(data)} bytes)")
                            cat_downloads.append({
                                "id": file_id,
                                "path": f"/images/client/{cat}_{count+1}.jpg",
                                "bytes": len(data),
                                "category": cat
                            })
                            count += 1
                except Exception as ex:
                    # Ignore non-image IDs
                    pass
            downloaded_manifest[cat] = cat_downloads
    except Exception as e:
        print(f"Failed folder {cat}: {e}")

with open("public/images/client/manifest.json", "w", encoding="utf-8") as f:
    json.dump(downloaded_manifest, f, indent=2)

print("\nFinished downloading client images! Total categories:", len(downloaded_manifest))
