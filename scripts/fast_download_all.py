import urllib.request
import re
import os
import json
from concurrent.futures import ThreadPoolExecutor, as_completed

sessions = [
    {
        "category": "weddings",
        "title": "Sacred Unions & Luxury Nigerian Weddings",
        "session_type": "wedding",
        "folders": ["1wwT2xyEyNqbMI5ZiIA2tfx46u6KODTsJ", "1thPZpCSCC6yKOYLVaWEh7tcMmo9IcSb0"]
    },
    {
        "category": "corporate",
        "title": "Executive Leadership & Bilateral MOU Ceremonies",
        "session_type": "corporate",
        "folders": ["1GMTw7ZI1toPEF6arMC9tvLWwRPmQGwro"]
    },
    {
        "category": "events",
        "title": "Grand Galas, Banquets & Milestone Celebrations",
        "session_type": "event",
        "folders": ["1Pzeiaal5sCKrWUfF5o1EbDlPrBw16L7Z"]
    },
    {
        "category": "milestones",
        "title": "Milestone Portraits & Academic Graduation",
        "session_type": "portrait",
        "folders": ["1t9MO9kqH8zMCgp58qHklUf92Sc9CywAM"]
    },
    {
        "category": "cultural",
        "title": "Cultural Heritage & Haute Couture",
        "session_type": "cultural",
        "folders": ["1dVDyoPq_if4o8zuq5CcVTOsITU1PaWAM"]
    },
    {
        "category": "commercial",
        "title": "Atelier Architectural & Retail Spaces",
        "session_type": "commercial",
        "folders": ["1sv_4IWv1aq2OSiLCWyAcrPBS6KZ3P46X"]
    },
    {
        "category": "memorial",
        "title": "Generational Legacy & Celebration of Life",
        "session_type": "memorial",
        "folders": ["1zVPGRFPRvnqHf_Mjv4Df-4w0VEpHHIvl"]
    }
]

base_dir = "public/images/client"
os.makedirs(base_dir, exist_ok=True)

def download_one_file(file_id, filepath):
    if os.path.exists(filepath) and os.path.getsize(filepath) > 20000:
        return True
    
    # Try thumbnail endpoint
    thumb_url = f"https://drive.google.com/thumbnail?id={file_id}&sz=w1400"
    try:
        req = urllib.request.Request(thumb_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = resp.read()
            if len(data) > 15000:
                with open(filepath, "wb") as f:
                    f.write(data)
                return True
    except Exception:
        pass
        
    # Try lh3 endpoint
    try:
        lh3_url = f"https://lh3.googleusercontent.com/d/{file_id}=w1200"
        req = urllib.request.Request(lh3_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = resp.read()
            if len(data) > 15000:
                with open(filepath, "wb") as f:
                    f.write(data)
                return True
    except Exception:
        pass
    
    return False

manifest = []

for s in sessions:
    cat = s["category"]
    cat_dir = os.path.join(base_dir, cat)
    os.makedirs(cat_dir, exist_ok=True)
    
    all_file_ids = []
    for fid in s["folders"]:
        url = f"https://drive.google.com/drive/folders/{fid}"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                html = resp.read().decode('utf-8', errors='ignore')
                fids = [i for i in set(re.findall(r'\"(1[a-zA-Z0-9_\-]{32})\"', html)) if i != fid]
                all_file_ids.extend(fids)
        except Exception as e:
            print(f"[{cat}] Error fetching folder {fid}: {e}", flush=True)
            
    # Deduplicate while preserving order
    unique_ids = list(dict.fromkeys(all_file_ids))
    print(f"[{cat}] Found {len(unique_ids)} files to fetch (target: up to 12)...", flush=True)
    
    cat_images = []
    
    # Download concurrently
    tasks = []
    with ThreadPoolExecutor(max_workers=8) as executor:
        idx = 1
        for file_id in unique_ids[:14]:
            filename = f"{cat}_{idx}.jpg"
            filepath = os.path.join(cat_dir, filename)
            rel_url = f"/images/client/{cat}/{filename}"
            tasks.append((executor.submit(download_one_file, file_id, filepath), rel_url, file_id, idx, s["title"], s["session_type"]))
            idx += 1
            
        for future, rel_url, file_id, img_idx, title, session_type in tasks:
            success = future.result()
            if success:
                cat_images.append({
                    "id": f"{cat}-{img_idx}",
                    "file_id": file_id,
                    "url": rel_url,
                    "category": cat,
                    "session_type": session_type,
                    "title": f"{title} #{img_idx}"
                })
                print(f"  ✓ [{cat}] Success: {rel_url}", flush=True)
                
    print(f"[{cat}] DONE with {len(cat_images)} images.\n", flush=True)
    manifest.append({
        "category": cat,
        "title": s["title"],
        "session_type": s["session_type"],
        "images": cat_images
    })

with open("public/images/client/manifest.json", "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2)

print("ALL SESSIONS PROCESSED. manifest.json written successfully!", flush=True)
