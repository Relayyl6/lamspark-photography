import urllib.request
import re

folders = [
    ("1sv_4IWv1aq2OSiLCWyAcrPBS6KZ3P46X", "KOYE ABUJA OUTLET"),
    ("1Pzeiaal5sCKrWUfF5o1EbDlPrBw16L7Z", "EVENTS PORTFOLIO"),
    ("1zVPGRFPRvnqHf_Mjv4Df-4w0VEpHHIvl", "ENGR. IGNINAKE SAMUEL FUNERAL"),
    ("1wwT2xyEyNqbMI5ZiIA2tfx46u6KODTsJ", "WEDDINGS"),
    ("1GMTw7ZI1toPEF6arMC9tvLWwRPmQGwro", "WOODHALL MOU 6TH NOVEMBER,2025"),
    ("1TEScj0-GHvFIHiuu-RoiZp-JJ9MFleb", "Folder 6"),
    ("1t9MO9kqH8zMCgp58qHklUf92Sc9CywAM", "BRIBENA OYINTARE ISABEL"),
    ("1dVDyoPq_if4o8zuq5CcVTOslTU1PaWAM", "EFKAS 24'"),
    ("1thPZpCSCC6yK0YLVaWEh7tcMmo9IcSsb0", "JESSICA AND TUNJI WEDDING"),
    ("1DfQPXjFBILM-LcXe6es8VLtEd8-aZMDv", "FILES TO SEND FOR WEBSITE")
]

all_files = {}

for fid, label in folders:
    url = f"https://drive.google.com/drive/folders/{fid}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            title = label
            m = re.search(r'<title>([^<]+)</title>', html)
            if m:
                title = m.group(1).replace(" - Google Drive", "")
            
            ids = [i for i in set(re.findall(r'\"(1[a-zA-Z0-9_\-]{32})\"', html)) if i != fid]
            all_files[fid] = {"title": title, "ids": ids}
            print(f"[{label}] ({title}): {len(ids)} files found")
    except Exception as e:
        print(f"[{label}] Error: {e}")

import json
with open("scripts/drive_audit.json", "w") as f:
    json.dump(all_files, f, indent=2)
print("Saved drive_audit.json")
