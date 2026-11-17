import urllib.request
import re
import os
import time

remaining = [
    ("commercial", "1sv_4IWv1aq2OSiLCWyAcrPBS6KZ3P46X", "Atelier Architectural & Retail Spaces", "commercial"),
    ("memorial", "1zVPGRFPRvnqHf_Mjv4Df-4w0VEpHHIvl", "Generational Legacy & Celebration of Life", "memorial"),
    ("milestones", "1t9MO9kqH8zMCgp58qHklUf92Sc9CywAM", "Milestone Portraits & Academic Graduation", "portrait"),
    ("cultural", "1dVDyoPq_if4o8zuq5CcVTOsITU1PaWAM", "Cultural Heritage & Haute Couture", "cultural")
]

base_dir = "public/images/client"

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

for cat, fid, title, session_type in remaining:
    cat_dir = os.path.join(base_dir, cat)
    os.makedirs(cat_dir, exist_ok=True)
    print(f"\nProcessing {cat} ({fid})...")
    time.sleep(2)
    
    url = f"https://drive.google.com/drive/folders/{fid}"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            all_ids = [i for i in set(re.findall(r'\"(1[a-zA-Z0-9_\-]{32})\"', html)) if i != fid]
            print(f"  Found {len(all_ids)} files in {cat}")
            
            count = 0
            for file_id in all_ids:
                if count >= 8:
                    break
                filename = f"{cat}_{count+1}.jpg"
                filepath = os.path.join(cat_dir, filename)
                root_filepath = os.path.join(base_dir, filename)
                
                # Fetch thumbnail
                thumb_url = f"https://drive.google.com/thumbnail?id={file_id}&sz=w1400"
                try:
                    treq = urllib.request.Request(thumb_url, headers=headers)
                    with urllib.request.urlopen(treq, timeout=10) as tresp:
                        data = tresp.read()
                        if len(data) > 10000:
                            with open(filepath, "wb") as f:
                                f.write(data)
                            with open(root_filepath, "wb") as f:
                                f.write(data)
                            print(f"  ✓ Downloaded {filename} ({len(data)} bytes)")
                            count += 1
                except Exception as ex:
                    print(f"  x Error downloading {file_id}: {ex}")
                time.sleep(0.5)
    except Exception as e:
        print(f"Error fetching folder {cat}: {e}")

print("\nPolite fetch finished!")
