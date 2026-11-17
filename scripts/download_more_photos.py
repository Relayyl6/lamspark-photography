import urllib.request
import re
import os

other_folders = [
    ("1t9MO9kqH8zMCgp58qHklUf92Sc9CywAM", "graduation"),
    ("1dVDyoPq_if4o8zuq5CcVTOsITU1PaWAM", "gala"),
    ("1thPZpCSCC6yKOYLVaWEh7tcMmo9IcSb0", "wedding_jt"),
    ("1sv_4IWv1aq2OSiLCWyAcrPBS6KZ3P46X", "commercial"),
    ("1zVPGRFPRvnqHf_Mjv4Df-4w0VEpHHIvl", "memorial")
]

for fid, cat in other_folders:
    url = f"https://drive.google.com/drive/folders/{fid}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            # Look for all matches of 28-40 length base64-like drive IDs
            # in Google Drive, the file entries often appear inside arrays like [[null,"1xxxx...",...]]
            ids = re.findall(r'\"([a-zA-Z0-9_-]{33})\"', html)
            print(f"Cat: {cat}, found 33-char IDs: {len(set(ids))}")
            count = 0
            for i in set(ids):
                if count >= 3:
                    break
                # Try direct download URL
                test_urls = [
                    f"https://drive.google.com/uc?export=download&id={i}",
                    f"https://lh3.googleusercontent.com/d/{i}=w1200",
                    f"https://drive.google.com/thumbnail?id={i}&sz=w1000"
                ]
                for tu in test_urls:
                    try:
                        treq = urllib.request.Request(tu, headers={"User-Agent": "Mozilla/5.0"})
                        with urllib.request.urlopen(treq, timeout=8) as tresp:
                            data = tresp.read()
                            ct = tresp.headers.get("Content-Type", "")
                            if len(data) > 10000 and ("image" in ct or ct == "application/octet-stream"):
                                with open(f"public/images/client/{cat}_{count+1}.jpg", "wb") as f:
                                    f.write(data)
                                print(f"  Saved {cat}_{count+1}.jpg ({len(data)} bytes)")
                                count += 1
                                break
                    except Exception:
                        pass
    except Exception as e:
        print(f"Error {cat}: {e}")
