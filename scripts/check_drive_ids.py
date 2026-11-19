import urllib.request
import re

folders = [
    ("KOYE ABUJA OUTLET", "1sv_4IWv1aq2OSiLCWyAcrPBS6KZ3P46X"),
    ("ENGR. IGNINAKE SAMUEL FUNERAL", "1zVPGRFPRvnqHf_Mjv4Df-4w0VEpHHIvl"),
    ("BRIBENA OYINTARE ISABEL", "1t9MO9kqH8zMCgp58qHklUf92Sc9CywAM"),
    ("EFKAS 24'", "1dVDyoPq_if4o8zuq5CcVTOsITU1PaWAM"),
]

for name, fid in folders:
    url = f"https://drive.google.com/drive/folders/{fid}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            html = r.read().decode("utf-8", errors="ignore")
            # find all 33-char drive IDs starting with 1
            raw_ids = set(re.findall(r'["\'](1[a-zA-Z0-9_-]{32})["\']', html))
            raw_ids.discard(fid)
            # test which are working images
            valid = []
            for tid in raw_ids:
                turl = f"https://lh3.googleusercontent.com/d/{tid}=s220"
                treq = urllib.request.Request(turl, headers={"User-Agent": "Mozilla/5.0"})
                try:
                    with urllib.request.urlopen(treq, timeout=3) as tr:
                        if tr.status == 200:
                            valid.append(tid)
                except:
                    pass
            print(f"{name}: found {len(valid)} working IDs out of {len(raw_ids)} candidates: {valid}")
    except Exception as e:
        print(f"{name} Error: {e}")
