import urllib.request
import re
import json
import os

folders = [
    "1sv_4IWv1aq2OSiLCWyAcrPBS6KZ3P46X",
    "1Pzeiaal5sCKrWUfF5o1EbDlPrBw16L7Z",
    "1zVPGRFPRvnqHf_Mjv4Df-4w0VEpHHIvl",
    "1wwT2xyEyNqbMI5ZiIA2tfx46u6KODTsJ",
    "1GMTw7ZI1toPEF6arMC9tvLWwRPmQGwro",
    "1TEScj0-GHvFIHiuu-RoiZp-JJ9MFIeb",
    "1t9MO9kqH8zMCgp58qHklUf92Sc9CywAM",
    "1dVDyoPq_if4o8zuq5CcVTOsITU1PaWAM",
    "1thPZpCSCC6yKOYLVaWEh7tcMmo9IcSb0"
]

for fid in folders:
    url = f"https://drive.google.com/drive/folders/{fid}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            title_m = re.search(r'<title>(.*?)</title>', html)
            title = title_m.group(1) if title_m else "No title"
            print(f"Folder {fid}: Title = '{title}' (HTML len: {len(html)})")
            
            # Check for JSON data or file IDs
            # Look for filenames like .jpg, .png, etc.
            img_names = re.findall(r'[\w\-_\.]+\.(?:jpg|jpeg|png|webp|JPG|PNG)', html)
            print(f"  Images mentioned: {len(set(img_names))} -> {list(set(img_names))[:5]}")
    except Exception as e:
        print(f"Folder {fid}: Error {e}")
