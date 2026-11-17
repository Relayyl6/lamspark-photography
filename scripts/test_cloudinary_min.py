import time
import hashlib
import urllib.request
import urllib.parse
import json

api_key = "246591141342366"
api_secret = "tSs1JoTS_r4qn0VvwWqm3ZmSe6k"
cloud_name = "drgwnkllv"
test_id = "1DAghr5zlwa2X8S_J0-YkS2pW6HdIfzgs"
image_url = f"https://lh3.googleusercontent.com/d/{test_id}=w1200"

# Test 1: Just timestamp and file
timestamp = str(int(time.time()))
to_sign = f"timestamp={timestamp}{api_secret}"
signature = hashlib.sha1(to_sign.encode('utf-8')).hexdigest()

post_data = urllib.parse.urlencode({
    "file": image_url,
    "timestamp": timestamp,
    "api_key": api_key,
    "signature": signature
}).encode('utf-8')

upload_url = f"https://api.cloudinary.com/v1_1/{cloud_name}/image/upload"
req = urllib.request.Request(upload_url, data=post_data, headers={"User-Agent": "Mozilla/5.0"})

try:
    with urllib.request.urlopen(req, timeout=30) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        print("Test 1 SUCCESS:", res.get("secure_url"))
except Exception as e:
    print("Test 1 Error:", e)
    if hasattr(e, 'read'):
        print(e.read().decode('utf-8'))

# Test 2: Base64 data upload directly
print("\nTesting Test 2: Upload base64 bytes...")
try:
    img_req = urllib.request.Request(image_url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(img_req, timeout=15) as img_resp:
        img_bytes = img_resp.read()
        import base64
        b64_str = "data:image/jpeg;base64," + base64.b64encode(img_bytes).decode('ascii')
        
        timestamp = str(int(time.time()))
        to_sign = f"timestamp={timestamp}{api_secret}"
        signature = hashlib.sha1(to_sign.encode('utf-8')).hexdigest()
        post_data2 = urllib.parse.urlencode({
            "file": b64_str,
            "timestamp": timestamp,
            "api_key": api_key,
            "signature": signature
        }).encode('utf-8')
        req2 = urllib.request.Request(upload_url, data=post_data2, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req2, timeout=30) as resp2:
            res2 = json.loads(resp2.read().decode('utf-8'))
            print("Test 2 SUCCESS:", res2.get("secure_url"))
except Exception as e:
    print("Test 2 Error:", e)
    if hasattr(e, 'read'):
        print(e.read().decode('utf-8'))
