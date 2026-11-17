import urllib.request
import urllib.parse
import json

cloud_name = "drgwnkllv"
test_id = "1DAghr5zlwa2X8S_J0-YkS2pW6HdIfzgs"
image_url = f"https://lh3.googleusercontent.com/d/{test_id}=w1200"

# Test unsigned upload presets
presets = ["ml_default", "default", "unsigned", "preset_1", "unsigned_preset", "lamsparks"]

for preset in presets:
    post_data = urllib.parse.urlencode({
        "file": image_url,
        "upload_preset": preset
    }).encode('utf-8')
    req = urllib.request.Request(f"https://api.cloudinary.com/v1_1/{cloud_name}/image/upload", data=post_data)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            res = json.loads(resp.read().decode('utf-8'))
            print(f"Preset {preset} SUCCESS:", res.get("secure_url"))
            break
    except Exception as e:
        print(f"Preset {preset}: {e}")
