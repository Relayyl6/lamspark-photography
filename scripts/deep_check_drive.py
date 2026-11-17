import urllib.request
import re
import json

test_folders = [
    ("graduation", "1t9MO9kqH8zMCgp58qHklUf92Sc9CywAM"),
    ("wedding_jt", "1thPZpCSCC6yKOYLVaWEh7tcMmo9IcSb0"),
    ("koye_outlet", "1sv_4IWv1aq2OSiLCWyAcrPBS6KZ3P46X"),
    ("events_portfolio", "1Pzeiaal5sCKrWUfF5o1EbDlPrBw16L7Z"),
    ("weddings_main", "1wwT2xyEyNqbMI5ZiIA2tfx46u6KODTsJ"),
    ("woodhall_corp", "1GMTw7ZI1toPEF6arMC9tvLWwRPmQGwro"),
    ("efkas_gala", "1dVDyoPq_if4o8zuq5CcVTOsITU1PaWAM")
]

for name, fid in test_folders:
    url = f"https://drive.google.com/drive/folders/{fid}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            # Look for all occurrences of 28 to 36 char IDs
            # Google Drive JS bootstrap data contains: [..., "FILE_ID", "FILENAME", ...]
            # or `\"(1[a-zA-Z0-9_\-]{28,34})\"`
            found_ids = set(re.findall(r'\"(1[a-zA-Z0-9_\-]{28,34})\"', html))
            print(f"Folder {name}: Found {len(found_ids)} candidate IDs")
            # Also look for filename matches like .jpg
            filenames = re.findall(r'[\w\-_\.]+\.(?:jpe?g|png)', html, re.IGNORECASE)
            print(f"  Filenames in HTML: {len(filenames)} -> {filenames[:6]}")
    except Exception as e:
        print(f"Error {name}: {e}")
