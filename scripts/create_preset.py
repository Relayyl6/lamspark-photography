import urllib.request
import urllib.parse
import base64
import json

api_key = "246591141342366"
api_secret = "tSs1JoTS_r4qn0VvwWqm3ZmSe6k"
cloud_name = "drgwnkllv"

auth_header = "Basic " + base64.b64encode(f"{api_key}:{api_secret}".encode()).decode()

post_data = json.dumps({
    "name": "lamsparks_uploads",
    "unsigned": True,
    "settings": {
        "return_delete_token": True
    }
}).encode('utf-8')

req = urllib.request.Request(
    f"https://api.cloudinary.com/v1_1/{cloud_name}/upload_presets",
    data=post_data,
    headers={
        "Authorization": auth_header,
        "Content-Type": "application/json"
    }
)

try:
    with urllib.request.urlopen(req, timeout=15) as resp:
        print("Create preset SUCCESS:", json.loads(resp.read().decode()))
except Exception as e:
    print("Create preset Error:", e)
    if hasattr(e, 'read'):
        print(e.read().decode())
