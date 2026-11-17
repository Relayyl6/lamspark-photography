import os
import time
import hashlib
import urllib.request
import urllib.parse
import json

# Read credentials from .env.local
env_vars = {}
with open(".env.local", "r", encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            env_vars[k.strip()] = v.strip().strip('"').strip("'")

cloud_name = env_vars.get("CLOUDINARY_CLOUD_NAME") or env_vars.get("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME")
api_key = env_vars.get("CLOUDINARY_API_KEY")
api_secret = env_vars.get("CLOUDINARY_API_SECRET")

print(f"Cloud Name: {cloud_name}")
print(f"API Key: {api_key}")
print(f"Secret present: {bool(api_secret)}")

# Let's test uploading test image using Cloudinary REST API
# Image source: direct Google Drive thumbnail
test_id = "1DAghr5zlwa2X8S_J0-YkS2pW6HdIfzgs"
image_url = f"https://lh3.googleusercontent.com/d/{test_id}=w1200"

timestamp = str(int(time.time()))
public_id = "lamsparks_events_01"
folder = "lamsparks_portfolio"

# Cloudinary signature requires params in alphabetical order
to_sign = f"folder={folder}&public_id={public_id}&timestamp={timestamp}{api_secret}"
signature = hashlib.sha1(to_sign.encode('utf-8')).hexdigest()

post_data = urllib.parse.urlencode({
    "file": image_url,
    "folder": folder,
    "public_id": public_id,
    "timestamp": timestamp,
    "api_key": api_key,
    "signature": signature
}).encode('utf-8')

upload_url = f"https://api.cloudinary.com/v1_1/{cloud_name}/image/upload"
req = urllib.request.Request(upload_url, data=post_data, headers={"User-Agent": "Mozilla/5.0"})

try:
    with urllib.request.urlopen(req, timeout=30) as resp:
        result = json.loads(resp.read().decode('utf-8'))
        print("Upload SUCCESS!")
        print("Secure URL:", result.get("secure_url"))
        print("Format:", result.get("format"), "Width:", result.get("width"), "Height:", result.get("height"))
        # Show optimized delivery URL
        opt_url = result.get("secure_url").replace("/upload/", "/upload/f_auto,q_auto,w_1000/")
        print("Optimized URL:", opt_url)
except Exception as e:
    print("Upload error:", e)
    if hasattr(e, 'read'):
        print(e.read().decode('utf-8'))
