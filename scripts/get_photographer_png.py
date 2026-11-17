import urllib.request
import json

# Let's search Wikimedia Commons or open source transparent photographer PNGs
urls = [
    # Wikimedia Commons high-res photographer cutouts / PNGs
    "https://upload.wikimedia.org/wikipedia/commons/4/4b/Photographer_silhouette.png",
    "https://pngimg.com/d/photographer_PNG44.png",
    "https://pngimg.com/d/photographer_PNG21.png",
    "https://pngimg.com/d/photographer_PNG27.png",
    "https://pngimg.com/d/photographer_PNG36.png",
    "https://pngimg.com/d/photographer_PNG52.png"
]

for idx, u in enumerate(urls):
    try:
        req = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = resp.read()
            if len(data) > 20000 and resp.headers.get("Content-Type", "").startswith("image"):
                out = f"public/images/photographer_cutout_{idx+1}.png"
                with open(out, "wb") as f:
                    f.write(data)
                print(f"Downloaded {out} ({len(data)} bytes) from {u}")
    except Exception as e:
        print(f"Failed {u}: {e}")
