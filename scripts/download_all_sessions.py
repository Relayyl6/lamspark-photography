import urllib.request
import re
import os
import json

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

manifest = []

for s in sessions:
    cat = s["category"]
    cat_dir = os.path.join(base_dir, cat)
    os.makedirs(cat_dir, exist_ok=True)
    
    cat_images = []
    
    for fid in s["folders"]:
        url = f"https://drive.google.com/drive/folders/{fid}"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        try:
            with urllib.request.urlopen(req, timeout=12) as resp:
                html = resp.read().decode('utf-8', errors='ignore')
                all_ids = [i for i in set(re.findall(r'\"(1[a-zA-Z0-9_\-]{32})\"', html)) if i != fid]
                print(f"[{cat}] Folder {fid}: found {len(all_ids)} files")
                
                count = 0
                for file_id in all_ids:
                    # Limit per folder to ensure fast download and crisp gallery balance
                    if count >= 12:
                        break
                    
                    filename = f"{cat}_{len(cat_images)+1}.jpg"
                    filepath = os.path.join(cat_dir, filename)
                    rel_url = f"/images/client/{cat}/{filename}"
                    
                    if os.path.exists(filepath) and os.path.getsize(filepath) > 20000:
                        cat_images.append({
                            "id": f"{cat}-{len(cat_images)+1}",
                            "file_id": file_id,
                            "url": rel_url,
                            "path": filepath,
                            "category": cat,
                            "session_type": s["session_type"],
                            "title": f"{s['title']} #{len(cat_images)+1}"
                        })
                        count += 1
                        continue
                    
                    # Fetch w=1400 thumbnail for sharp display & fast loading
                    thumb_url = f"https://drive.google.com/thumbnail?id={file_id}&sz=w1400"
                    try:
                        treq = urllib.request.Request(thumb_url, headers={"User-Agent": "Mozilla/5.0"})
                        with urllib.request.urlopen(treq, timeout=12) as tresp:
                            data = tresp.read()
                            if len(data) > 15000:
                                with open(filepath, "wb") as f:
                                    f.write(data)
                                print(f"  Downloaded: {rel_url} ({len(data)} bytes)")
                                cat_images.append({
                                    "id": f"{cat}-{len(cat_images)+1}",
                                    "file_id": file_id,
                                    "url": rel_url,
                                    "path": filepath,
                                    "category": cat,
                                    "session_type": s["session_type"],
                                    "title": f"{s['title']} #{len(cat_images)+1}"
                                })
                                count += 1
                    except Exception as err:
                        # try lh3 direct endpoint as fallback
                        try:
                            lh3_url = f"https://lh3.googleusercontent.com/d/{file_id}=w1200"
                            lreq = urllib.request.Request(lh3_url, headers={"User-Agent": "Mozilla/5.0"})
                            with urllib.request.urlopen(lreq, timeout=12) as lresp:
                                data = lresp.read()
                                if len(data) > 15000:
                                    with open(filepath, "wb") as f:
                                        f.write(data)
                                    print(f"  Downloaded via lh3: {rel_url} ({len(data)} bytes)")
                                    cat_images.append({
                                        "id": f"{cat}-{len(cat_images)+1}",
                                        "file_id": file_id,
                                        "url": rel_url,
                                        "path": filepath,
                                        "category": cat,
                                        "session_type": s["session_type"],
                                        "title": f"{s['title']} #{len(cat_images)+1}"
                                    })
                                    count += 1
                        except Exception:
                            pass
        except Exception as e:
            print(f"Error fetching folder {fid}: {e}")
            
    print(f"Finished {cat}: {len(cat_images)} total authentic client photos.")
    manifest.append({
        "category": cat,
        "title": s["title"],
        "session_type": s["session_type"],
        "images": cat_images
    })

with open("public/images/client/manifest.json", "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2)

print("\nWrote public/images/client/manifest.json successfully!")
