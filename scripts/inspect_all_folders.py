import urllib.request
import re

folders = [
    ('1sv_4IWv1aq2OSiLCWyAcrPBS6KZ3P46X', 'folder_1'),
    ('1Pzeiaal5sCKrWUfF5o1EbDlPrBw16L7Z', 'folder_2'),
    ('1zVPGRFPRvnqHf_Mjv4Df-4w0VEpHHIvl', 'folder_3'),
    ('1wwT2xyEyNqbMI5ZiIA2tfx46u6KODTsJ', 'folder_4'),
    ('1GMTw7ZI1toPEF6arMC9tvLWwRPmQGwro', 'folder_5'),
    ('1TEScj0-GHvFIHiuu-RoiZp-JJ9MFIeb', 'folder_6'),
    ('1t9MO9kqH8zMCgp58qHklUf92Sc9CywAM', 'folder_7'),
    ('1dVDyoPq_if4o8zuq5CcVTOsITU1PaWAM', 'folder_8'),
    ('1thPZpCSCC6yKOYLVaWEh7tcMmo9IcSb0', 'folder_9')
]

for fid, default_name in folders:
    url = f"https://drive.google.com/drive/folders/{fid}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            title = 'Unknown'
            m1 = re.search(r'<meta property="og:title" content="([^"]+)"', html)
            if m1:
                title = m1.group(1)
            else:
                m2 = re.search(r'<title>([^<]+)</title>', html)
                if m2:
                    title = m2.group(1).replace(" - Google Drive", "")
            
            all_ids = [i for i in set(re.findall(r'\"(1[a-zA-Z0-9_\-]{32})\"', html)) if i != fid]
            print(f"Folder {fid} | Title: '{title}' | Found {len(all_ids)} files")
    except Exception as e:
        print(f"Folder {fid} | Error: {e}")
