import urllib.request

test_id = "1DAghr5zlwa2X8S_J0-YkS2pW6HdIfzgs"
test_urls = [
    f"https://drive.google.com/thumbnail?id={test_id}&sz=w1000",
    f"https://lh3.googleusercontent.com/d/{test_id}=w1000",
    f"https://drive.google.com/uc?export=download&id={test_id}"
]

for u in test_urls:
    try:
        req = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = resp.read()
            print(f"URL: {u}\n  Status: {resp.status}, Content-Type: {resp.headers.get('Content-Type')}, Bytes: {len(data)}")
    except Exception as e:
        print(f"URL: {u}\n  Error: {e}")
