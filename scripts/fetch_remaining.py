import urllib.request
import re
import json

targets = [
    ("graduation", "1t9MO9kqH8zMCgp58qHklUf92Sc9CywAM"),
    ("gala", "1dVDyoPq_if4o8zuq5CcVTOsITU1PaWAM"),
    ("wedding_jt", "1thPZpCSCC6yKOYLVaWEh7tcMmo9IcSb0"),
    ("commercial", "1sv_4IWv1aq2OSiLCWyAcrPBS6KZ3P46X"),
    ("memorial", "1zVPGRFPRvnqHf_Mjv4Df-4w0VEpHHIvl")
]

for name, fid in targets:
    url = f"https://drive.google.com/drive/folders/{fid}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            # Look for all matches of file IDs
            # In Drive, file data has `[null,"1...",` or `"1...",`
            all_ids = re.findall(r'\"(1[a-zA-Z0-9_\-]{32})\"', html)
            print(f"Target {name}: {len(set(all_ids))} IDs: {list(set(all_ids))[:4]}")
            count = 0
            for i in set(all_ids):
                if count >= 3:
                    break
                # Download thumbnail
                t_url = f"https://drive.google.com/thumbnail?id={i}&sz=w1200"
                try:
                    treq = urllib.request.Request(t_url, headers={"User-Agent": "Mozilla/5.0"})
                    with urllib.request.urlopen(treq, timeout=8) as tr:
                        data = tr.read()
                        if len(data) > 15000:
                            path = f"public/images/client/{name}_{count+1}.jpg"
                            with open(path, "wb") as f:
                                f.write(data)
                            print(f"  Successfully saved {path} ({len(data)} bytes)")
                            count += 1
                except Exception as ex:
                    pass
    except Exception as e:
        print(f"Error {name}: {e}")
