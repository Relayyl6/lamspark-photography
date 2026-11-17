import urllib.request
import base64
import json

api_key = "246591141342366"
api_secret = "tSs1JoTS_r4qn0VvwWqm3ZmSe6k"
cloud_name = "drgwnkllv"

auth_header = "Basic " + base64.b64encode(f"{api_key}:{api_secret}".encode()).decode()

endpoints = [
    f"https://api.cloudinary.com/v1_1/{cloud_name}/ping",
    f"https://api.cloudinary.com/v1_1/{cloud_name}/usage",
    f"https://api.cloudinary.com/v1_1/{cloud_name}/upload_presets",
    f"https://api.cloudinary.com/v1_1/{cloud_name}/resources/image"
]

for ep in endpoints:
    req = urllib.request.Request(ep, headers={"Authorization": auth_header})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            print(f"Endpoint {ep.split('/')[-1]} SUCCESS:\n  {data}\n")
    except Exception as e:
        print(f"Endpoint {ep.split('/')[-1]} Error: {e}")
        if hasattr(e, 'read'):
            print(" ", e.read().decode())
