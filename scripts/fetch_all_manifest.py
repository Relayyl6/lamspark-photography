import urllib.request
import re
import json

folders = [
    ("1sv_4IWv1aq2OSiLCWyAcrPBS6KZ3P46X", "KOYE ABUJA OUTLET", "commercial"),
    ("1Pzeiaal5sCKrWUfF5o1EbDlPrBw16L7Z", "EVENTS PORTFOLIO", "events"),
    ("1zVPGRFPRvnqHf_Mjv4Df-4w0VEpHHIvl", "ENGR. IGNINAKE SAMUEL FUNERAL", "memorial"),
    ("1wwT2xyEyNqbMI5ZiIA2tfx46u6KODTsJ", "WEDDINGS", "weddings"),
    ("1GMTw7ZI1toPEF6arMC9tvLWwRPmQGwro", "WOODHALL MOU", "corporate"),
    ("1t9MO9kqH8zMCgp58qHklUf92Sc9CywAM", "BRIBENA OYINTARE ISABEL", "milestones"),
    ("1dVDyoPq_if4o8zuq5CcVTOsITU1PaWAM", "EFKAS 24'", "cultural"),
    ("1thPZpCSCC6yKOYLVaWEh7tcMmo9IcSb0", "JESSICA AND TUNJI WEDDING", "weddings"),
    ("1DfQPXjFBILM-LcXe6es8VLtEd8-aZMDv", "FILES TO SEND FOR WEBSITE", "curated_master")
]

audit = {}
for fid, name, cat in folders:
    url = f"https://drive.google.com/drive/folders/{fid}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            ids = [i for i in set(re.findall(r'\"(1[a-zA-Z0-9_\-]{32})\"', html)) if i != fid]
            audit[fid] = {
                "name": name,
                "category": cat,
                "count": len(ids),
                "ids": ids
            }
            print(f"[{name}] {len(ids)} files")
    except Exception as e:
        print(f"[{name}] Error: {e}")

with open("scripts/full_drive_manifest.json", "w") as f:
    json.dump(audit, f, indent=2)

total_unique = len(set([i for f in audit.values() for i in f["ids"]]))
print(f"Total Unique Images Across All Valid Drive Folders: {total_unique}")
