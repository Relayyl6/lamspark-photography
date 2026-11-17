import urllib.request
import urllib.parse
import json

api = "https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=photographer%20filetype:bitmap%20filetype:png&srnamespace=6&format=json"
req = urllib.request.Request(api, headers={"User-Agent": "AntigravityApp/1.0 (contact@example.com)"})
try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode())
        results = data.get("query", {}).get("search", [])
        print(f"Found {len(results)} results")
        for r in results[:5]:
            print(r["title"])
except Exception as e:
    print(e)
