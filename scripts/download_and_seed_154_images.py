import os
import json
import urllib.request
import concurrent.futures
from pathlib import Path
import psycopg2
from dotenv import load_dotenv

load_dotenv(".env.local")
if not os.environ.get("DATABASE_URL"):
    load_dotenv(".env")

MANIFEST_PATH = "scripts/full_drive_manifest.json"
BASE_DIR = Path("public/images/client")
BASE_DIR.mkdir(parents=True, exist_ok=True)

with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
    manifest = json.load(f)

tasks = []
for folder_id, data in manifest.items():
    cat = data["category"]
    cat_dir = BASE_DIR / cat
    cat_dir.mkdir(parents=True, exist_ok=True)
    folder_name = data["name"]
    
    for idx, img_id in enumerate(data["ids"]):
        filename = f"{cat}_{idx + 1}.jpg"
        out_path = cat_dir / filename
        web_path = f"/images/client/{cat}/{filename}"
        tasks.append({
            "img_id": img_id,
            "folder_id": folder_id,
            "folder_name": folder_name,
            "category": cat,
            "idx": idx,
            "out_path": out_path,
            "web_path": web_path,
        })

print(f"Total images to process: {len(tasks)}")

def download_image(task):
    out_path = task["out_path"]
    if out_path.exists() and out_path.stat().st_size > 5000:
        return {"status": "exists", "task": task}
    
    img_id = task["img_id"]
    url = f"https://lh3.googleusercontent.com/d/{img_id}=w1600"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            data = resp.read()
            if len(data) < 1000:
                # Try fallback download URL
                fallback = f"https://drive.google.com/uc?id={img_id}&export=download"
                req2 = urllib.request.Request(fallback, headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(req2, timeout=25) as resp2:
                    data = resp2.read()
            with open(out_path, "wb") as f_out:
                f_out.write(data)
            return {"status": "downloaded", "bytes": len(data), "task": task}
    except Exception as e:
        return {"status": "error", "error": str(e), "task": task}

print("Starting concurrent downloads (10 threads)...")
results = []
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
    futures = [executor.submit(download_image, t) for t in tasks]
    for future in concurrent.futures.as_completed(futures):
        res = future.result()
        results.append(res)
        status = res["status"]
        t = res["task"]
        if status == "error":
            print(f"[ERROR] {t['category']} {t['img_id']}: {res['error']}")

success_count = sum(1 for r in results if r["status"] in ("downloaded", "exists"))
print(f"Downloaded/Verified: {success_count} / {len(tasks)} images")

# Seed into Neon DB
print("Seeding into Neon DB: asset, gallery, gallery_item...")
conn = psycopg2.connect(os.environ["DATABASE_URL"])
cur = conn.cursor()

# 1. Map session_type from category
def map_session_type(cat):
    if cat in ("weddings", "wedding"): return "wedding"
    if cat in ("events", "cultural", "memorial"): return "event"
    if cat in ("corporate", "commercial"): return "official-portrait"
    if cat in ("milestones", "toddler"): return "toddler"
    return "maternity"

import uuid
# Ensure galleries exist
galleries = {
    "wedding": ("wedding-gallery", "Sacred Unions & Ceremonies", "Unhurried Abuja weddings capturing timeless grace and authentic connection."),
    "event": ("event-gallery", "Milestone Galas & Gatherings", "Commanding presence, cultural elegance, and milestone moments."),
    "official-portrait": ("official-portrait-gallery", "Executive Gravitas & Portraits", "Quiet authority and dignified presence for leaders and creators."),
    "toddler": ("toddler-gallery", "Unhurried Toddlers & Children", "Gentle child portraits captured at their unscripted, natural pace."),
    "maternity": ("maternity-gallery", "Motherhood & Intimate Glow", "Sculpting gentle shadows for expectant mothers and new beginnings."),
}

gallery_ids = {}
for stype, (slug, title, desc) in galleries.items():
    gid = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"gallery-{slug}"))
    cur.execute(
        """
        INSERT INTO gallery (id, slug, title, description, session_type, display_order, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, 1, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, updated_at = NOW()
        RETURNING id
        """,
        (gid, slug, title, desc, stype)
    )
    row = cur.fetchone()
    gallery_ids[stype] = row[0]

# Insert assets and gallery items
inserted_assets = 0
for task in tasks:
    out_path = task["out_path"]
    if not out_path.exists() or out_path.stat().st_size < 1000:
        continue
    
    stype = map_session_type(task["category"])
    asset_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"ast-{task['category']}-{task['idx']+1}"))
    storage_key = task["web_path"]
    alt_text = f"Editorial portrait from {task['folder_name']}"
    
    cur.execute(
        """
        INSERT INTO asset (id, storage_key, storage_bucket, kind, session_type, alt_text, alt_text_approved, colour_graded, consent_status, created_at, updated_at)
        VALUES (%s, %s, 'public', 'delivered_final', %s, %s, true, true, 'granted', NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET storage_key = EXCLUDED.storage_key, alt_text = EXCLUDED.alt_text, updated_at = NOW()
        """,
        (asset_id, storage_key, stype, alt_text)
    )
    inserted_assets += 1
    
    # Link to gallery_item
    gid = gallery_ids.get(stype)
    if gid:
        item_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"gi-{task['category']}-{task['idx']+1}"))
        cur.execute(
            """
            INSERT INTO gallery_item (id, gallery_id, asset_id, caption, display_order, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
            ON CONFLICT (id) DO UPDATE SET asset_id = EXCLUDED.asset_id, updated_at = NOW()
            """,
            (item_id, gid, asset_id, task["folder_name"], task["idx"] + 1)
        )

# Set gallery covers
for stype, gid in gallery_ids.items():
    cur.execute(
        """
        SELECT asset.id FROM gallery_item
        JOIN asset ON gallery_item.asset_id = asset.id
        WHERE gallery_item.gallery_id = %s
        ORDER BY gallery_item.display_order ASC LIMIT 1
        """,
        (gid,)
    )
    row = cur.fetchone()
    if row:
        cur.execute("UPDATE gallery SET cover_asset_id = %s WHERE id = %s", (row[0], gid))

conn.commit()
conn.close()
print(f"Successfully seeded {inserted_assets} assets and linked into live galleries in Neon DB!")
