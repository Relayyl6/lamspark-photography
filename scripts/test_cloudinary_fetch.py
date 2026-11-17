import urllib.request

cloud_name = "drgwnkllv"
test_id = "1DAghr5zlwa2X8S_J0-YkS2pW6HdIfzgs"
img_src = f"https://lh3.googleusercontent.com/d/{test_id}=w1200"

fetch_url = f"https://res.cloudinary.com/{cloud_name}/image/fetch/f_auto,q_auto,w_800/{img_src}"
print(f"Testing fetch URL: {fetch_url}")

try:
    req = urllib.request.Request(fetch_url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        print("Fetch SUCCESS!")
        print("Status:", resp.status)
        print("Content-Type:", resp.headers.get("Content-Type"))
        print("Bytes:", len(resp.read()))
except Exception as e:
    print("Fetch error:", e)
    if hasattr(e, 'read'):
        print(e.read().decode('utf-8'))
