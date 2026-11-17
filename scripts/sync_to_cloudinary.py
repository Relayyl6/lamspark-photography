import os
import time
import hashlib
import urllib.request
import urllib.parse
import json
import glob

# Load credentials strictly from .env.local
env = {}
with open(".env.local", "r", encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip().strip('"').strip("'")

cloud_name = env.get("CLOUDINARY_CLOUD_NAME") or "drgwnkllv"
api_key = env.get("CLOUDINARY_API_KEY")
api_secret = env.get("CLOUDINARY_API_SECRET")

if not api_key or not api_secret:
    print("Error: Missing Cloudinary credentials in .env.local")
    exit(1)

print(f"Syncing local client images to Cloudinary (Cloud: {cloud_name})...")

files = glob.glob("public/images/client/*.jpg")
for fpath in files:
    filename = os.path.basename(fpath)
    public_id = f"lamsparks/{os.path.splitext(filename)[0]}"
    timestamp = str(int(time.time()))
    
    with open(fpath, "rb") as img_file:
        import base64
        b64 = "data:image/jpeg;base64," + base64.b64encode(img_file.read()).decode('ascii')
    
    to_sign = f"public_id={public_id}&timestamp={timestamp}{api_secret}"
    signature = hashlib.sha1(to_sign.encode('utf-8')).hexdigest()
    
    post_data = urllib.parse.urlencode({
        "file": b64,
        "public_id": public_id,
        "timestamp": timestamp,
        "api_key": api_key,
        "signature": signature
    }).encode('utf-8')
    
    req = urllib.request.Request(f"https://api.cloudinary.com/v1_1/{cloud_name}/image/upload", data=post_data)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode())
            print(f"✓ Uploaded {filename} -> {data.get('secure_url')}")
    except Exception as e:
        print(f"✗ Failed {filename}: {e}")

print("Sync completed!")
